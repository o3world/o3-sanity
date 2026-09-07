/**
 * `pnpm build:assert` — hold the build to what it claims (#265, #267, #269, spec #260).
 *
 * Runs after `pnpm --filter @o3/web build`, over that build's own output.
 * Three assertions today: the set of routes the server renders on demand is
 * exactly the allowlist in `policy.ts`, every content route still blocks on an
 * unknown slug so a bot probe converges to a cached 404, and no route ships
 * more JavaScript than its budget.
 *
 * Pass a dist directory as the first argument to check some other build.
 * Add `--baseline-dist <directory>` to enforce growth against its route stats.
 */
import { parseArgs } from 'node:util'

import { checkJsBudget, describeBudgetProblem, headroom } from './bundle'
import { readBuildOutput, readRouteBundles } from './build-output'
import type { RouteBundle } from './bundle'
import { checkCachedNotFound } from './cachedNotFound'
import { JS_BUDGET, RENDERING_POLICY } from './policy'
import { allRoutes, checkRenderingStrategy, describeProblem, perRequestRoutes } from './rendering'

import type { BuildOutput } from './build-output'
import type { Problem } from './rendering'

/** GitHub folds a failing job open on these; locally they would be noise. */
function annotate(message: string): void {
  if (process.env.GITHUB_ACTIONS) console.log(`::error::${message}`)
}

function report(build: BuildOutput): void {
  const routes = allRoutes(build)
  const perRequest = perRequestRoutes(build)
  const reasons = new Map(RENDERING_POLICY.perRequest.map((entry) => [entry.route, entry.reason]))

  console.log(
    `${routes.length} routes, ${perRequest.length} server-rendered on demand` +
      `${build.cacheComponents ? ', Cache Components on' : ''}`,
  )
  for (const route of perRequest) {
    const reason = reasons.get(route)
    console.log(`  ƒ ${route}${reason ? ` — ${reason}` : ''}`)
  }
}

/**
 * Every route's first-load JavaScript against what it may ship. Printed on a
 * passing run too: a budget entry with room to spare is one nobody needs any
 * more, and that is only visible when the headroom is on screen.
 */
function reportBudget(build: BuildOutput, baseline?: RouteBundle[]): void {
  const previous = new Map(
    baseline?.map((bundle) => [bundle.route, bundle.firstLoadUncompressedJsBytes]),
  )
  console.log('\nFirst-load JavaScript, uncompressed:')
  const byLargest = [...build.routeBundles].sort(
    (a, b) => b.firstLoadUncompressedJsBytes - a.firstLoadUncompressedJsBytes,
  )
  for (const bundle of byLargest) {
    const { budgetBytes, leftBytes } = headroom(bundle, JS_BUDGET)
    const spent = bundle.firstLoadUncompressedJsBytes.toLocaleString('en-US')
    const cap = budgetBytes.toLocaleString('en-US')
    const margin =
      leftBytes < 0
        ? `${(-leftBytes).toLocaleString('en-US')} over`
        : `${leftBytes.toLocaleString('en-US')} left`
    console.log(
      `  ${spent.padStart(9)} of ${cap} (${margin}, ${bundle.firstLoadChunkPaths.length} chunks)  ${bundle.route}`,
    )
    if (!baseline) continue
    const baseBytes = previous.get(bundle.route)
    const delta = bundle.firstLoadUncompressedJsBytes - (baseBytes ?? 0)
    console.log(
      baseBytes === undefined
        ? '    New route — absolute ceiling applies.'
        : `    Base ${baseBytes.toLocaleString('en-US')} → current ${spent}; delta ${delta >= 0 ? '+' : ''}${delta.toLocaleString('en-US')} bytes (growth limit ${JS_BUDGET.maxIncreaseBytes.toLocaleString('en-US')}).`,
    )
  }
}

function main(): void {
  let build
  let baseline: RouteBundle[] | undefined
  try {
    const { values, positionals } = parseArgs({
      allowPositionals: true,
      options: { 'baseline-dist': { type: 'string' } },
    })
    if (positionals.length > 1) throw new Error('Expected at most one build directory.')
    build = readBuildOutput(positionals[0])
    if (values['baseline-dist'] !== undefined) {
      baseline = readRouteBundles(values['baseline-dist'])
      console.log(`Comparing JavaScript with baseline build: ${values['baseline-dist']}`)
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
    return
  }

  report(build)
  reportBudget(build, baseline)

  const problems: Problem[] = checkRenderingStrategy(build, RENDERING_POLICY)
  const notCached: string[] = checkCachedNotFound(build)
  const overBudget = checkJsBudget(build.routeBundles, JS_BUDGET, baseline)

  if (problems.length === 0 && notCached.length === 0 && overBudget.length === 0) {
    console.log(
      '\nRendering strategy matches the policy. Unknown slugs still cache. ' +
        'Every route is inside its budget.',
    )
    return
  }

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s) with the rendering strategy:\n`)
    for (const problem of problems) {
      const message = describeProblem(problem)
      console.error(`  ${message}`)
      annotate(message)
    }
    console.error(
      '\nThe allowlist is tools/build-assert/src/policy.ts. Fix the route, or ' +
        'change the policy and say why in the review.',
    )
  }

  if (notCached.length > 0) {
    console.error(`\n${notCached.length} content route(s) no longer cache an unknown slug:\n`)
    for (const message of notCached) {
      console.error(`  ${message}`)
      annotate(message)
    }
    console.error(
      '\nThe routes are declared in tools/build-assert/src/cachedNotFound.ts, and #267 has ' +
        'the measurement they hold to.',
    )
  }

  if (overBudget.length > 0) {
    console.error(`\n${overBudget.length} problem(s) with the JavaScript budget:\n`)
    for (const problem of overBudget) {
      const message = describeBudgetProblem(problem)
      console.error(`  ${message}`)
      annotate(message)
    }
    console.error(
      '\nThe ceiling and growth limit are tools/build-assert/src/policy.ts. ' +
        'Fix the route, or change the policy and say why in the review.',
    )
  }

  process.exitCode = 1
}

main()

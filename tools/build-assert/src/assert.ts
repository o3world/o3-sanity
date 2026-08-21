/**
 * `pnpm build:assert` — hold the build to what it claims (#265, spec #260).
 *
 * Runs after `pnpm --filter @o3/web build`, over that build's own manifests.
 * One assertion today: the set of routes the server renders on demand is
 * exactly the allowlist in `policy.ts`. The JS budget from the bundle ticket
 * joins it here, on the same output and the same job.
 *
 * Pass a dist directory as the first argument to check some other build.
 */
import { readBuildOutput } from './build-output'
import { RENDERING_POLICY } from './policy'
import { allRoutes, checkRenderingStrategy, describeProblem, perRequestRoutes } from './rendering'

import type { Problem } from './rendering'

/** GitHub folds a failing job open on these; locally they would be noise. */
function annotate(message: string): void {
  if (process.env.GITHUB_ACTIONS) console.log(`::error::${message}`)
}

function main(): void {
  const build = readBuildOutput(process.argv[2])
  const routes = allRoutes(build)
  const perRequest = perRequestRoutes(build)

  console.log(
    `${routes.length} routes, ${perRequest.length} server-rendered on demand` +
      `${build.cacheComponents ? ', Cache Components on' : ''}`,
  )
  for (const route of perRequest) console.log(`  ƒ ${route}`)

  const problems: Problem[] = checkRenderingStrategy(build, RENDERING_POLICY)
  if (problems.length === 0) {
    console.log('\nRendering strategy matches the policy.')
    return
  }

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
  process.exitCode = 1
}

main()

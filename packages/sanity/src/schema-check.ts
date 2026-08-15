/**
 * Check → does the dataset serve the schema the repo declares? (#139)
 *
 * The sibling of `guidance:check`, for the other half of the authoring
 * skill's knowledge contract. Guidance drift is caught by comparing markdown
 * to documents; schema drift needs the same treatment, because field
 * `description`s reach agents through `get_schema` (ADR 0024, ADR 0025) and a
 * stale deploy answers confidently with the old design.
 *
 *   pnpm schema:check
 *
 * Exits non-zero on any drift, so it works as a checkpoint rather than a
 * report nobody reads.
 *
 * Both `sanity manifest extract` and `sanity schemas list` are marked
 * experimental by the CLI (7.15.1); they are the only route to a schema that
 * carries descriptions. `sanity schema extract` — the typegen one — omits
 * them entirely, which is why `schema.json` cannot be used here.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { diffSchemas, type Drift } from './schema-diff'
import { deployedTypes, repoSchemaFile, repoTarget } from './schema-manifest'

/** The studio declares exactly one workspace; `sanity.config.ts` names it. */
const WORKSPACE = 'default'

function sanity(args: string[]): string {
  return execFileSync('pnpm', ['exec', 'sanity', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

function describe(drift: Drift): string {
  if (drift.kind === 'field-missing') return `${drift.path} is not in the deployed schema`
  return [
    `${drift.path} describes itself differently`,
    `        repo: ${drift.repo ?? '(none)'}`,
    `    deployed: ${drift.deployed ?? '(none)'}`,
  ].join('\n')
}

function main(): void {
  const scratch = mkdtempSync(join(tmpdir(), 'o3-schema-check-'))
  try {
    sanity(['manifest', 'extract', '--path', scratch])
    const index = JSON.parse(readFileSync(join(scratch, 'create-manifest.json'), 'utf8'))
    const repo = JSON.parse(
      readFileSync(join(scratch, repoSchemaFile(index, WORKSPACE)), 'utf8'),
    ) as Parameters<typeof diffSchemas>[0]

    const deployed = deployedTypes(JSON.parse(sanity(['schemas', 'list', '--json'])), WORKSPACE)

    const target = repoTarget(index, WORKSPACE)
    console.log(
      `repo: ${repo.length} type(s) · dataset: ${deployed.length} · ` +
        `${target.projectId}/${target.dataset}\n`,
    )

    const drift = diffSchemas(repo, deployed)
    if (drift.length === 0) {
      console.log('the deployed schema matches the repo')
      return
    }

    console.error(`✗ schema has drifted (${drift.length}) — run \`pnpm schema:deploy\`:`)
    for (const entry of drift) console.error(`    ${describe(entry)}`)
    process.exitCode = 1
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}

main()

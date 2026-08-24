/**
 * Check → does the dataset serve the schema the repo declares? (#139)
 *
 * Field `description`s are the one knowledge surface an authoring agent reads
 * out of the dataset rather than out of the plugin's own files (ADR 0025), so
 * a stale deploy answers confidently with the old design.
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
import { deployedTypes, repoSchemaFile, repoTarget, straySchemaDocs } from './schema-manifest'

/**
 * The workspace under check is the one `schema:deploy` publishes — the
 * brand-filtered roster of whichever brand the env names. `sanity.config.ts`
 * also declares `model`, the whole-model workspace typegen extracts; comparing
 * that against a deployed brand schema would report the other brand's blocks
 * as drift.
 */
const WORKSPACE = 'default'

/**
 * The CLI's stderr passes through: this runs as a blocking CI step, where a
 * refused token and a changed schema both surface as a non-zero exit, and only
 * the CLI's own message separates them. The cost is the experimental-command
 * warnings both invocations print.
 */
function sanity(args: string[]): string {
  return execFileSync('pnpm', ['exec', 'sanity', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  })
}

function describe(drift: Drift): string {
  if (drift.kind === 'field-missing') return `${drift.path} is not in the deployed schema`
  if (drift.kind === 'deployed-extra') {
    return `${drift.path} is deployed but not in this brand's roster — a stale or whole-model deploy wrote it`
  }
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
      `repo (${WORKSPACE}): ${repo.length} type(s) · dataset: ${deployed.length} · ` +
        `${target.projectId}/${target.dataset}\n`,
    )

    // A schema document from another workspace declares its own roster to
    // every schema-driven writer, however well this brand's matches. Queried
    // against the one dataset under check — `schemas list` walks every
    // workspace in the config, so it cannot place a document in a dataset.
    const strays = straySchemaDocs(
      JSON.parse(
        sanity([
          'documents',
          'query',
          '*[_id in path("_.schemas.**")]{_id}',
          '--api-version',
          'v2025-05-01',
        ]),
      ),
      WORKSPACE,
    )

    const drift = diffSchemas(repo, deployed)
    if (drift.length === 0 && strays.length === 0) {
      console.log('the deployed schema matches the repo')
      return
    }

    if (drift.length > 0) {
      console.error(`✗ schema has drifted (${drift.length}) — run \`pnpm schema:deploy\`:`)
      for (const entry of drift) console.error(`    ${describe(entry)}`)
    }
    for (const id of strays) {
      console.error(
        `✗ schema has drifted: the dataset also serves \`${id}\`, which no deploy of ` +
          `workspace "${WORKSPACE}" wrote — delete it with \`sanity schemas delete --ids ${id}\``,
      )
    }
    process.exitCode = 1
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}

main()

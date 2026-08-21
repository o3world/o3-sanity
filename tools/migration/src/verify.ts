/**
 * Verify → is the brand's dataset actually what its committed JSON says it is?
 *
 * Runs after every load (#17, reused by #24 for parity checks). The tests
 * check the committed corpus; this checks the thing the corpus was supposed
 * to produce. They catch different failures — a document can be perfect on
 * disk and missing, half-loaded, or shadowed in the dataset.
 *
 *   pnpm --filter @o3/migration verify
 *   pnpm --filter @o3/migration verify -- --brand o3xo
 *
 * The brand picks both sides of the comparison — the corpus tree and the
 * dataset — so pointing it at one brand's dataset while holding the other's
 * JSON is not a thing it can be asked to do.
 *
 * Exits non-zero on any finding, so it works as a checkpoint rather than a
 * report nobody reads. The checks live in `core/report.ts`; this fetches,
 * calls `report`, and prints.
 */
import { getCliClient } from 'sanity/cli'

import { brandArg } from './lib/brandArg'
import { readCorpus } from './core/read'
import { report, type CheckResult } from './core/report'
import { LOCKED_BY_ID, LOCK_FETCH_OPTIONS, type LockRow } from './core/state'

const client = getCliClient({ apiVersion: '2026-07-01' })

type AnyDoc = { _id: string; _type: string; [k: string]: unknown }

const findings: string[] = []
function printCheck({ check, lines }: CheckResult) {
  if (lines.length === 0) {
    console.log(`✓ ${check}`)
    return
  }
  console.error(`✗ ${check} (${lines.length})`)
  for (const line of lines.slice(0, 20)) console.error(`    ${line}`)
  if (lines.length > 20) console.error(`    …and ${lines.length - 20} more`)
  findings.push(`${check}: ${lines.length}`)
}

async function main() {
  // The whole committed corpus — all three trees, or a tree's documents
  // report as orphans.
  const committed = readCorpus<AnyDoc>().map((entry) => entry.document)

  // Sanity keeps its own bookkeeping in the dataset — ACL groups, the
  // deployed schema, retention config — under `_.`-prefixed ids. They are not
  // content and every check below would flag them.
  const live = await client.fetch<AnyDoc[]>(
    '*[!(_id in path("drafts.**")) && !(_id in path("_.**")) && !(_type match "sanity.*") && !(_type match "system.*")]',
  )

  // The lock flag for every live document in both its forms, read raw
  // (`LOCK_FETCH_OPTIONS`) — a lock on a draft is invisible to the published
  // perspective, and the orphan check has to see it the way `load` does.
  const ids = live.flatMap((d) => [d._id, `drafts.${d._id}`])
  const locks = await client.fetch<LockRow[]>(LOCKED_BY_ID, { ids }, LOCK_FETCH_OPTIONS)

  const result = report(committed, live, locks)

  console.log(
    `brand ${brandArg()} · committed: ${committed.length} documents · ` +
      `dataset: ${live.length} documents · ` +
      `${client.config().projectId}/${client.config().dataset}\n`,
  )

  const [inDataset, ...others] = result.checks
  printCheck(inDataset!)

  console.log('  per type (committed → dataset):')
  for (const [type, { committed: c, live: l }] of result.counts) {
    console.log(`    ${type.padEnd(16)} ${String(c).padStart(4)} → ${String(l).padStart(4)}`)
  }
  console.log()

  for (const check of others) printCheck(check)

  if (result.provisional.length > 0) {
    console.log(
      `\n⚠ provisional content (${result.provisional.length}) — not authoritative, clear before launch`,
    )
    for (const line of result.provisional) console.log(`    ${line}`)
  }

  if (result.placeholders.length > 0) {
    console.log(
      `\n⚠ placeholder sections (${result.placeholders.length}) — inserted from the canvas and not yet written`,
    )
    for (const line of result.placeholders) console.log(`    ${line}`)
    // ⚠️ THE THING THAT SURPRISES PEOPLE, said where they will read it. The
    // committed JSON under `data/` is the source of truth during build-out
    // (ADR 0003), and `load` recreates every unlocked pipeline-owned document
    // from it — so a section added in Studio lives ONLY in the dataset. The
    // next `load` removes it, silently, along with whatever was written into
    // it. Seed it into `data/seed/` or lock the document; there is no third
    // option, and nothing in Presentation can say so from inside its iframe.
    console.log(
      '    (these live only in the dataset — the next `load` recreates the document from data/)',
    )
  }

  if (findings.length > 0) {
    console.error(`\n${findings.length} check(s) failed:\n  ${findings.join('\n  ')}`)
    process.exitCode = 1
  } else {
    console.log('\nall checks passed')
  }
}

await main()

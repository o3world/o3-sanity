/**
 * Verify → is the dataset healthy? References resolve, image fields hold
 * images, every type is in the schema, slugs are unique. Read-only. The tests
 * check the committed JSON; this checks what the site actually reads.
 *
 *   pnpm --filter @o3/migration verify
 *
 * Exits non-zero on any finding, so it works as a checkpoint rather than a
 * report nobody reads. The checks live in `core/report.ts`; this fetches,
 * calls `report`, and prints.
 */
import { getCliClient } from 'sanity/cli'

import { report, type CheckResult } from './core/report'

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
  // Sanity keeps its own bookkeeping in the dataset — ACL groups, the
  // deployed schema, retention config — under `_.`-prefixed ids. They are not
  // content and every check below would flag them.
  const live = await client.fetch<AnyDoc[]>(
    '*[!(_id in path("drafts.**")) && !(_id in path("_.**")) && !(_type match "sanity.*") && !(_type match "system.*")]',
  )

  const result = report(live)

  console.log(`${client.config().projectId}/${client.config().dataset}: ${live.length} documents`)
  for (const [type, count] of result.counts) {
    console.log(`    ${type.padEnd(16)} ${String(count).padStart(4)}`)
  }
  console.log()

  for (const check of result.checks) printCheck(check)

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
    // A section added in Studio lives only in the dataset, which is where
    // content is authored. It renders as the block's placeholder until
    // someone writes it.
    console.log('    (added from the canvas and not written yet — they render as placeholders)')
  }

  if (findings.length > 0) {
    console.error(`\n${findings.length} check(s) failed:\n  ${findings.join('\n  ')}`)
    process.exitCode = 1
  } else {
    console.log('\nall checks passed')
  }
}

await main()

/**
 * Targeted migration — a case study's `stats` field becomes a `statsSection`
 * at the head of its `story`.
 *
 * `stats` used to be drawn as a fixed band between the hero and the first
 * chapter, which is a position no frame asks for and no editor can move. The
 * band is now a section block (`statsSection`, #44), so the figures belong in
 * the narrative array where the rest of the bands live.
 *
 * **NOTHING IS OVERWRITTEN.** The `stats` field stays exactly as it is — it is
 * still the card's field, and its first stat is still the showcase card's
 * headline stat. This only prepends a band that reads the same figures, so a
 * document this has run against renders what it rendered before and can now be
 * reordered. Running it twice is a no-op: a story that already opens with a
 * `statsSection` is skipped.
 *
 * `layout: 'stacked'` because that is the shape the fixed band had — the ruled
 * column on the article measure. `columns` is one drag of the knob away.
 *
 * **`migration.locked` DOES NOT APPLY HERE, and that is not an oversight.**
 * The lock guards a document's content being replaced from outside it — the
 * pipeline overwriting an editor's version with the committed JSON (ADR 0003:
 * "the pipeline never touches a locked document"). This reads a case study's
 * own `stats` and adds a band drawn from them. There is no outside version, so
 * there is nothing for the lock to protect, and honouring it would leave the
 * most carefully-tended case studies as the only ones with their figures
 * missing — which is what it did to IRONMAN before this run.
 *
 * A targeted script whose new values come from `data/` or anywhere else
 * outside the document is a different thing and must still stop at a lock.
 *
 *   pnpm --filter @o3/migration stats-to-band                     # report only
 *   pnpm --filter @o3/migration stats-to-band -- --apply          # write
 *
 * Read-only unless `--apply`. It refuses any dataset but `development` without
 * `--dataset <name>` spelled out, because the fix for a bad run here is a
 * re-author rather than a revert.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient({ apiVersion: '2026-07-01' })

const argv = process.argv.slice(2)
const apply = argv.includes('--apply')
const namedDataset = argv[argv.indexOf('--dataset') + 1]

/** The band this migration writes, keyed off the document it came from. */
type Stat = { _key?: string; _type: 'stat'; value?: string; label?: string }
type StoryMember = { _key?: string; _type: string }
type Row = {
  _id: string
  _rev: string
  title?: string
  slug?: string
  stats?: Stat[] | null
  story?: StoryMember[] | null
}

const QUERY = /* groq */ `*[_type == "caseStudy" && count(stats) > 0]{
  _id, _rev, title, "slug": slug.current, stats,
  story[]{_key, _type}
} | order(title asc)`

/**
 * The band, with keys derived from the document rather than random: a rerun
 * that has to repair a half-written batch then writes the same `_key`s, and a
 * Presentation overlay keeps pointing at the same array item.
 */
function bandFor(row: Row) {
  return {
    _key: 'stats-band',
    _type: 'statsSection',
    layout: 'stacked',
    surface: 'white',
    stats: (row.stats ?? []).map((stat, index) => ({
      _key: stat._key ?? `stat-${index}`,
      _type: 'stat' as const,
      value: stat.value,
      label: stat.label,
    })),
  }
}

async function main() {
  const dataset = client.config().dataset
  if (dataset !== 'development' && namedDataset !== dataset) {
    throw new Error(
      `refusing to touch "${dataset}" — pass --dataset ${dataset} to say so out loud, ` +
        `or run \`pnpm dataset development\` first.`,
    )
  }

  const rows = await client.fetch<Row[]>(QUERY)
  console.log(`${client.config().projectId}/${dataset} — ${rows.length} with stats\n`)

  const skipped: string[] = []
  const todo: Row[] = []

  for (const row of rows) {
    const already = (row.story ?? []).some((member) => member._type === 'statsSection')
    if (already) {
      skipped.push(`${row.title ?? row._id} — already opens with a stats band`)
      continue
    }
    todo.push(row)
  }

  for (const line of skipped) console.log(`  skip   ${line}`)
  for (const row of todo) {
    console.log(
      `  ${apply ? 'write' : 'would'}  ${row.title ?? row._id} — ${row.stats?.length} stat(s) → story[0]`,
    )
  }

  if (!apply) {
    console.log(`\n${todo.length} document(s) would change. Re-run with --apply.`)
    return
  }
  if (todo.length === 0) {
    console.log('\nnothing to do')
    return
  }

  // One transaction: the whole batch lands or none of it does, so a failure
  // halfway leaves nothing to reconcile by hand.
  const tx = todo.reduce(
    (acc, row) =>
      acc.patch(row._id, (patch) =>
        patch
          // The array has to exist before `insert` can reach into it, and a
          // case study with figures but no narrative yet is a real state.
          .setIfMissing({ story: [] })
          .insert('before', 'story[0]', [bandFor(row)]),
      ),
    client.transaction(),
  )

  await tx.commit()
  console.log(`\nwrote ${todo.length} document(s) to ${dataset}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

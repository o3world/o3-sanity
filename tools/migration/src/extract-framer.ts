/**
 * Extract → `data-o3xo/extract/insight/<slug>.json` (the O3XO source).
 *
 * o3xo.ai is a Framer site with no CMS API, so the extract fetches the pages the
 * site serves and parses them (`lib/framer.ts`). Everything the corpus contract
 * asks of the WordPress extract holds here too: one file per document, `_meta`
 * carrying the type and nothing else, run facts in `_manifest.json`, so a
 * non-empty diff under the extract tree means o3xo.ai changed.
 *
 *   pnpm --filter @o3/migration extract -- --brand o3xo --slugs a-slug,b-slug
 *   pnpm --filter @o3/migration extract -- --brand o3xo --insights 5
 *   pnpm --filter @o3/migration extract -- --brand o3xo --insights all
 *
 * The sitemap is the inventory: it lists every insight in the order the site
 * publishes them, which is the only ordering evidence the site gives (it prints
 * no dates — see `map/framer.ts`).
 */
import { join } from 'node:path'

import { MANIFEST_PATH, recordRun } from './lib/manifest'
import { EXTRACT_DIR, writeJson } from './lib/paths'
import { SOURCE, fetchPage, insightSlugsInSitemap, parseInsight } from './lib/framer'

const args = process.argv.slice(2)
const flag = (name: string): string | null => {
  const at = args.indexOf(name)
  return at === -1 ? null : (args[at + 1] ?? null)
}

const slugsArg = flag('--slugs')
const insightsArg = flag('--insights')

async function wantedSlugs(): Promise<string[]> {
  if (slugsArg) {
    return slugsArg
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  const all = insightSlugsInSitemap(await fetchPage('/sitemap.xml'))
  console.log(`sitemap lists ${all.length} insights`)
  if (!insightsArg || insightsArg === 'all') return all
  const n = Number(insightsArg)
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(
      `--insights takes a positive integer or "all"; got ${JSON.stringify(insightsArg)}`,
    )
  }
  return all.slice(0, n)
}

const startedAt = new Date().toISOString()
const slugs = await wantedSlugs()
if (slugs.length === 0) {
  throw new Error('nothing to extract — pass --slugs, or --insights N|all')
}

for (const slug of slugs) {
  const record = parseInsight(await fetchPage(`/insights/${slug}`), slug)
  writeJson(join(EXTRACT_DIR, 'insight', `${slug}.json`), { _meta: { type: 'insight' }, ...record })
  console.log(`✓ ${slug}`)
}

recordRun(SOURCE, ['insight'], startedAt)
console.log(
  `done: ${slugs.length} insight${slugs.length === 1 ? '' : 's'} → ${EXTRACT_DIR}/insight` +
    `\n  run recorded for insight → ${MANIFEST_PATH}`,
)

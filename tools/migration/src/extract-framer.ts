/**
 * Extract → `data-o3xo/extract/<type>/<slug>.json` (the O3XO source).
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
 *   pnpm --filter @o3/migration extract -- --brand o3xo --case-studies all
 *
 * The sitemap is the inventory for both collections: it lists every item in the
 * order the site publishes them, which is the only ordering evidence the site
 * gives (it prints no dates — see `map/framer.ts`). Naming no collection means
 * the insights, which is what the flag meant before there was a second one.
 */
import { join } from 'node:path'

import { MANIFEST_PATH, recordRun } from './lib/manifest'
import { EXTRACT_DIR, writeJson } from './lib/paths'
import {
  SOURCE,
  caseStudySlugsInSitemap,
  fetchPage,
  insightSlugsInSitemap,
  parseCaseStudy,
  parseCaseStudyIndex,
  parseInsight,
} from './lib/framer'

const args = process.argv.slice(2)
const flag = (name: string): string | null => {
  const at = args.indexOf(name)
  return at === -1 ? null : (args[at + 1] ?? null)
}

const slugsArg = flag('--slugs')
const insightsArg = flag('--insights')
const caseStudiesArg = flag('--case-studies')

/** `N|all` against the inventory the sitemap gives, or all of it. */
function firstN(all: string[], arg: string | null, flagName: string): string[] {
  if (!arg || arg === 'all') return all
  const n = Number(arg)
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`${flagName} takes a positive integer or "all"; got ${JSON.stringify(arg)}`)
  }
  return all.slice(0, n)
}

async function wantedInsightSlugs(): Promise<string[]> {
  if (slugsArg) {
    return slugsArg
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  const all = insightSlugsInSitemap(await fetchPage('/sitemap.xml'))
  console.log(`sitemap lists ${all.length} insights`)
  return firstN(all, insightsArg, '--insights')
}

const startedAt = new Date().toISOString()
const types: string[] = []

// Naming a collection means only that one. Naming none means the insights,
// which is what `extract --brand o3xo` did before case studies existed.
const wantsCaseStudies = caseStudiesArg !== null
const wantsInsights = !wantsCaseStudies || slugsArg !== null || insightsArg !== null

if (wantsInsights) {
  const slugs = await wantedInsightSlugs()
  if (slugs.length === 0) throw new Error('nothing to extract — pass --slugs, or --insights N|all')
  for (const slug of slugs) {
    const record = parseInsight(await fetchPage(`/insights/${slug}`), slug)
    writeJson(join(EXTRACT_DIR, 'insight', `${slug}.json`), {
      _meta: { type: 'insight' },
      ...record,
    })
    console.log(`✓ insight ${slug}`)
  }
  types.push('insight')
  console.log(`done: ${slugs.length} insight${slugs.length === 1 ? '' : 's'}`)
}

if (wantsCaseStudies) {
  // The index is read once and carries the client's name, which is the one
  // field `caseStudy` requires that a detail page never prints
  // (`map/framerCaseStudy.ts`). A slug in the sitemap with no card is a case
  // study the collection does not publish — the two `redirect-*` items are
  // already excluded by name in `lib/framer.ts`, and anything else that turns
  // up here is a finding rather than something to skip past.
  const cards = new Map(
    parseCaseStudyIndex(await fetchPage('/case-studies/')).map((card) => [card.slug, card]),
  )
  const inventory = caseStudySlugsInSitemap(await fetchPage('/sitemap.xml'))
  console.log(`sitemap lists ${inventory.length} case studies; the index draws ${cards.size} cards`)

  const slugs = firstN(inventory, caseStudiesArg, '--case-studies')
  if (slugs.length === 0) throw new Error('the sitemap lists no case studies')

  for (const slug of slugs) {
    const card = cards.get(slug)
    if (!card) {
      throw new Error(
        `o3xo.ai serves /case-studies/${slug} but the collection index draws no card for it, ` +
          `so its client name is unknown. Either the index has moved (fix the parse) or the ` +
          `item is unpublished junk (name it in JUNK_CASE_STUDY_SLUGS).`,
      )
    }
    const record = parseCaseStudy(await fetchPage(`/case-studies/${slug}`), slug, card)
    writeJson(join(EXTRACT_DIR, 'caseStudy', `${slug}.json`), {
      _meta: { type: 'caseStudy' },
      ...record,
    })
    console.log(`✓ caseStudy ${slug}`)
  }
  types.push('caseStudy')
  console.log(`done: ${slugs.length} case stud${slugs.length === 1 ? 'y' : 'ies'}`)
}

recordRun(SOURCE, types, startedAt)
console.log(`  → ${EXTRACT_DIR}\n  run recorded for ${types.join(', ')} → ${MANIFEST_PATH}`)

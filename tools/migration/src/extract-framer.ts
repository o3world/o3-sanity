/**
 * Extract → `data-o3xo/extract/<type>/<slug>.json` (the O3XO source).
 *
 * o3xo.ai is a Framer site with no CMS API, so the extract fetches the pages the
 * site serves and parses them (`lib/framer.ts` for an insight or case study,
 * `lib/framerPage.ts` for a marketing page). Everything the corpus contract asks
 * of the WordPress extract holds here too: one file per document, `_meta`
 * carrying the type and nothing else, run facts in `_manifest.json`, so a
 * non-empty diff under the extract tree means o3xo.ai changed.
 *
 *   pnpm --filter @o3/migration extract -- --brand o3xo --slugs a-slug,b-slug
 *   pnpm --filter @o3/migration extract -- --brand o3xo --insights 5
 *   pnpm --filter @o3/migration extract -- --brand o3xo --insights all
 *   pnpm --filter @o3/migration extract -- --brand o3xo --case-studies all
 *   pnpm --filter @o3/migration extract -- --brand o3xo --pages all
 *   pnpm --filter @o3/migration extract -- --brand o3xo --pages about,industries/construction
 *
 * The sitemap is the inventory for all three: it lists every collection item in
 * the order the site publishes them, which is the only ordering evidence the
 * site gives (it prints no dates — see `map/framer.ts`), and every
 * non-collection URL that has to keep resolving after the cutover.
 */
import { join } from 'node:path'

import {
  SOURCE,
  caseStudySlugsInSitemap,
  fetchPage,
  insightSlugsInSitemap,
  parseCaseStudy,
  parseCaseStudyIndex,
  parseInsight,
  sitemapPosition,
} from './lib/framer'
import { parseAccordion, pageModuleUrls, type FramerAccordionRow } from './lib/framerAccordion'
import {
  needsAccordionAnswers,
  pagePath,
  pagePathsInSitemap,
  parsePage,
  withAccordionAnswers,
  type FramerPage,
} from './lib/framerPage'
import { MANIFEST_PATH, recordRun } from './lib/manifest'
import { EXTRACT_DIR, writeJson } from './lib/paths'

const args = process.argv.slice(2)
const flag = (name: string): string | null => {
  const at = args.indexOf(name)
  return at === -1 ? null : (args[at + 1] ?? null)
}

const slugsArg = flag('--slugs')
const insightsArg = flag('--insights')
const caseStudiesArg = flag('--case-studies')
const pagesArg = flag('--pages')

const list = (value: string): string[] =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

/** `N|all` against the inventory the sitemap gives, or all of it. */
function firstN(all: string[], arg: string | null, flagName: string): string[] {
  if (!arg || arg === 'all') return all
  const n = Number(arg)
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`${flagName} takes a positive integer or "all"; got ${JSON.stringify(arg)}`)
  }
  return all.slice(0, n)
}

/** One insight to extract, with the place in the publication order it holds. */
interface WantedInsight {
  readonly slug: string
  readonly sitemapPosition: number
  readonly sitemapCount: number
}

/**
 * The insights this run extracts, each carrying where the sitemap lists it.
 *
 * The sitemap is fetched even when slugs are named on the command line: the
 * position is the only evidence of what the site published when, and it is what
 * the mapper dates the article from (#218). An article extracted without it
 * would convert into a document with no place in its own collection.
 */
async function wantedInsights(): Promise<WantedInsight[]> {
  const inventory = insightSlugsInSitemap(await fetchPage('/sitemap.xml'))
  console.log(`sitemap lists ${inventory.length} insights`)
  const slugs = slugsArg ? list(slugsArg) : firstN(inventory, insightsArg, '--insights')
  return slugs.map((slug) => ({
    slug,
    sitemapPosition: sitemapPosition(inventory, slug),
    sitemapCount: inventory.length,
  }))
}

async function wantedPages(): Promise<string[]> {
  if (pagesArg !== 'all') return list(pagesArg ?? '')
  const all = pagePathsInSitemap(await fetchPage('/sitemap.xml'))
  console.log(`sitemap lists ${all.length} non-collection URLs`)
  return all
}

/**
 * The accordion rows a page's own JavaScript builds, or none.
 *
 * The one place this extract reaches past the served HTML, and it reaches only
 * when the HTML says there is something to reach for: Framer draws every
 * accordion row closed and ships the answers as props, so the DOM carries the
 * questions and one wrong paragraph (`lib/framerAccordion.ts` says why). The
 * page names no module as its own, so the candidates are read in order until
 * one answers — which is one extra request on the page that has an accordion
 * and none on the ten that do not.
 */
async function accordionRows(
  page: FramerPage,
  html: string,
  slug: string,
): Promise<FramerAccordionRow[]> {
  if (!needsAccordionAnswers(page)) return []
  for (const url of pageModuleUrls(html)) {
    const response = await fetch(url)
    if (!response.ok) continue
    const rows = parseAccordion(await response.text())
    if (rows.length > 0) return rows
  }
  console.warn(
    `  ! ${slug}: an accordion is in the markup but no page module builds one — ` +
      'its answers stay unmigrated and the converter will say so',
  )
  return []
}

const startedAt = new Date().toISOString()
const types: string[] = []

// Naming a collection means only that one. Naming none means the insights,
// which is what `extract --brand o3xo` did before there was a second one.
const wantsCaseStudies = caseStudiesArg !== null
const wantsPages = pagesArg !== null
const wantsInsights =
  (!wantsCaseStudies && !wantsPages) || slugsArg !== null || insightsArg !== null

if (wantsInsights) {
  const wanted = await wantedInsights()
  if (wanted.length === 0) throw new Error('nothing to extract — pass --slugs, or --insights N|all')
  for (const { slug, sitemapPosition: position, sitemapCount: count } of wanted) {
    const record = parseInsight(await fetchPage(`/insights/${slug}`), slug)
    writeJson(join(EXTRACT_DIR, 'insight', `${slug}.json`), {
      _meta: { type: 'insight' },
      sitemapPosition: position,
      sitemapCount: count,
      ...record,
    })
    console.log(`✓ insight ${slug} (${position} of ${count})`)
  }
  types.push('insight')
  console.log(`done: ${wanted.length} insight${wanted.length === 1 ? '' : 's'}`)
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

if (wantsPages) {
  const pageSlugs = await wantedPages()
  if (pageSlugs.length === 0) throw new Error('nothing to extract — pass --pages all|a,b')
  for (const slug of pageSlugs) {
    const html = await fetchPage(pagePath(slug))
    const page = parsePage(html, slug)
    const record = withAccordionAnswers(page, await accordionRows(page, html, slug))
    // A multi-segment slug is one file, not a directory: `industries/construction`
    // is committed as `industries-construction.json`, so the extract tree stays
    // one flat directory per type the way `lib/corpus.ts` walks it.
    writeJson(join(EXTRACT_DIR, 'page', `${slug.replaceAll('/', '-')}.json`), {
      _meta: { type: 'page' },
      ...record,
    })
    console.log(`✓ page ${slug}`)
  }
  types.push('page')
  console.log(`done: ${pageSlugs.length} page${pageSlugs.length === 1 ? '' : 's'}`)
}

recordRun(SOURCE, types, startedAt)
console.log(`  → ${EXTRACT_DIR}\n  run recorded for ${types.join(', ')} → ${MANIFEST_PATH}`)

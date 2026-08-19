/**
 * Convert → `data-o3xo/converted/` (the O3XO driver).
 *
 * Reads the parsed o3xo.ai records the Framer extract committed and maps them
 * with `map/framer.ts`. Same contract as the WordPress driver: deterministic
 * output, fail-loud on anything it cannot map, notes for anything it normalized.
 *
 *   pnpm --filter @o3/migration convert -- --brand o3xo
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { brandConfig } from '@o3/sanity/brand'

import type { ConversionIssue } from './lib/htmlToPortableText'
import { CONVERTED_DIR, EXTRACT_DIR, writeJson } from './lib/paths'
import { mapFramerCategory, mapFramerInsight, type FramerInsightRecord } from './map/framer'
import {
  mapFramerCaseStudy,
  mapFramerClient,
  type FramerCaseStudyRecord,
} from './map/framerCaseStudy'
import {
  mapFramerPage,
  mapFramerPeople,
  mapFramerSiteSettings,
  type FramerPageRecord,
} from './map/framerPage'

// The prefix comes from brand config, which is the one place a brand's facts
// live (ADR 0028) — never `/insights` as a literal, even though both brands
// happen to serve insights there today.
const { collections } = brandConfig('o3xo')

const insightsDir = join(EXTRACT_DIR, 'insight')
const pagesDir = join(EXTRACT_DIR, 'page')
if (!existsSync(insightsDir) && !existsSync(pagesDir)) {
  throw new Error(
    `no ${insightsDir} — run: pnpm --filter @o3/migration extract -- --brand o3xo --insights all --pages all`,
  )
}

const jsonIn = (dir: string): string[] =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : []

const failures: { slug: string; issues: readonly ConversionIssue[] }[] = []
const notes: { slug: string; notes: readonly ConversionIssue[] }[] = []
const categories = new Map<string, ReturnType<typeof mapFramerCategory>>()
let insights = 0

for (const file of jsonIn(insightsDir)) {
  const record = JSON.parse(readFileSync(join(insightsDir, file), 'utf8')) as FramerInsightRecord
  const result = mapFramerInsight(record, { insightPrefix: collections.insight.prefix })
  if (!result.ok) {
    failures.push({ slug: record.slug, issues: result.issues })
    continue
  }
  writeJson(join(CONVERTED_DIR, 'insight', file), result.doc)
  insights++
  if (result.notes?.length) notes.push({ slug: record.slug, notes: result.notes })
  // Categories are reference-driven, exactly as `person` documents are on the
  // WordPress side: only the eyebrows something is actually filed under become
  // documents, so an unused one is never noise in Studio.
  if (record.category) {
    const category = mapFramerCategory(record.category)
    categories.set(category._id, category)
  }
}

for (const category of categories.values()) {
  writeJson(join(CONVERTED_DIR, 'category', `${category.slug.current}.json`), category)
}

/**
 * Case studies (#219). A second collection off the same source, and the
 * `client` documents its cards name — reference-driven, exactly as the
 * categories above are: only clients a case study actually points at become
 * documents.
 *
 * The directory is optional, because a checkout that has only ever extracted
 * insights is a legitimate state and this driver is what both runs go through.
 */
const caseStudiesDir = join(EXTRACT_DIR, 'caseStudy')
const clients = new Map<string, ReturnType<typeof mapFramerClient>>()
let caseStudiesWritten = 0

if (existsSync(caseStudiesDir)) {
  for (const file of readdirSync(caseStudiesDir).filter((f) => f.endsWith('.json'))) {
    const record = JSON.parse(
      readFileSync(join(caseStudiesDir, file), 'utf8'),
    ) as FramerCaseStudyRecord
    const result = mapFramerCaseStudy(record, {
      caseStudyPrefix: collections.caseStudy.prefix,
    })
    if (!result.ok) {
      failures.push({ slug: record.slug, issues: result.issues })
      continue
    }
    writeJson(join(CONVERTED_DIR, 'caseStudy', file), result.doc)
    caseStudiesWritten++
    if (result.notes?.length) notes.push({ slug: record.slug, notes: result.notes })
    const client = mapFramerClient(record.card.client)
    clients.set(client._id, client)
  }

  for (const client of clients.values()) {
    writeJson(
      join(CONVERTED_DIR, 'client', `${client._id.replace('client-framer-', '')}.json`),
      client,
    )
  }
}

/**
 * Pages (#220). Read in one pass before any is mapped, because a page's links are
 * checked against the set of pages this run holds — an industry card pointing
 * at a page nobody migrated is a conversion failure, not a 404 to find later.
 */
const pageRecords = jsonIn(pagesDir).map(
  (file) => JSON.parse(readFileSync(join(pagesDir, file), 'utf8')) as FramerPageRecord,
)
const pageSlugs = pageRecords.map((record) => record.slug)
const people = new Map<string, ReturnType<typeof mapFramerPeople>[number]>()
let pages = 0

for (const record of pageRecords) {
  const result = mapFramerPage(record, { pageSlugs })
  if (!result.ok) {
    failures.push({ slug: record.slug, issues: result.issues })
    continue
  }
  writeJson(join(CONVERTED_DIR, 'page', `${record.slug.replaceAll('/', '-')}.json`), result.doc)
  pages++
  if (result.notes?.length) notes.push({ slug: record.slug, notes: result.notes })
  // Reference-driven, like categories: only people a page actually names.
  for (const person of mapFramerPeople(record)) people.set(person._id, person)
}

for (const person of people.values()) {
  writeJson(
    join(CONVERTED_DIR, 'person', `${person._id.replace('person-framer-', '')}.json`),
    person,
  )
}

// The chrome is one record shared by every page, so it is taken from whichever
// page this run holds — they all serve the same footer.
const chromeSource = pageRecords[0]
if (chromeSource) {
  writeJson(
    join(CONVERTED_DIR, 'siteSettings', 'settings.json'),
    mapFramerSiteSettings(chromeSource.chrome),
  )
}

const written =
  insights +
  categories.size +
  caseStudiesWritten +
  clients.size +
  pages +
  people.size +
  (chromeSource ? 1 : 0)
console.log(
  `converted ${written} documents (${insights} insights, ${categories.size} categories, ` +
    `${caseStudiesWritten} case studies, ${clients.size} clients, ` +
    `${pages} pages, ${people.size} people${chromeSource ? ', site settings' : ''}) → ${CONVERTED_DIR}`,
)
if (notes.length > 0) {
  console.warn(`\nNOTES (${notes.length}) — converted, but the source is missing something:`)
  for (const entry of notes) {
    console.warn(`  ${entry.slug}`)
    for (const note of entry.notes) console.warn(`    - [${note.element}] ${note.detail}`)
  }
}
if (failures.length > 0) {
  console.error(`\nFAILED (${failures.length}) — nothing written for these:`)
  for (const failure of failures) {
    console.error(`  ${failure.slug}`)
    for (const issue of failure.issues) console.error(`    - [${issue.element}] ${issue.detail}`)
  }
  process.exitCode = 1
}

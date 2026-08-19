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

// The prefix comes from brand config, which is the one place a brand's facts
// live (ADR 0028) — never `/insights` as a literal, even though both brands
// happen to serve insights there today.
const { collections } = brandConfig('o3xo')

const insightsDir = join(EXTRACT_DIR, 'insight')
if (!existsSync(insightsDir)) {
  throw new Error(
    `no ${insightsDir} — run: pnpm --filter @o3/migration extract -- --brand o3xo --insights all`,
  )
}

const failures: { slug: string; issues: readonly ConversionIssue[] }[] = []
const notes: { slug: string; notes: readonly ConversionIssue[] }[] = []
const categories = new Map<string, ReturnType<typeof mapFramerCategory>>()
let written = 0

for (const file of readdirSync(insightsDir).filter((f) => f.endsWith('.json'))) {
  const record = JSON.parse(readFileSync(join(insightsDir, file), 'utf8')) as FramerInsightRecord
  const result = mapFramerInsight(record, { insightPrefix: collections.insight.prefix })
  if (!result.ok) {
    failures.push({ slug: record.slug, issues: result.issues })
    continue
  }
  writeJson(join(CONVERTED_DIR, 'insight', file), result.doc)
  written++
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
  written++
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
    written++
    if (result.notes?.length) notes.push({ slug: record.slug, notes: result.notes })
    const client = mapFramerClient(record.card.client)
    clients.set(client._id, client)
  }

  for (const client of clients.values()) {
    writeJson(
      join(CONVERTED_DIR, 'client', `${client._id.replace('client-framer-', '')}.json`),
      client,
    )
    written++
  }
}

console.log(
  `converted ${written} documents (` +
    `${written - categories.size - caseStudiesWritten - clients.size} insights, ` +
    `${categories.size} categories, ${caseStudiesWritten} case studies, ${clients.size} clients` +
    `) → ${CONVERTED_DIR}`,
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

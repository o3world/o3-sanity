/**
 * Convert → data/converted/<type>/<slug>.json
 *
 * Deterministic transform from data/extract/ to loadable Sanity documents.
 * This file is only the driver: read, dispatch to a mapper, write the ones
 * that passed, report the ones that did not. All the mapping rules — and the
 * fail-loud gates (ADR 0002) — live in `src/map/`, where they are unit-tested
 * in isolation without touching the filesystem.
 *
 *   pnpm --filter @o3/migration convert
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import type { ConversionIssue } from './lib/htmlToPortableText'
import { CONVERTED_DIR, EXTRACT_DIR, writeJson } from './lib/paths'
import type { WpSiteSeo } from './lib/yoast'
import { mapCategory, type WpCategory } from './map/category'
import { mapPerson, type WpPerson } from './map/person'
import { mapPerspective, type WpPerspective } from './map/perspective'

function readDir<T>(type: string): T[] {
  const dir = join(EXTRACT_DIR, type)
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as T)
}

/**
 * The Yoast site-wide defaults every seo mapping needs (#26). Missing means
 * the extract predates `extractSiteSeo` — fail loud rather than convert 272
 * documents with the site name doubled into every title.
 */
function readSiteSeo(): WpSiteSeo {
  const path = join(EXTRACT_DIR, 'site', 'seo.json')
  if (!existsSync(path)) {
    throw new Error(
      `missing ${path} — re-run extract; seo mapping needs the site separator and name`,
    )
  }
  return JSON.parse(readFileSync(path, 'utf8')) as WpSiteSeo
}

const site = readSiteSeo()

const failures: { slug: string; issues: readonly ConversionIssue[] }[] = []
const notes: { slug: string; notes: readonly ConversionIssue[] }[] = []
let written = 0

function emit(type: string, slug: string, doc: unknown) {
  writeJson(join(CONVERTED_DIR, type, `${slug}.json`), doc)
  written++
}

/** Record anything a successful mapping normalized, for the run's report. */
function note(slug: string, mapped: { notes?: readonly ConversionIssue[] }) {
  if (mapped.notes?.length) notes.push({ slug, notes: mapped.notes })
}

// --- categories (all) ---
for (const cat of readDir<WpCategory>('category')) {
  const result = mapCategory(cat)
  if (result.ok) emit('category', cat.slug, result.doc)
  else failures.push({ slug: cat.slug, issues: result.issues })
}

// --- perspectives + the persons they reference ---
const referencedAuthors = new Set<number>()
for (const post of readDir<WpPerspective>('perspective')) {
  const result = mapPerspective(post, site)
  if (!result.ok) {
    failures.push({ slug: post.slug, issues: result.issues })
    continue
  }
  emit('perspective', post.slug, result.doc)
  note(post.slug, result)
  referencedAuthors.add(post.authorId)
}

for (const person of readDir<WpPerson>('person')) {
  if (!referencedAuthors.has(person.wpId)) continue
  const result = mapPerson(person)
  if (result.ok) emit('person', person.slug, result.doc)
  else failures.push({ slug: person.slug, issues: result.issues })
}

console.log(`converted ${written} documents → ${CONVERTED_DIR}`)
if (notes.length > 0) {
  console.warn(`\nNOTES (${notes.length}) — converted, but the source needed cleaning up:`)
  for (const n of notes) {
    console.warn(`  ${n.slug}`)
    for (const i of n.notes) console.warn(`    - [${i.element}] ${i.detail}`)
  }
}
if (failures.length > 0) {
  console.error(`\nFAILED (${failures.length}) — nothing written for these:`)
  for (const f of failures) {
    console.error(`  ${f.slug}`)
    for (const i of f.issues) console.error(`    - [${i.element}] ${i.detail}`)
  }
  process.exitCode = 1
}

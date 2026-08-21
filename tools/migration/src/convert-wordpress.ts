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
import { readCorpus, refsIn } from './core/read'
import { CONVERTED_DIR, EXTRACT_DIR, writeJson } from './lib/paths'
import type { WpChrome } from './lib/chrome'
import type { WpSiteSeo } from './lib/yoast'
import { mapCategory, type WpCategory } from './map/category'
import { buildPersonDirectory, type WpPerson, type WpTeamMember } from './map/person'
import { mapInsight, type WpPerspective } from './map/insight'
import { checkTranslation, translatedCaseStudy } from './map/caseStudy'
import { KEEPER_SLUGS, mapPage, type WpPage } from './map/page'
import { mapSiteSettings } from './map/siteSettings'
import type { ExtractMeta } from './map/types'

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

/** The site chrome extract (#19). Absent means the extract predates it. */
function readChrome(): (WpChrome & { _meta: ExtractMeta }) | null {
  const path = join(EXTRACT_DIR, 'site', 'chrome.json')
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8')) as WpChrome & { _meta: ExtractMeta }
}

const failures: { slug: string; issues: readonly ConversionIssue[] }[] = []
let checkedTranslations = 0
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

// --- the siteSettings singleton: nav, footer, socials, default SEO ---
const chrome = readChrome()
if (chrome) {
  const result = mapSiteSettings(chrome, site)
  if (result.ok) emit('siteSettings', 'settings', result.doc)
  else failures.push({ slug: 'siteSettings', issues: result.issues })
} else {
  console.warn('no data/extract/site/chrome.json — skipping siteSettings; re-run extract')
}

// --- categories (all) ---
for (const cat of readDir<WpCategory>('category')) {
  const result = mapCategory(cat)
  if (result.ok) emit('category', cat.slug, result.doc)
  else failures.push({ slug: cat.slug, issues: result.issues })
}

// --- the utility pages worth keeping (#18) ---
// Every published page is extracted; only the keepers convert. See
// KEEPER_SLUGS in map/page.ts for which, and why the rest do not.
const pagesBySlug = new Map(readDir<WpPage>('page').map((p) => [p.slug, p]))
for (const slug of KEEPER_SLUGS) {
  const page = pagesBySlug.get(slug)
  if (!page) {
    failures.push({
      slug,
      issues: [{ element: 'page', detail: 'listed in KEEPER_SLUGS but not extracted' }],
    })
    continue
  }
  const result = mapPage(page, site)
  if (result.ok) {
    emit('page', slug, result.doc)
    note(slug, result)
  } else {
    failures.push({ slug, issues: result.issues })
  }
}

// --- insights + the persons they reference ---
// The byline directory is built first: an insight's author reference is
// resolved through it, so it has to exist before any insight converts.
const people = buildPersonDirectory(
  readDir<WpPerson>('person'),
  existsSync(join(EXTRACT_DIR, 'team')) ? readDir<WpTeamMember>('team') : [],
)

const referencedPeople = new Set<string>()
// `extract/perspective/` on the way in, `insight` on the way out. The extract
// tree keeps WordPress's vocabulary — it is the record of what WordPress said
// — and this line is the seam where it becomes ours (ADR 0017).
for (const post of readDir<WpPerspective>('perspective')) {
  const result = mapInsight(post, site, people)
  if (!result.ok) {
    failures.push({ slug: post.slug, issues: result.issues })
    continue
  }
  emit('insight', post.slug, result.doc)
  note(post.slug, result)
  // Most insights carry no byline (see `mapInsight`), so this set is
  // built from the ones that do — which is what shrinks the person corpus.
  // The full `refsIn` sweep, not just `.author`: today a converted document
  // holds a person only there, but a future mapper that references one from
  // any other field would otherwise emit a dangling reference.
  for (const ref of refsIn(result.doc)) {
    if (ref.startsWith('person-')) referencedPeople.add(ref)
  }
}

// Hand-written documents point at people too — the About page's team grid
// names six, and a seeded insight has a byline — and those trees are not
// converted here, so their references have to be read off disk. This became
// load-bearing when `post_author` stopped standing in for a byline (#32): the
// archive attributes 11 people now, and Kelly Navari (`person-wp-4`) is on the
// About page without ever having been an ACF byline.
for (const { document } of readCorpus('seed', 'translated')) {
  for (const ref of refsIn(document)) {
    if (ref.startsWith('person-')) referencedPeople.add(ref)
  }
}

// Only people something actually attributes. The team CPT lists everyone who
// ever worked here; a person document nothing points at is noise in Studio.
for (const person of people.docs) {
  if (referencedPeople.has(person._id)) emit('person', person._id, person)
}

// --- agent-translated case studies (#21) ---
// Not converted here — they are written by Claude Code under rules/caseStudy.md.
// convert re-checks them, because the gate is the only mechanical safeguard on
// a document a person wrote: schema conformance, honest provenance hashes, and
// a flag on every required-but-unsourced field.
for (const { type, file, document } of readCorpus('translated')) {
  if (type !== 'caseStudy') continue
  const slug = file.replace(/\.json$/, '')
  const parsed = translatedCaseStudy.safeParse(document)
  if (!parsed.success) {
    failures.push({
      slug,
      issues: parsed.error.issues.map((i) => ({
        element: i.path.join('.'),
        detail: i.message,
      })),
    })
    continue
  }
  const issues = checkTranslation(parsed.data)
  if (issues.length > 0) failures.push({ slug, issues })
  else checkedTranslations++
}

console.log(
  `converted ${written} documents → ${CONVERTED_DIR}` +
    (checkedTranslations > 0 ? ` · ${checkedTranslations} translated documents checked` : ''),
)
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

/**
 * Verify → is the dataset actually what the committed JSON says it is?
 *
 * Runs after every load (#17, reused by #24 for parity checks). The tests
 * check the committed corpus; this checks the thing the corpus was supposed
 * to produce. They catch different failures — a document can be perfect on
 * disk and missing, half-loaded, or shadowed in the dataset.
 *
 *   pnpm --filter @o3/migration verify
 *
 * Exits non-zero on any finding, so it works as a checkpoint rather than a
 * report nobody reads.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { getCliClient } from 'sanity/cli'

import { ROUTABLE_TYPES } from '@o3/sanity/constants'
import { schemaTypes } from '@o3/sanity/schemas'
import type { Migration } from '@o3/sanity/types/generated'

import { isImageAssetId } from './lib/media'
import { CORPUS_DIRS, refsIn } from './lib/corpus'
import { untouchedPlaceholders } from './lib/placeholders'
import { categoryDoc } from './map/category'
import { personDoc } from './map/person'
import { insightDoc } from './map/insight'
import { siteSettingsDoc } from './map/siteSettings'

const client = getCliClient({ apiVersion: '2026-07-01' })

type AnyDoc = { _id: string; _type: string; [k: string]: unknown }

/** Zod gates by type. A type without one is only checked structurally. */
const GATES: Record<string, { safeParse: (v: unknown) => { success: boolean } }> = {
  insight: insightDoc,
  category: categoryDoc,
  person: personDoc,
  siteSettings: siteSettingsDoc,
}

const SCHEMA_TYPE_NAMES = new Set(schemaTypes.map((t) => t.name))

const findings: string[] = []
function report(check: string, lines: string[]) {
  if (lines.length === 0) {
    console.log(`✓ ${check}`)
    return
  }
  console.error(`✗ ${check} (${lines.length})`)
  for (const line of lines.slice(0, 20)) console.error(`    ${line}`)
  if (lines.length > 20) console.error(`    …and ${lines.length - 20} more`)
  findings.push(`${check}: ${lines.length}`)
}

/**
 * The whole committed corpus — all three trees.
 *
 * Converted + seed only until ADR 0016: the translate track loaded drafts-only
 * and this reads PUBLISHED documents, so counting its 20 case studies as
 * "expected" would have failed check 1 on every run. Now that they publish,
 * leaving them out inverts the same mistake — every one would be reported as
 * an orphan by check 8, and the per-type line would read `caseStudy 0 → 20`.
 */
function readCommitted(): AnyDoc[] {
  const docs: AnyDoc[] = []
  for (const root of CORPUS_DIRS) {
    if (!existsSync(root)) continue
    for (const type of readdirSync(root)) {
      const dir = join(root, type)
      for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
        docs.push(JSON.parse(readFileSync(join(dir, f), 'utf8')) as AnyDoc)
      }
    }
  }
  return docs
}

/**
 * Every asset ref held by an image field, with the path that reached it — so a
 * finding names the field to fix rather than just the document.
 */
function imageAssetRefs(
  node: unknown,
  path = '',
  found: { path: string; ref: string }[] = [],
): { path: string; ref: string }[] {
  if (Array.isArray(node)) {
    node.forEach((item, i) => imageAssetRefs(item, `${path}[${i}]`, found))
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (obj._type === 'image') {
      const ref = (obj.asset as { _ref?: unknown } | undefined)?._ref
      if (typeof ref === 'string') found.push({ path: path || '(root)', ref })
    }
    for (const [key, value] of Object.entries(obj)) {
      imageAssetRefs(value, path ? `${path}.${key}` : key, found)
    }
  }
  return found
}

async function main() {
  const committed = readCommitted()
  const expectedIds = new Set(committed.map((d) => d._id))

  // Sanity keeps its own bookkeeping in the dataset — ACL groups, the
  // deployed schema, retention config — under `_.`-prefixed ids. They are not
  // content and every check below would flag them.
  const live = await client.fetch<AnyDoc[]>(
    '*[!(_id in path("drafts.**")) && !(_id in path("_.**")) && !(_type match "sanity.*") && !(_type match "system.*")]',
  )
  const liveById = new Map(live.map((d) => [d._id, d]))

  console.log(
    `committed: ${committed.length} documents · dataset: ${live.length} documents · ` +
      `${client.config().projectId}/${client.config().dataset}\n`,
  )

  // 1. Everything committed is actually in the dataset. The count is the
  //    headline check the ticket asks for (272 insights vs the WP
  //    inventory), stated per type so a shortfall names itself.
  const missing = committed.filter((d) => !liveById.has(d._id)).map((d) => `${d._id} not loaded`)
  report('every committed document is in the dataset', missing)

  const countsByType = new Map<string, { committed: number; live: number }>()
  for (const d of committed) {
    const entry = countsByType.get(d._type) ?? { committed: 0, live: 0 }
    countsByType.set(d._type, { ...entry, committed: entry.committed + 1 })
  }
  for (const d of live) {
    const entry = countsByType.get(d._type) ?? { committed: 0, live: 0 }
    countsByType.set(d._type, { ...entry, live: entry.live + 1 })
  }
  console.log('  per type (committed → dataset):')
  for (const [type, { committed: c, live: l }] of [...countsByType].sort()) {
    console.log(`    ${type.padEnd(16)} ${String(c).padStart(4)} → ${String(l).padStart(4)}`)
  }
  console.log()

  // 2. Every reference in the dataset resolves. A dangling reference renders
  //    as a hole rather than an error, so nothing else surfaces it.
  const dangling: string[] = []
  for (const doc of live) {
    for (const ref of new Set(refsIn(doc))) {
      // Asset refs point at uploads rather than documents, so they are never in
      // `live` and cannot be checked here. That they are the *right kind* of
      // asset for the field holding them is check 3.
      if (!liveById.has(ref) && !ref.startsWith('image-') && !ref.startsWith('file-')) {
        dangling.push(`${doc._id} → ${ref}`)
      }
    }
  }
  report('every reference resolves', dangling)

  // 3. Every image field holds an image asset. A non-image upload in an image
  //    field is the one shape that loads cleanly, passes check 2, and then
  //    throws `Malformed asset _ref` during prerender — failing the entire
  //    production build rather than dropping one image (#32). The renderer now
  //    degrades instead, which makes this the only thing that reports it.
  const wrongAssetKind: string[] = []
  for (const doc of live) {
    for (const { path, ref } of imageAssetRefs(doc)) {
      if (!isImageAssetId(ref)) wrongAssetKind.push(`${doc._id} → ${path} = ${ref}`)
    }
  }
  report('every image field holds an image asset', wrongAssetKind)

  // 4. No image marker survived the load. A `_wpSrc` or `_localSrc` left in
  //    the dataset means the upload was skipped and the image is invisible.
  const unresolvedMedia = live
    .filter((doc) => /"_(wpSrc|localSrc)":/.test(JSON.stringify(doc)))
    .map((doc) => `${doc._id} still carries an unresolved image marker`)
  report('every image resolved to an asset', unresolvedMedia)

  // 5. Every document validates against its mapper's gate — the same gate
  //    convert applied, re-run against what actually landed.
  const invalid: string[] = []
  for (const doc of live) {
    const gate = GATES[doc._type]
    if (gate && !gate.safeParse(doc).success) invalid.push(`${doc._id} fails the ${doc._type} gate`)
  }
  report('every document validates against its schema gate', invalid)

  // 6. Nothing in the dataset has a type the Studio schema does not define —
  //    that document is invisible in Studio and unrenderable.
  const unknownTypes = live
    .filter((doc) => !SCHEMA_TYPE_NAMES.has(doc._type))
    .map((doc) => `${doc._id} has unknown _type "${doc._type}"`)
  report('every document type is in the schema', unknownTypes)

  // 7. One slug, one document. Routes resolve `…[0]`, so a collision serves
  //    a coin flip — and the offender is usually a document the pipeline
  //    does not own, which no check over committed JSON can see.
  const bySlug = new Map<string, string[]>()
  for (const doc of live) {
    if (!(ROUTABLE_TYPES as readonly string[]).includes(doc._type)) continue
    const slug = (doc.slug as { current?: string } | undefined)?.current
    if (!slug) continue
    const key = `${doc._type}:${slug}`
    bySlug.set(key, [...(bySlug.get(key) ?? []), doc._id])
  }
  report(
    'no two documents claim the same slug',
    [...bySlug]
      .filter(([, ids]) => ids.length > 1)
      .map(([key, ids]) => `${key} → ${ids.join(', ')}`),
  )

  // 8. Anything the pipeline did not put there. Not a failure on its own — an
  //    editor may have created it — but during build-out it is usually
  //    leftover scaffolding, and a routable one shadows a seed.
  //    `guidance` documents are owned by a different tool on purpose (#72:
  //    `pnpm guidance:sync`, checked by `pnpm guidance:check`), so they are
  //    not orphans — this pipeline is deleted post-migration and they are not.
  const orphans = live
    .filter((doc) => doc._type !== 'guidance')
    .filter((doc) => !expectedIds.has(doc._id))
    .map(
      (doc) =>
        `${doc._id} (${doc._type})${(ROUTABLE_TYPES as readonly string[]).includes(doc._type) ? ' — routable, so it can shadow a seed' : ''}`,
    )
  report('every document is committed under data/', orphans)

  // 9. Provisional content (#40, ADR 0007). NOT a finding — placeholders are
  //    how a route resolves before its real content exists, and failing on
  //    them would make `verify` red for the whole build-out. But they are the
  //    one class of document that must not survive to launch, so they get
  //    counted out loud every run rather than discovered at the end.
  const provisional = live
    .map((doc) => ({ doc, migration: (doc.migration ?? {}) as Partial<Migration> }))
    .filter(({ migration }) => migration.provisional === true)
    .map(
      ({ doc, migration }) =>
        `${doc._id}${migration.provisionalNote ? ` — ${migration.provisionalNote}` : ''}`,
    )
  if (provisional.length > 0) {
    console.log(
      `\n⚠ provisional content (${provisional.length}) — not authoritative, clear before launch`,
    )
    for (const line of provisional) console.log(`    ${line}`)
  }

  // 10. Sections added from the canvas that nobody has written yet (#112).
  //     Reported here, under the same heading and by the same rule as the
  //     documents above, because they are the same thing one tier down: content
  //     that exists so the page has a shape, not because anyone meant it.
  //
  //     Also NOT a finding, and for a second reason. A placeholder is how a
  //     block gets onto a page, so an editor mid-edit will always have one; the
  //     failure this prevents is a placeholder nobody came back to reaching a
  //     reader, and counting them out loud every run is what catches that.
  const placeholders = untouchedPlaceholders(live)
  if (placeholders.length > 0) {
    console.log(
      `\n⚠ placeholder sections (${placeholders.length}) — inserted from the canvas and not yet written`,
    )
    for (const line of placeholders) console.log(`    ${line}`)
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

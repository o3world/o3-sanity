/**
 * Is the dataset actually what the committed JSON says it is? The committed
 * corpus and a live snapshot in, the ten checks' results out.
 *
 * Pure — no client, no filesystem — so a check's edge case gets a fixture
 * test instead of a live reproduction. The verify entrypoint fetches, calls
 * this, and prints.
 */
import { schemaTypes } from '@o3/sanity/schemas'
import { ROUTABLE_TYPES } from '@o3/sanity/constants'

import { BRIEF_ID, isInternalType, refsIn, type CorpusDoc } from './read'
import {
  describeSlugCollision,
  isProvisional,
  lockedIds,
  provisionalNote,
  slugCollisions,
  slugRowsOf,
  type LockRow,
} from './state'
import { isImageAssetId } from '../lib/media'
import { untouchedPlaceholders } from '../lib/placeholders'
import { categoryDoc } from '../map/category'
import { personDoc } from '../map/person'
import { insightDoc } from '../map/insight'
import { siteSettingsDoc } from '../map/siteSettings'

/** One check, and the lines that fail it — none means the check passed. */
export interface CheckResult {
  readonly check: string
  readonly lines: readonly string[]
}

export interface VerifyReport {
  /** Per-type document counts (committed → dataset), sorted by type. */
  readonly counts: ReadonlyArray<readonly [string, { committed: number; live: number }]>
  /** The findings checks, in the order they print. */
  readonly checks: readonly CheckResult[]
  /** Provisional documents (#40, ADR 0007) — a warning, never a finding. */
  readonly provisional: readonly string[]
  /** Untouched canvas placeholders (#112) — a warning, never a finding. */
  readonly placeholders: readonly string[]
}

/** Zod gates by type. A type without one is only checked structurally. */
const GATES: Record<string, { safeParse: (v: unknown) => { success: boolean } }> = {
  insight: insightDoc,
  category: categoryDoc,
  person: personDoc,
  siteSettings: siteSettingsDoc,
}

const SCHEMA_TYPE_NAMES = new Set(schemaTypes.map((t) => t.name))

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

/**
 * @param locks The raw-perspective lock rows for every live document in both
 * its forms. Raw because a lock can sit on the draft copy while the published
 * copy is the orphan, and `load` treats a lock on either copy as locking the
 * pair — the orphan check has to read it the same way.
 */
export function report(
  committed: readonly CorpusDoc[],
  live: readonly CorpusDoc[],
  locks: readonly LockRow[],
): VerifyReport {
  const expectedIds = new Set(committed.map((d) => d._id))
  const liveById = new Map(live.map((d) => [d._id, d]))
  const locked = lockedIds(locks)
  const checks: CheckResult[] = []

  // 1. Everything committed is actually in the dataset. The count is the
  //    headline check the ticket asks for (272 insights vs the WP
  //    inventory), stated per type so a shortfall names itself.
  checks.push({
    check: 'every committed document is in the dataset',
    lines: committed.filter((d) => !liveById.has(d._id)).map((d) => `${d._id} not loaded`),
  })

  const countsByType = new Map<string, { committed: number; live: number }>()
  for (const d of committed) {
    const entry = countsByType.get(d._type) ?? { committed: 0, live: 0 }
    countsByType.set(d._type, { ...entry, committed: entry.committed + 1 })
  }
  for (const d of live) {
    const entry = countsByType.get(d._type) ?? { committed: 0, live: 0 }
    countsByType.set(d._type, { ...entry, live: entry.live + 1 })
  }

  // 2. Every reference in the dataset resolves. A dangling reference renders
  //    as a hole rather than an error, so nothing else surfaces it.
  const dangling: string[] = []
  for (const doc of live) {
    for (const ref of new Set(refsIn(doc))) {
      // Asset refs point at uploads rather than documents, so they are never in
      // `live` and cannot be checked here. That they are the *right kind* of
      // asset for the field holding them is check 3.
      //
      // A `briefs` entry is weak and points at a document this pipeline does
      // not sync, so an absent brief is a state ADR 0027 accepts rather than a
      // finding: nothing renders a brief, and a dataset-born one that survived
      // no rebuild is exactly the standing bet that ADR took.
      if (BRIEF_ID.test(ref)) continue
      if (!liveById.has(ref) && !ref.startsWith('image-') && !ref.startsWith('file-')) {
        dangling.push(`${doc._id} → ${ref}`)
      }
    }
  }
  checks.push({ check: 'every reference resolves', lines: dangling })

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
  checks.push({ check: 'every image field holds an image asset', lines: wrongAssetKind })

  // 4. No image marker survived the load. A `_wpSrc` or `_localSrc` left in
  //    the dataset means the upload was skipped and the image is invisible.
  checks.push({
    check: 'every image resolved to an asset',
    lines: live
      .filter((doc) => /"_(wpSrc|localSrc)":/.test(JSON.stringify(doc)))
      .map((doc) => `${doc._id} still carries an unresolved image marker`),
  })

  // 5. Every document validates against its mapper's gate — the same gate
  //    convert applied, re-run against what actually landed.
  const invalid: string[] = []
  for (const doc of live) {
    const gate = GATES[doc._type]
    if (gate && !gate.safeParse(doc).success) invalid.push(`${doc._id} fails the ${doc._type} gate`)
  }
  checks.push({ check: 'every document validates against its schema gate', lines: invalid })

  // 6. Nothing in the dataset has a type the Studio schema does not define —
  //    that document is invisible in Studio and unrenderable.
  checks.push({
    check: 'every document type is in the schema',
    lines: live
      .filter((doc) => !SCHEMA_TYPE_NAMES.has(doc._type))
      .map((doc) => `${doc._id} has unknown _type "${doc._type}"`),
  })

  // 7. One slug, one document. The same implementation `load` reports from,
  //    so the two cannot disagree about whether a URL is a coin flip — and
  //    the offender is usually a document the pipeline does not own, which no
  //    check over committed JSON can see.
  checks.push({
    check: 'no two documents claim the same slug',
    lines: slugCollisions(slugRowsOf(live)).map(describeSlugCollision),
  })

  // 8. Anything the pipeline did not put there. Not a failure on its own — an
  //    editor may have created it — but during build-out it is usually
  //    leftover scaffolding, and a routable one shadows a seed.
  //    `brief` documents are owned by a different tool on purpose, and
  //    `guidance` documents are a retired type production still holds
  //    (`INTERNAL_TYPES`), so neither counts as an orphan. A locked one is a
  //    document `load` skipped on purpose (ADR 0003), so it is named as a
  //    skip rather than left for an agent to investigate.
  checks.push({
    check: 'every document is committed under data/',
    lines: live
      .filter((doc) => !isInternalType(doc._type))
      .filter((doc) => !expectedIds.has(doc._id))
      .map((doc) =>
        locked.has(doc._id)
          ? `${doc._id} (${doc._type}) — skipped: locked`
          : `${doc._id} (${doc._type})${(ROUTABLE_TYPES as readonly string[]).includes(doc._type) ? ' — routable, so it can shadow a seed' : ''}`,
      ),
  })

  // 9. Provisional content (#40, ADR 0007). NOT a finding — placeholders are
  //    how a route resolves before its real content exists, and failing on
  //    them would make `verify` red for the whole build-out. But they are the
  //    one class of document that must not survive to launch, so they get
  //    counted out loud every run rather than discovered at the end.
  const provisional = live.filter(isProvisional).map((doc) => {
    const note = provisionalNote(doc)
    return `${doc._id}${note ? ` — ${note}` : ''}`
  })

  // 10. Sections added from the canvas that nobody has written yet (#112).
  //     Reported under the same heading and by the same rule as the documents
  //     above, because they are the same thing one tier down: content that
  //     exists so the page has a shape, not because anyone meant it.
  //
  //     Also NOT a finding, and for a second reason. A placeholder is how a
  //     block gets onto a page, so an editor mid-edit will always have one; the
  //     failure this prevents is a placeholder nobody came back to reaching a
  //     reader, and counting them out loud every run is what catches that.
  const placeholders = untouchedPlaceholders(live)

  return { counts: [...countsByType].sort(), checks, provisional, placeholders }
}

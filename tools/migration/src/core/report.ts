/**
 * Is the dataset healthy? A live snapshot in, the checks' results out.
 * Production is the content of record, so nothing here compares it with the
 * committed JSON: each check is something that breaks a page whatever wrote
 * the document.
 *
 * Pure — no client, no filesystem — so a check's edge case gets a fixture
 * test instead of a live reproduction. The verify entrypoint fetches, calls
 * this, and prints.
 */
import { schemaTypes } from '@o3/sanity/schemas'

import { BRIEF_ID, refsIn, type CorpusDoc } from './read'
import {
  describeSlugCollision,
  isProvisional,
  provisionalNote,
  slugCollisions,
  slugRowsOf,
} from './state'
import { isImageAssetId } from '../lib/media'
import { untouchedPlaceholders } from '../lib/placeholders'

/** One check, and the lines that fail it — none means the check passed. */
export interface CheckResult {
  readonly check: string
  readonly lines: readonly string[]
}

export interface VerifyReport {
  /** Per-type document counts in the dataset, sorted by type. */
  readonly counts: ReadonlyArray<readonly [string, number]>
  /** The findings checks, in the order they print. */
  readonly checks: readonly CheckResult[]
  /** Provisional documents (#40, ADR 0007) — a warning, never a finding. */
  readonly provisional: readonly string[]
  /** Untouched canvas placeholders (#112) — a warning, never a finding. */
  readonly placeholders: readonly string[]
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

export function report(live: readonly CorpusDoc[]): VerifyReport {
  const liveById = new Map(live.map((d) => [d._id, d]))
  const checks: CheckResult[] = []

  const countsByType = new Map<string, number>()
  for (const d of live) countsByType.set(d._type, (countsByType.get(d._type) ?? 0) + 1)

  // 1. Every reference in the dataset resolves. A dangling reference renders
  //    as a hole rather than an error, so nothing else surfaces it.
  const dangling: string[] = []
  for (const doc of live) {
    for (const ref of new Set(refsIn(doc))) {
      // Asset refs point at uploads rather than documents, so they are never in
      // `live` and cannot be checked here. That they are the *right kind* of
      // asset for the field holding them is check 2.
      //
      // A `briefs` entry is weak and points at a brief, which lives only in the
      // dataset and is never committed under `data/`, so an absent one is not
      // a finding: nothing renders a brief.
      if (BRIEF_ID.test(ref)) continue
      if (!liveById.has(ref) && !ref.startsWith('image-') && !ref.startsWith('file-')) {
        dangling.push(`${doc._id} → ${ref}`)
      }
    }
  }
  checks.push({ check: 'every reference resolves', lines: dangling })

  // 2. Every image field holds an image asset. A non-image upload in an image
  //    field is the one shape that loads cleanly, passes check 1, and then
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

  // 3. No image marker survived a write. A source marker left in the dataset
  //    means the upload was skipped and the image is invisible. All three
  //    markers in `map/types.ts`: a marker missing here would load its images
  //    as nothing and pass this check.
  checks.push({
    check: 'every image resolved to an asset',
    lines: live
      .filter((doc) => /"_(wpSrc|srcUrl|localSrc)":/.test(JSON.stringify(doc)))
      .map((doc) => `${doc._id} still carries an unresolved image marker`),
  })

  // 4. Nothing in the dataset has a type the Studio schema does not define —
  //    that document is invisible in Studio and unrenderable.
  checks.push({
    check: 'every document type is in the schema',
    lines: live
      .filter((doc) => !SCHEMA_TYPE_NAMES.has(doc._type))
      .map((doc) => `${doc._id} has unknown _type "${doc._type}"`),
  })

  // 5. One slug, one document. The offender is usually a document created
  //    in Studio, which no check over committed JSON can see.
  checks.push({
    check: 'no two documents claim the same slug',
    lines: slugCollisions(slugRowsOf(live)).map(describeSlugCollision),
  })

  // Provisional content (#40, ADR 0007). NOT a finding — placeholders are
  //    how a route resolves before its real content exists, and failing on
  //    them would make `verify` red for the whole build-out. But they are the
  //    one class of document that must not survive to launch, so they get
  //    counted out loud every run rather than discovered at the end.
  const provisional = live.filter(isProvisional).map((doc) => {
    const note = provisionalNote(doc)
    return `${doc._id}${note ? ` — ${note}` : ''}`
  })

  // Sections added from the canvas that nobody has written yet (#112).
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

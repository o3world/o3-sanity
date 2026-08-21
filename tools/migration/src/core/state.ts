/**
 * The migration-state vocabulary: locked, provisional, and slug collision.
 *
 * One home for the three things `load` and `verify` both have an opinion
 * about, so the two entry points cannot hold different opinions. Pure — no
 * client, no filesystem — which is what lets the destructive rules be pinned
 * by fixtures instead of by a live dataset.
 */
import { z } from 'zod'

import { ROUTABLE_TYPES } from '@o3/sanity/constants'
import type { Migration } from '@o3/sanity/types/generated'

/**
 * The `migration` object a pipeline-owned document carries, as its mapper's
 * gate sees it. Both fields are required on the way in — a document with no
 * `locked` flag is one the lock rule cannot protect, and one with no
 * `sourceId` cannot be traced back to what produced it — while the schema
 * keeps them optional so an editor's document is legal without them.
 *
 * A document type with a stricter rule refines this rather than restating it
 * (see `caseStudyMigration` in `map/caseStudy.ts`).
 */
export const migrationObject = z.object({ locked: z.boolean(), sourceId: z.string() })

/** The lock flag as the projections below return it, published or draft. */
export interface LockRow {
  readonly _id: string
  readonly locked: boolean | null
}

/** `drafts.insight-wp-1` → `insight-wp-1`. */
export function bareId(id: string): string {
  return id.replace(/^drafts\./, '')
}

const LOCKED_PROJECTION = '{_id, "locked": migration.locked}'

/** The lock flag for a known set of ids — what a run is about to write. */
export const LOCKED_BY_ID = `*[_id in $ids]${LOCKED_PROJECTION}`

/** The lock flag for every document of a type — the retirement candidates. */
export const LOCKED_BY_TYPE = `*[_type in $types]${LOCKED_PROJECTION}`

/**
 * `perspective: 'raw'`, and it is load-bearing: the client defaults to the
 * published perspective, which cannot see a draft at all. Read that way the
 * lock rule was half a rule — a locked draft came back unlocked and was
 * overwritten — so both projections above are fetched with these options.
 */
export const LOCK_FETCH_OPTIONS = { perspective: 'raw' } as const

/**
 * An editor took this copy over. Absent is not locked: a document the pipeline
 * has never stamped comes back with `locked: null`, and treating that as a
 * lock would stop the loader writing anything.
 */
export function isLocked(row: LockRow): boolean {
  return row.locked === true
}

/**
 * Which documents an editor has taken over, by the id of the document rather
 * than of the copy that carries the flag: a lock on either the draft or the
 * published document locks the pair, because ADR 0003 protects the document.
 */
export function lockedIds(rows: readonly LockRow[]): Set<string> {
  return new Set(rows.filter(isLocked).map((row) => bareId(row._id)))
}

/**
 * Content that exists so a route resolves, not because anyone meant it
 * (#40, ADR 0007). Never a finding — `verify` counts it out loud so the class
 * of document that must not survive to launch is visible every run rather
 * than discovered at the end.
 */
export function isProvisional(doc: WithMigration): boolean {
  return migrationOf(doc).provisional === true
}

/** What a provisional document says is still missing, if it says. */
export function provisionalNote(doc: WithMigration): string | undefined {
  return migrationOf(doc).provisionalNote
}

/**
 * Any document, read for its `migration` object only. The index signature is
 * what lets a whole dataset row satisfy it without a cast.
 */
interface WithMigration {
  readonly migration?: unknown
  readonly [key: string]: unknown
}

function migrationOf(doc: WithMigration): Partial<Migration> {
  return (doc.migration ?? {}) as Partial<Migration>
}

/** A routable document's slug, flattened out of `slug.current`. */
export interface SlugRow {
  readonly _id: string
  readonly _type: string
  readonly slug: string | null
}

/** One URL, more than one document claiming it. */
export interface SlugCollision {
  readonly key: string
  readonly ids: readonly string[]
}

/**
 * Every routable slug in the dataset, published copies only — a draft cannot
 * be served, so it cannot collide.
 */
export const ROUTABLE_SLUGS =
  '*[_type in $types && defined(slug.current) && !(_id in path("drafts.**"))]' +
  '{_id, _type, "slug": slug.current}'

/**
 * The same rows out of whole documents, for the entry point that already holds
 * the dataset in memory and has no reason to fetch them again.
 */
export function slugRowsOf(
  docs: readonly { _id: string; _type: string; slug?: unknown }[],
): SlugRow[] {
  const rows: SlugRow[] = []
  for (const doc of docs) {
    if (!(ROUTABLE_TYPES as readonly string[]).includes(doc._type)) continue
    const slug = (doc.slug as { current?: string } | undefined)?.current
    if (!slug) continue
    rows.push({ _id: doc._id, _type: doc._type, slug })
  }
  return rows
}

/**
 * Two documents claiming one URL. Routes resolve with
 * `*[_type == $type && slug.current == $slug][0]`, so the page served is a
 * coin flip: a leftover `page-home` shared the homepage seed's `index` slug
 * and won the toss about half the time, serving two sections instead of eight
 * with nothing failing.
 *
 * The type is part of the key because the routes are per-collection — an
 * insight and a page may both be `about`.
 */
export function slugCollisions(rows: readonly SlugRow[]): SlugCollision[] {
  const byKey = new Map<string, string[]>()
  for (const row of rows) {
    if (!row.slug) continue
    const key = `${row._type}:${row.slug}`
    byKey.set(key, [...(byKey.get(key) ?? []), row._id])
  }
  return [...byKey]
    .filter(([, ids]) => ids.length > 1)
    .map(([key, ids]) => ({ key, ids }) satisfies SlugCollision)
}

/** The one line both entry points print for a collision. */
export function describeSlugCollision(collision: SlugCollision): string {
  return `${collision.key} → ${collision.ids.join(', ')}`
}

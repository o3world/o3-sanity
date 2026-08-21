/**
 * The migration-state vocabulary: locked, provisional, and slug collision.
 *
 * One home for the three things `load` and `verify` both have an opinion
 * about, so the two entry points cannot hold different opinions. Pure — no
 * client, no filesystem — which is what lets the destructive rules be pinned
 * by fixtures instead of by a live dataset.
 */

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

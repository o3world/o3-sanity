import { fieldsOf } from './corpus/plan'
import { readGlobbedSources } from './corpus/read'
import { REPO_ROOT } from './repo'

import type { Corpus } from './corpus/plan'
import type { Brief } from '@o3/sanity/types/generated'

/** Pinned to the schema, so renaming the document type breaks the build rather than the sync. */
export const BRIEF_TYPE = 'brief' satisfies Brief['_type']

/**
 * The corpus directory, repo-relative. Registration is globbed rather than
 * declared: briefing a piece is dropping a file in here and syncing, and a
 * hand-maintained list would be a second edit to forget (ADR 0027).
 */
export const BRIEF_DIR = 'tools/guidance/briefs'

/**
 * A brief's markdown is its `background` — the raw material the piece was
 * written from. Every other field is outside the corpus's authority, which is
 * why briefs sync by merge: the pipeline stages patch their own fields as a
 * run proceeds, and `instructions` and `links` are the human's on a
 * dataset-born brief and locked with every other field on a file-backed one
 * (ADR 0027).
 */
const BRIEF_BODY = 'background' satisfies keyof Brief

/**
 * The compared fields, pinned to the generated type: rename one on the schema
 * and this fails the build, rather than sync writing a field the schema no
 * longer declares while check agrees with it. Also what the snapshot query
 * projects, so comparison and fetch cannot drift apart.
 */
export const BRIEF_FIELDS = fieldsOf({ bodyField: BRIEF_BODY }) satisfies readonly (keyof Brief)[]

/**
 * The brief corpus as the repo currently defines it, read off disk.
 *
 * Two things separate it from guidance. Its documents carry a field the
 * dataset writes, so a source commits as a merge rather than a replace. And a
 * document with no `sourcePath` is a brief the authoring skill wrote
 * mid-session — a supported provenance state, not a leftover — so the corpus
 * claims only the file-backed ones.
 */
export function briefCorpus(): Corpus {
  return {
    type: BRIEF_TYPE,
    bodyField: BRIEF_BODY,
    writes: 'merge',
    claimsOrphans: 'file-backed',
    sources: readGlobbedSources(REPO_ROOT, BRIEF_DIR),
  }
}

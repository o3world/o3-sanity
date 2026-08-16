import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CORPUS_FIELDS } from './corpus/plan'
import { readDeclaredSources } from './corpus/read'

import type { Corpus } from './corpus/plan'
import type { SourceDeclaration } from './corpus/read'
import type { Guidance } from '@o3/sanity/types/generated'

/** The monorepo root — sources are declared repo-relative so they read the same in Studio. */
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

/** Pinned to the schema, so renaming the document type breaks the build rather than the sync. */
export const GUIDANCE_TYPE = 'guidance' satisfies Guidance['_type']

/**
 * The compared fields, pinned the same way: rename a guidance field in the
 * schema and this fails the build, instead of sync writing a field the schema
 * no longer declares while check agrees with it. Also what the snapshot
 * queries project, so comparison and fetch cannot drift apart.
 */
export const GUIDANCE_FIELDS = CORPUS_FIELDS satisfies readonly (keyof Guidance)[]

/**
 * The guidance corpus: repo markdown → dataset document, one row per document.
 *
 * The repo is source of truth (map #63 — voice is never packaged in the skill
 * ZIP, and never authored in Studio). Adding a guidance document is adding a
 * row here. Registration is declared rather than globbed because two of these
 * files live outside any corpus directory, and one of them is a Claude skill.
 */
const GUIDANCE_SOURCES: SourceDeclaration[] = [
  {
    key: 'o3-voice',
    title: 'O3 voice guide',
    sourcePath: '.claude/skills/o3world-copy/SKILL.md',
  },
  {
    /* The voice guide delegates the pillars, principles and values to
     * `brand.md` — a filesystem link a Desktop agent cannot follow, so the
     * store carries the foundation too or the delegation dead-ends. */
    key: 'o3-brand',
    title: 'O3 brand foundation',
    sourcePath: 'docs/guidance/brand.md',
  },
  {
    /* Same delegation, same reason: the voice guide's revision pass sends the
     * reader here for the machine tells, and for the reconciliation of the
     * four O3 moves that sit close to a banned pattern. */
    key: 'o3-slop',
    title: 'O3 slop patterns',
    sourcePath: 'docs/guidance/slop.md',
  },
  {
    /* The cross-block half of design-system knowledge (ADR 0025): what order
     * bands go in, which surfaces they paint, which block carries which job.
     * The other half, what one block is for, lives in that block's schema
     * `description` where `get_schema` delivers it. */
    key: 'o3-composition',
    title: 'O3 composition catalog',
    sourcePath: 'docs/guidance/composition.md',
  },
  {
    /* How one long argument holds up — claim, warrant, evidence, arc, turn,
     * ending. The brief applies it before drafting and the shuffle test checks
     * it afterwards. Separate from the composition catalog because arranging
     * bands on a page and shaping prose inside one body answer to different
     * evidence: the catalog yields to a canonical Figma frame, and nothing in
     * Figma has anything to say about where an essay turns. */
    key: 'o3-argument',
    title: 'O3 long-form argument',
    sourcePath: 'docs/guidance/argument.md',
  },
  {
    /* What the design looks like, for the agent that has to make a picture
     * rather than read one. Values are the `packages/tailwind-config/tokens/`
     * set restated for a prompt — a Desktop agent can reach the dataset and
     * not the CSS, and an image model needs hex numbers and a described
     * gradient rather than a custom property. */
    key: 'o3-visual',
    title: 'O3 visual language',
    sourcePath: 'docs/guidance/visual.md',
  },
]

/** The guidance corpus as the repo currently defines it, read off disk. */
export function guidanceCorpus(): Corpus {
  return { type: GUIDANCE_TYPE, sources: readDeclaredSources(REPO_ROOT, GUIDANCE_SOURCES) }
}

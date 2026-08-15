import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Guidance } from '@o3/sanity/types/generated'

/** The monorepo root — sources are declared repo-relative so they read the same in Studio. */
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

/**
 * The guidance corpus: repo markdown → dataset document, one row per document.
 *
 * The repo is source of truth (map #63 — voice is never packaged in the skill
 * ZIP, and never authored in Studio). Adding a guidance document is adding a
 * row here.
 */
const GUIDANCE_SOURCES = [
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
    /* Two parts. Part one is the cross-block half of design-system knowledge
     * (ADR 0025): what order bands go in, which surfaces they paint, which
     * block carries which job — the other half, what one block is for, lives
     * in that block's schema `description` where `get_schema` delivers it.
     * Part two is how one long argument holds up, which is what the authoring
     * skill's brief applies before it writes anything. */
    key: 'o3-composition',
    title: 'O3 composition catalog',
    sourcePath: 'docs/guidance/composition.md',
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
] as const

/** Deterministic and outside the load pipeline's `<type>-(wp|seed)-` ownership contract. */
export const idFor = (key: string) => `guidance-${key}`

export type GuidanceDoc = Required<Pick<Guidance, '_id' | '_type' | 'key' | 'title' | 'body'>> &
  Pick<Guidance, 'sourcePath'>

/**
 * Skill frontmatter is packaging metadata for Claude's skill loader, not
 * guidance — it names and describes the file for a system the dataset's
 * readers are not part of, so it is stripped rather than synced.
 */
function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n+/, '')
}

/** The guidance documents as the repo currently defines them. */
export function readGuidance(): GuidanceDoc[] {
  return GUIDANCE_SOURCES.map((source) => {
    const body = stripFrontmatter(readFileSync(join(REPO_ROOT, source.sourcePath), 'utf8')).trim()
    if (!body) throw new Error(`${source.sourcePath} is empty after stripping frontmatter`)
    return {
      _id: idFor(source.key),
      _type: 'guidance',
      key: source.key,
      title: source.title,
      body,
      sourcePath: source.sourcePath,
    }
  })
}

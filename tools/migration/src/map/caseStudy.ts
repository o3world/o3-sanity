import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { z } from 'zod'

import { migrationObject } from '../core/state'
import { EXTRACT_DIR, RULES_DIR } from '../lib/paths'
import { migratableImage } from './types'
import { seoObject } from './seo'

/**
 * The gate on agent-translated case studies (#21).
 *
 * Everything else in `map/` is a transform with a schema check on the way
 * out. This is only the check: the transform is Claude Code working from
 * `rules/caseStudy.md`, because the source (four levels of nested ACF laid
 * out for a dead page template) and the target (a structured document) have
 * no mechanical relationship (ADR 0002's translate track).
 *
 * That makes the gate the whole safety mechanism, so it checks three things a
 * plain schema check would not:
 *
 * - **Provenance is honest.** The recorded hashes of the source and the rules
 *   must match the files on disk. A translation done against a different
 *   source, or under different rules, is not the translation that was
 *   reviewed.
 * - **Required-but-unsourced fields are flagged.** `narrativeHeadline` and
 *   every chapter's `title` are required by the schema and usually absent
 *   from the source, so they are written by an agent. A document that
 *   supplies them with no flag has quietly invented copy — the one failure
 *   mode this track exists to prevent.
 * - **Nothing is published.** Enforced in `load`, asserted here.
 */

const flag = z.object({
  field: z.string().min(1),
  kind: z.enum(['proposed', 'derived', 'verbatim', 'dropped']),
  note: z.string().min(1),
})

export type TranslationFlag = z.infer<typeof flag>

export const translationMeta = z.object({
  sourceFile: z.string().min(1),
  sourceHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  rulesFile: z.string().min(1),
  rulesHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  model: z.string().min(1),
  translatedAt: z.string().min(1),
  flags: z.array(flag),
})

const portableTextBlock = z.object({ _type: z.string(), _key: z.string() }).loose()

const figure = z
  .object({ _type: z.literal('figure'), image: migratableImage, alt: z.string().min(1) })
  .loose()

const SURFACES = ['white', 'bone', 'ink'] as const

/**
 * A chapter of the narrative. `details` is the frame's term/description
 * breakdown (`2274:4009`, #97) — written only where the source names the
 * disciplines and says what each one did, like every other field here.
 */
const chapter = z.object({
  _type: z.literal('chapter'),
  _key: z.string(),
  kicker: z.string().min(1),
  title: z.string().min(1),
  body: z.array(portableTextBlock).min(1),
  details: z
    .array(
      z.object({
        _type: z.literal('detail'),
        _key: z.string(),
        label: z.string().min(1),
        body: z.string().min(1).optional(),
      }),
    )
    .min(1)
    .optional(),
})

/**
 * The two section blocks the translate track actually writes, checked in
 * full. `variant: 'capture'` is the tall page screenshot on a dark stage;
 * `width` says nothing under it, so it is left off there.
 */
const mediaSection = z.object({
  _type: z.literal('mediaSection'),
  _key: z.string(),
  surface: z.enum(SURFACES).optional(),
  variant: z.enum(['plain', 'capture']).optional(),
  width: z.enum(['contained', 'full-bleed']).optional(),
  media: figure,
})

const screenGridSection = z.object({
  _type: z.literal('screenGridSection'),
  _key: z.string(),
  surface: z.enum(SURFACES).optional(),
  screens: z
    .array(
      z.object({
        _type: z.literal('screen'),
        _key: z.string(),
        media: figure,
        tone: z.enum(['ink', 'brand', 'bone']).optional(),
        span: z.enum(['standard', 'wide']).optional(),
      }),
    )
    .min(1),
})

const MODELLED = new Set(['chapter', 'mediaSection', 'screenGridSection'])

/**
 * Any other registered section block. `story` accepts everything
 * `page.sections` does (ADR 0018), and restating that list here would be the
 * second copy `sectionBlockMembers` exists to prevent — so an unmodelled
 * block passes on shape alone.
 *
 * The refusal is the point of the arm: without it, a `chapter` or a
 * `mediaSection` that failed the check above would fall through to this one
 * and load malformed.
 */
const unmodelledSection = z
  .object({ _type: z.string().min(1), _key: z.string() })
  .loose()
  .refine((block) => !MODELLED.has(block._type), {
    message: 'block does not match the shape this gate checks for its type',
  })

/**
 * The interleaved narrative — chapters and bands in reading order (ADR 0018).
 * Chapter numbering derives from a chapter's order among the *chapter*
 * members, so a band between two chapters costs nothing.
 */
const storyMember = z.union([chapter, mediaSection, screenGridSection, unmodelledSection])

/**
 * The shared `migration` fragment, read as strictly as both tracks need it.
 * An agent writes these documents, so the gate refuses a lock — that flag is
 * an editor's to set, and one arriving pre-set would exempt the document from
 * the next load — and refuses a source that is neither a WordPress work item
 * nor an o3xo.ai case study.
 */
const caseStudyMigration = migrationObject
  .extend({
    /* The coverage-gap marker (ADR 0007). Never set by the translate track,
     * whose whole review mechanism is `_meta.flags`; set by the Framer mapper,
     * where the gap is the same on all six documents and belongs on each one. */
    provisional: z.boolean().optional(),
    provisionalNote: z.string().min(1).optional(),
  })
  .refine((migration) => migration.locked === false, {
    message: 'a case study must arrive unlocked',
  })
  .refine(
    (migration) => /^(wp:work:\d+|framer:caseStudy:[A-Za-z0-9_-]+)$/.test(migration.sourceId),
    { message: 'sourceId must name a WordPress work item or an o3xo.ai case study' },
  )

export const caseStudyDoc = z.object({
  /* `-wp-<postId>` for a WordPress `work` post, `-framer-<slug>` for one of
   * o3xo.ai's case studies (`map/framerCaseStudy.ts`). */
  _id: z.string().regex(/^caseStudy-(wp-\d+|framer-[a-z0-9-]+)$/),
  _type: z.literal('caseStudy'),
  title: z.string().min(1),
  slug: z.object({ _type: z.literal('slug'), current: z.string().min(1) }),
  client: z.object({ _type: z.literal('reference'), _ref: z.string().min(1) }),
  industries: z
    .array(z.object({ _type: z.literal('reference'), _ref: z.string(), _key: z.string() }))
    .optional(),
  industryDetail: z.string().min(1).optional(),
  narrativeHeadline: z.string().min(1),
  stats: z
    .array(
      z.object({
        _type: z.literal('stat'),
        _key: z.string(),
        value: z.string().min(1),
        label: z.string().min(1),
      }),
    )
    .optional(),
  heroMedia: figure.optional(),
  story: z.array(storyMember).optional(),
  deliverables: z.array(z.string().min(1)).optional(),
  seo: seoObject.optional(),
  migration: caseStudyMigration,
})

export type CaseStudyDoc = z.infer<typeof caseStudyDoc>

/** A translated file: the document plus its provenance header. */
export const translatedCaseStudy = caseStudyDoc.extend({ _meta: translationMeta })

export type TranslatedCaseStudy = z.infer<typeof translatedCaseStudy>

export function sha256(bytes: string | Buffer): string {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`
}

export interface TranslationIssue {
  readonly element: string
  readonly detail: string
}

/**
 * Fields the schema requires but the WordPress source has no equivalent for.
 * Anything here must carry a `proposed` (or `derived`) flag naming it — that
 * is the difference between "an agent wrote this and said so" and "an agent
 * wrote this".
 */
function unsourcedRequiredFields(doc: CaseStudyDoc): string[] {
  const fields = ['narrativeHeadline']
  // Story-relative: a chapter's path is its index in `story`, not its index
  // among the chapters — the array holds bands too (ADR 0018), and a flag has
  // to name the thing a reviewer can find.
  doc.story?.forEach((member, i) => {
    if (member._type === 'chapter') fields.push(`story[${i}].title`)
  })
  return fields
}

/**
 * Check a translated file against the rules the pipeline can actually
 * enforce. Returns the reasons it should not load, or an empty list.
 */
export function checkTranslation(file: TranslatedCaseStudy): TranslationIssue[] {
  const issues: TranslationIssue[] = []
  const { _meta: meta, ...doc } = file

  const sourcePath = join(EXTRACT_DIR, meta.sourceFile)
  if (!existsSync(sourcePath)) {
    issues.push({ element: '_meta.sourceFile', detail: `no extract at ${meta.sourceFile}` })
  } else if (sha256(readFileSync(sourcePath)) !== meta.sourceHash) {
    issues.push({
      element: '_meta.sourceHash',
      detail: `${meta.sourceFile} has changed since translation — re-translate and re-review`,
    })
  }

  const rulesPath = join(RULES_DIR, meta.rulesFile.replace(/^rules\//, ''))
  if (!existsSync(rulesPath)) {
    issues.push({ element: '_meta.rulesFile', detail: `no rules at ${meta.rulesFile}` })
  } else if (sha256(readFileSync(rulesPath)) !== meta.rulesHash) {
    issues.push({
      element: '_meta.rulesHash',
      detail: `${meta.rulesFile} has changed since translation — re-translate and re-review`,
    })
  }

  const flagged = new Set(meta.flags.map((f) => f.field))
  for (const field of unsourcedRequiredFields(doc as CaseStudyDoc)) {
    if (!flagged.has(field)) {
      issues.push({
        element: field,
        detail: 'required by the schema, unsourced in WordPress, and not flagged for review',
      })
    }
  }

  return issues
}

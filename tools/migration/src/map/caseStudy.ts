import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { z } from 'zod'

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
 *   every `chapter.title` are required by the schema and usually absent from
 *   the source, so they are written by an agent. A document that supplies
 *   them with no flag has quietly invented copy — the one failure mode this
 *   track exists to prevent.
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

export const caseStudyDoc = z.object({
  _id: z.string().regex(/^caseStudy-wp-\d+$/),
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
  heroMedia: z
    .object({ _type: z.literal('figure'), image: migratableImage, alt: z.string().min(1) })
    .loose()
    .optional(),
  chapters: z
    .array(
      z.object({
        _type: z.literal('chapter'),
        _key: z.string(),
        kicker: z.string().min(1),
        title: z.string().min(1),
        body: z.array(portableTextBlock).min(1),
      }),
    )
    .optional(),
  deliverables: z.array(z.string().min(1)).optional(),
  extraSections: z.array(portableTextBlock).optional(),
  seo: seoObject.optional(),
  migration: z.object({
    locked: z.literal(false),
    sourceId: z.string().regex(/^wp:work:\d+$/),
    extractedAt: z.string().min(1),
  }),
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
  doc.chapters?.forEach((_, i) => fields.push(`chapters[${i}].title`))
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

import { z } from 'zod'

import { assetUrl, type FramerCaseStudy } from '../lib/framer'
import { convertHtml, createKeyGenerator, type ConversionIssue } from '../lib/htmlToPortableText'
import { caseStudyDoc, type CaseStudyDoc } from './caseStudy'
import { idKey } from './framer'
import { checkPathParity } from './paths'
import { seoObject, type SeoObject } from './seo'
import { failed, ok, type ExtractMeta, type Mapped } from './types'

/**
 * o3xo.ai's case studies → the shared `caseStudy` model (#219).
 *
 * The sibling of `map/framer.ts`, one collection over, and it inherits that
 * file's answers: no date is published anywhere on this site, no byline, no
 * taxonomy. None of those is a `caseStudy` field, so the only one that shows is
 * ordering — the index falls back to `_createdAt`.
 *
 * ## Where each field comes from
 *
 * The source publishes the same item in two places, and they are not the same
 * copy. The **detail page** carries the headline, the standfirst, the
 * Opportunity and Solution bands, the results figures and the client quote. The
 * **collection index** carries the client's name, a subject label, a card
 * sentence and a card photograph. `client` is required by the model and the
 * detail page never prints it, so the index is not optional reading — it is
 * where the required field lives.
 *
 * ## What this model cannot carry
 *
 * Three authored fields have no home here: the card's subject label
 * ("RFP automation"), the card's own sentence, and the card's photograph, which
 * is a different picture from the hero's on half the archive. The model has one
 * narrative sentence and one image, and both are already spoken for by the
 * detail page's own copy. So all three are dropped, reported as a note on every
 * run, and named in the document's provisional note — the answer #22 reached
 * for WordPress's `headline`, for the same reason: giving a field to a dropped
 * source field is a schema conversation, not something a migration decides on
 * the way past. The words stay recoverable, verbatim, in the committed extract.
 *
 * `client.logo` is the fourth. It is required in Studio and o3xo.ai shows no
 * client mark anywhere, so every client document loads invalid — which is the
 * correct signal, and the reason each one says why.
 */

/** An extract record as committed under the O3XO extract tree. */
export interface FramerCaseStudyRecord extends FramerCaseStudy {
  readonly _meta: ExtractMeta
}

export interface FramerCaseStudyMapOptions {
  /** Where this brand serves case studies, from brand config — never a literal. */
  readonly caseStudyPrefix: string
}

export const clientDoc = z.object({
  _id: z.string().regex(/^client-framer-[a-z0-9-]+$/),
  _type: z.literal('client'),
  name: z.string().min(1),
  migration: z.object({
    locked: z.literal(false),
    sourceId: z.string().min(1),
    provisional: z.boolean(),
    provisionalNote: z.string().min(1),
  }),
})

export type ClientDoc = z.infer<typeof clientDoc>

const NO_LOGO =
  'Migrated from o3xo.ai with no logo: the site publishes no client mark, on the ' +
  'case-study cards or anywhere else, and `client.logo` is required in Studio. ' +
  'Cleared by supplying the mark.'

/**
 * The client an engagement was for, as a document.
 *
 * Reference-driven, like the categories in `map/framer.ts` and the people in
 * `map/person.ts`: only clients a case study points at become documents, and
 * the name is the identity because Framer authors it as a text field on the
 * item rather than as a record with an id.
 *
 * Three of the six names are descriptions rather than names — "Global tech
 * firm", "Fortune 500 insurance provider". That is what the source says, and
 * anonymised engagements are the reason it says it, so the name migrates as
 * written. Inferring the real company from the quote's job title would be
 * inventing a fact the site deliberately withheld.
 */
export function mapFramerClient(name: string): ClientDoc {
  const key = idKey(name)
  return {
    _id: `client-framer-${key}`,
    _type: 'client' as const,
    name: name.trim(),
    migration: {
      locked: false as const,
      sourceId: `framer:client:${key}`,
      provisional: true,
      provisionalNote: NO_LOGO,
    },
  }
}

/**
 * The meta description is the only SEO field the source overrides — the same
 * finding `map/framer.ts` records for insights, and for the same reasons: the
 * served `<title>` is the headline plus ` | O3XO`, which the app's own template
 * composes, and a canonical pointing back at o3xo.ai would tell Google the new
 * page is the duplicate.
 */
function mapFramerSeo(
  src: FramerCaseStudy['seo'],
  notes: ConversionIssue[],
): SeoObject | undefined {
  const description = src.descriptionOverride.trim()
  if (!description) return undefined
  const seo: SeoObject = { description }
  if (!seoObject.safeParse(seo).success) {
    notes.push({ element: 'seo', detail: `dropped an seo object that failed its gate` })
    return undefined
  }
  return seo
}

/** The pairs of quotation marks o3xo.ai types around its client quotes. */
const QUOTE_PAIRS: readonly [string, string][] = [
  ['“', '”'],
  ['"', '"'],
  ['‘', '’'],
]

/**
 * A quote with the marks around it removed.
 *
 * `quoteSection` draws its own quotation marks, so every seeded quote in this
 * repo stores the words alone; o3xo.ai types them into the copy, in both curly
 * and straight forms. Keeping them ships `““…””` — the same doubling `mapSeo`
 * strips a site-name suffix to prevent. Reported through `notes` rather than
 * done silently, and only when the marks actually pair.
 */
function unquoted(text: string, notes: ConversionIssue[]): string {
  const trimmed = text.trim()
  for (const [open, close] of QUOTE_PAIRS) {
    if (trimmed.length > 2 && trimmed.startsWith(open) && trimmed.endsWith(close)) {
      notes.push({
        element: 'story.quoteSection.quote',
        detail: 'stripped the quotation marks around the quote — the band draws its own',
      })
      return trimmed.slice(open.length, -close.length).trim()
    }
  }
  return trimmed
}

/**
 * One parsed o3xo.ai case study → one document, or the reasons it cannot be
 * one. Fail-loud like every mapper (ADR 0002).
 */
export function mapFramerCaseStudy(
  src: FramerCaseStudyRecord,
  options: FramerCaseStudyMapOptions,
): Mapped<CaseStudyDoc> {
  const issues: ConversionIssue[] = []
  const notes: ConversionIssue[] = []
  const nextKey = createKeyGenerator()

  const client = src.card.client.trim()
  if (!client) {
    issues.push({
      element: 'client',
      detail:
        'the collection index publishes no client for this case study, and `client` is ' +
        'required — the detail page never prints it, so there is nothing to fall back to',
    })
  }

  // The deck under the headline, which is the problem-framing sentence this
  // field is for. The card's own sentence is a second, different one; see the
  // drop notes below.
  const narrativeHeadline = src.deck.trim()
  if (!narrativeHeadline) {
    issues.push({ element: 'narrativeHeadline', detail: 'the hero has no deck under the headline' })
  }

  const story: Record<string, unknown>[] = []
  for (const chapter of src.chapters) {
    const body = convertHtml(chapter.bodyHtml, issues, nextKey, notes, {
      marker: '_srcUrl',
      normalizeUrl: assetUrl,
    }) as Record<string, unknown>[]
    if (body.length === 0) {
      issues.push({ element: 'story', detail: `chapter "${chapter.title}" converted to nothing` })
      continue
    }
    story.push({
      _type: 'chapter',
      _key: nextKey(),
      kicker: chapter.kicker,
      title: chapter.title,
      body,
    })
  }
  if (story.length === 0) issues.push({ element: 'story', detail: 'no convertible narrative' })

  /**
   * The client quote, as the band any page can compose. `molecule` is the
   * case-study quote's decoration (`2250:1525`) — the one the README recorded
   * as having no content to land on, because none of o3's twenty `work` posts
   * holds a pull quote. Five of these six do.
   */
  if (src.quote) {
    story.push({
      _type: 'quoteSection',
      _key: nextKey(),
      surface: 'bone',
      decoration: 'molecule',
      quote: unquoted(src.quote.text, notes),
      attribution: src.quote.attribution,
    })
  }

  const parity = checkPathParity(
    src.seo.canonicalRendered,
    `${options.caseStudyPrefix}/${src.slug}`,
    'o3xo.ai',
  )
  if (parity) issues.push(parity)

  // Reported on every run, not once: the archive is uniform, so a per-document
  // note is what keeps the whole shape of the loss in front of whoever runs it.
  notes.push({
    element: 'card.subject',
    detail: `dropped — no field in this model: ${JSON.stringify(src.card.subject)}`,
  })
  notes.push({
    element: 'card.headline',
    detail:
      `dropped — the model has one narrative sentence and the hero deck is it: ` +
      JSON.stringify(src.card.headline),
  })
  if (src.card.image && src.card.image.url !== src.heroImage?.url) {
    notes.push({
      element: 'card.image',
      detail: `dropped — the model has one image and the hero photograph is it: ${src.card.image.url}`,
    })
  }

  if (issues.length > 0) return failed(issues)

  const seo = mapFramerSeo(src.seo, notes)

  const doc = {
    _id: `caseStudy-framer-${idKey(src.slug)}`,
    _type: 'caseStudy' as const,
    title: src.title,
    slug: { _type: 'slug' as const, current: src.slug },
    client: { _type: 'reference' as const, _ref: `client-framer-${idKey(client)}` },
    narrativeHeadline,
    ...(src.stats.length > 0
      ? {
          stats: src.stats.map((stat) => ({
            _type: 'stat' as const,
            _key: nextKey(),
            value: stat.value,
            label: stat.label,
          })),
        }
      : {}),
    ...(src.heroImage
      ? {
          heroMedia: {
            _type: 'figure' as const,
            image: { _type: 'image' as const, _srcUrl: src.heroImage.url },
            alt: src.heroImage.alt || src.title,
          },
        }
      : {}),
    story,
    ...(seo ? { seo } : {}),
    migration: {
      locked: false as const,
      // The CMS item id, not the slug: an editor can rename a slug, and the
      // provenance has to survive that.
      sourceId: `framer:caseStudy:${src.collectionItemId ?? idKey(src.slug)}`,
      provisional: true,
      provisionalNote:
        'Migrated from o3xo.ai with three authored card fields this model has no home ' +
        'for — the subject label, the card sentence and the card photograph — and with ' +
        'a client that has no logo, which Studio requires. All four are recoverable from ' +
        'the committed extract. Cleared by giving them fields or by recording the drop as ' +
        'permanent, and by supplying the client mark.',
    },
  }

  const parsed = caseStudyDoc.safeParse(doc)
  if (!parsed.success) {
    return failed(
      parsed.error.issues.map((issue) => ({
        element: issue.path.join('.'),
        detail: issue.message,
      })),
    )
  }
  // The constructed literal, not zod's output: `story` and `heroMedia` are
  // typed loosely in the gate and parsing would widen the written JSON.
  return ok(doc as CaseStudyDoc, notes)
}

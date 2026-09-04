import Link from 'next/link'

import { ArrowIcon } from '@o3/ui'
import { hrefForDoc } from '@o3/content-runtime/urls'
import { SanityImage } from '@o3/content-ui'
import type { CaseStudyCardData } from '@o3/content-ui/cards'

/** The eyebrow under the client: industry titles, then the detail string. */
function caseDetail(card: Pick<CaseStudyCardData, 'industries' | 'industryDetail'>): string {
  const industries = (card.industries ?? []).map((industry) => industry.title).filter(Boolean)
  return [...industries, card.industryDetail].filter(Boolean).join(' · ')
}

/**
 * O3XO's case-study card, built to the kit's `Case Study Cards` set
 * (`4404:3072`, Cards canvas `340:1577`).
 *
 * ```
 * 379 × 540      white, radius 8, shadow 0 1 2 at 5%
 *   photograph   379 × 271.5 across the top, its own band
 *   container    padding 12 24, gap 16
 *     row        client 20/28 over its detail 16/24, an arrow at the far
 *                right, a 1px rule under both
 *     narrative  16/24
 *     stat       30/36 over its label 16/24, 4 apart, 8 clear of the rule
 * ```
 *
 * The shape is why this card is app-local rather than a variant of
 * `@o3/content-ui`'s: O3's card composites everything **over** the photograph
 * behind a scrim, and no variant axis reaches from one composition to the
 * other (ADR 0028's second addendum, and the #224 inventory that classified
 * this set as structurally divergent).
 *
 * The set's one Figma axis (`Property 1`) is six client names — content, not
 * design — so the component takes no variants. Nothing in the kit draws a
 * hover, focus or pressed state, so those are invented from O3XO's tokens:
 * the photograph lifts, the arrow travels, and the ring is the same
 * `brand`-colored one the shared controls use.
 *
 * The card grows past 540: the frame's copy is a demo sentence and a real
 * narrative runs longer, so the height is a floor and the stat is pinned to
 * the floor by `mt-auto` rather than by a fixed slot.
 */
export function CaseStudyCard(card: CaseStudyCardData) {
  const { _type, title, slug, narrativeHeadline, headlineStat, cardMedia, client } = card
  const detail = caseDetail(card)

  return (
    <Link
      href={hrefForDoc({ _type, slug })}
      className="rounded-card focus-visible:ring-brand shadow-xs duration-(--duration-hover) group flex h-full flex-col overflow-hidden bg-white transition-shadow ease-out hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {/* 378.66 × 271.52 in the frame — 7/5 to the pixel it is drawn at. */}
      <div className="aspect-[7/5] overflow-hidden">
        <SanityImage
          source={cardMedia?.image}
          alt={cardMedia?.alt}
          ratio="fill"
          width={800}
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="duration-(--duration-reveal) h-full w-full transition-transform ease-out group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 py-3">
        <div className="border-line flex items-center justify-between gap-4 border-b pb-2">
          <div>
            <h3 className="text-display-sm text-fg">{client?.name ?? title}</h3>
            {detail ? <p className="text-body text-fg-muted">{detail}</p> : null}
          </div>
          {/*
           * The kit strokes this arrow at 1.23px in a 20px box, where the
           * shared icon is drawn for a button label at 2.2 — thin enough that
           * the default weight reads as a second heading beside the client.
           */}
          <ArrowIcon
            strokeWidth={1.5}
            className="text-fg-subtle duration-(--duration-hover) shrink-0 transition-transform ease-out group-hover:translate-x-1"
          />
        </div>

        {/*
         * `narrativeHeadline` is one problem-framing sentence by definition
         * (its own field description), and the frame draws two lines for it.
         * The clamp is what keeps a card whose copy over-ran that from
         * setting the height of its whole row.
         */}
        {narrativeHeadline ? (
          <p className="text-body text-fg-body line-clamp-3">{narrativeHeadline}</p>
        ) : null}

        {headlineStat?.value ? (
          <div className="mt-auto flex flex-col gap-1 pt-2">
            {/* 30/36 in the frame; the kit's ramp steps 36 → 24 with nothing
             * between, so this is `display-md`, the step read off the live
             * site (see the o3xo token package). */}
            <p className="text-display-md text-fg">{headlineStat.value}</p>
            {headlineStat.label ? (
              <p className="text-body text-fg-body">{headlineStat.label}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  )
}

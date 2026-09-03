import Link from 'next/link'

import { ArrowIcon, cn, CARD_LINK_FOCUS, CARD_MEDIA_ZOOM, Eyebrow } from '@o3/ui'
import type { CASE_STUDY_QUERY_RESULT } from '@o3/sanity/types/generated'
import { hrefForDoc } from '@o3/content-runtime/urls'

import { SanityImage } from '@o3/content-ui'
import { CONTENT_COLUMN } from '@o3/content-ui/image-sizes'

import { CaseStudyCard } from '@/components/cards/CaseStudyCard'

type NextCase = NonNullable<NonNullable<CASE_STUDY_QUERY_RESULT>['next']>

/**
 * The band that closes a case study — the frame's "Section - Next"
 * (`1710:2609`, mobile `1906:1039`), which holds the **next project**, not a
 * insights row. #44.
 *
 * ```
 *            402                        1440
 * band       96px 20px, gap 24          64px 96px, gap 48
 * heading    stacked, flush left        a 634px row pinned FLUSH RIGHT
 *   kicker   "NEXT PROJECT - IRONMAN"   ”
 *   title    36px                       48px
 *   control  absent                     58px `Icon / Surface` at the row's end
 * media      full-width 362 square,     the whole Case Study Card, 1248 × 550
 *            a bare photograph          (`2250:1564`, set `2089:4169`)
 * ```
 *
 * The two widths differ in kind, so both are drawn and CSS picks one — the
 * same move `FeatureGridSection` makes for its orbital diagram. At 1440 the
 * neighbour arrives as a full card: logo, eyebrow, narrative line, stat row
 * and CTA, composed from `CaseStudyCard` rather than re-derived here, which is
 * why `CASE_STUDY_QUERY`'s `next` is the card projection. At 402 the frame
 * still draws the photograph alone, with nothing over it.
 *
 * The heading COPY is text at both widths — the card below it is the anchor
 * and carries its own CTA, so a linked headline would be a second tab stop to
 * one href. The chip beside it is a pointer-only link to that same href; see
 * the note at it. At 402 the photograph is the tap target and names itself.
 */
export function NextCaseBand({ next }: { next: NextCase }) {
  if (!next.slug) return null
  const label = ['Next project', next.client?.name].filter(Boolean).join(' — ')
  const href = hrefForDoc({ _type: 'caseStudy', slug: next.slug })

  return (
    <section className="px-gutter pt-band-sm pb-band-sm bg-white lg:py-16">
      <div className="max-w-section mx-auto flex flex-col gap-6 lg:gap-12">
        <div className="flex items-center justify-between gap-6 lg:ml-auto lg:w-[634px]">
          <div className="flex flex-col gap-1.5 lg:w-[576px] lg:gap-3">
            <Eyebrow size="lg">{label}</Eyebrow>
            <p className="text-display-xl font-display text-ink text-balance">{next.title}</p>
          </div>
          {/*
           * `Icon / Surface` (`1710:2615`) — the chip's geometry is that
           * component's (58px circle, a 34.8px chip stroked at 1.45px with the
           * design's one real 5.8px radius). Absent from the 402 frame.
           *
           * IT IS A LINK THE KEYBOARD CANNOT REACH, and both halves of that
           * are deliberate. It reads as a control, so a click on it has to go
           * where the card goes — a chip that looks pressable and does nothing
           * is the failure. But the card below is already an anchor to this
           * same href, so `tabIndex={-1}` and `aria-hidden` keep the band at
           * one tab stop and one announcement: the pointer gets a second
           * target, assistive technology gets no duplicate.
           */}
          <Link
            href={href}
            aria-hidden
            tabIndex={-1}
            className="bg-surface-muted hidden size-[58px] shrink-0 items-center justify-center rounded-full lg:flex"
          >
            <span className="bg-surface-muted border-surface-muted text-ink flex size-[34.8px] items-center justify-center rounded-[5.8px] border-[1.45px]">
              {/* The chip strokes the glyph at 2, not ArrowIcon's 2.2 — read
                  off `1710:2615`. */}
              <ArrowIcon size={20} strokeWidth={2} />
            </span>
          </Link>
        </div>

        <Link
          href={href}
          aria-label={[label, next.title].filter(Boolean).join(': ')}
          // No offset on the ring: the photograph is the whole tap target, so a
          // gap between ring and picture would read as a border it doesn't
          // have.
          className={cn(
            'group relative block aspect-square overflow-hidden lg:hidden',
            CARD_LINK_FOCUS,
            'focus-visible:ring-offset-0',
          )}
        >
          <SanityImage
            source={next.heroMedia?.image}
            alt={next.heroMedia?.alt ?? ''}
            ratio="fill"
            width={1600}
            sizes={CONTENT_COLUMN}
            className={CARD_MEDIA_ZOOM}
          />
        </Link>

        <div className="hidden lg:block">
          <CaseStudyCard {...next} />
        </div>
      </div>
    </section>
  )
}

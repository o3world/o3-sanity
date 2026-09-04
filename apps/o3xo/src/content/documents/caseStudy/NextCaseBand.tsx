import Link from 'next/link'

import { ArrowIcon, Eyebrow } from '@o3/ui'
import type { CASE_STUDY_QUERY_RESULT } from '@o3/sanity/types/generated'
import { hrefForDoc } from '@o3/content-runtime/urls'

import { SanityImage } from '@o3/content-ui'

type NextCase = NonNullable<NonNullable<CASE_STUDY_QUERY_RESULT>['next']>

/**
 * The band that closes a case study — the frame's "Blog" band (`1710:2609`,
 * mobile `1906:1039`), which the layer names for what it actually holds:
 * the **next project**, not a insights row. #44.
 *
 * ```
 *            402                        1440
 * band       96px 20px, gap 24          96px 96px 0, gap 48
 * heading    stacked, flush left        a 634px row pinned FLUSH RIGHT
 *   kicker   "NEXT PROJECT - IRONMAN"   ”
 *   title    36px                       48px
 *   control  absent                     58px `Icon / Surface` at the row's end
 * image      full width × 362           1248 × 576
 * ```
 *
 * The image is the next case's `cardMedia`, plain — no scrim, no logo, no
 * copy over it (`1710:2616` renders as a bare photograph). That is what
 * separates this band from `CaseStudyCard`, which is the same photograph
 * carrying a whole card's worth of content.
 *
 * The band bottoms out at 0 on desktop because the Footer's own 96px follows
 * it directly; the 402 frame closes the gap itself.
 */
export function NextCaseBand({ next }: { next: NextCase }) {
  if (!next.slug) return null
  const label = ['Next project', next.client?.name].filter(Boolean).join(' — ')

  return (
    <Link
      href={hrefForDoc({ _type: 'caseStudy', slug: next.slug })}
      className="px-gutter pt-band-sm pb-band-sm group block bg-white lg:pb-0"
    >
      <div className="max-w-section mx-auto flex flex-col gap-6 lg:gap-12">
        <div className="flex items-center justify-between gap-6 lg:ml-auto lg:w-[634px]">
          <div className="flex flex-col gap-1.5 lg:w-[576px] lg:gap-3">
            <Eyebrow size="lg">{label}</Eyebrow>
            <p className="text-display-xl font-display text-ink text-balance">{next.title}</p>
          </div>
          {/*
           * `Icon / Surface` (`1710:2615`) as a non-interactive affordance —
           * the whole band is already the anchor, so `CarouselControl`'s
           * <button> would be a second tab stop to one href inside an <a>.
           * The chip's geometry is that component's (58px circle, a 34.8px
           * chip stroked at 1.45px with the design's one real 5.8px radius).
           * Absent from the 402 frame.
           */}
          <span
            aria-hidden
            className="bg-surface-muted duration-(--duration-hover) hidden size-[58px] shrink-0 items-center justify-center rounded-full transition-opacity ease-out group-hover:opacity-80 lg:flex"
          >
            <span className="bg-surface-muted border-surface-muted text-ink flex size-[34.8px] items-center justify-center rounded-[5.8px] border-[1.45px]">
              {/* The chip strokes the glyph at 2, not ArrowIcon's 2.2 — read
                  off `1710:2615`. */}
              <ArrowIcon size={20} strokeWidth={2} />
            </span>
          </span>
        </div>

        <div className="relative aspect-square overflow-hidden lg:aspect-[1248/576]">
          <SanityImage
            source={next.cardMedia?.image}
            alt={next.cardMedia?.alt ?? ''}
            ratio="fill"
            width={1600}
            sizes="(min-width: 1024px) 1248px, 100vw"
            className="duration-(--duration-reveal) transition-transform ease-out group-hover:scale-[1.03]"
          />
        </div>
      </div>
    </Link>
  )
}

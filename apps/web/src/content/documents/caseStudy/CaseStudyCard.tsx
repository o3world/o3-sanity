import Link from 'next/link'

import { ArrowIcon, buttonVariants, Eyebrow } from '@o3/ui'

import { LogoKnockout } from '@/content/LogoKnockout'
import { SanityImage } from '@/content/SanityImage'
import { hrefForDoc } from '@/content/documents/urls'
import type { SectionProps } from '@/content/blocks/sectionTypes'

/**
 * The case-study card shape — the `CASE_STUDY_CARD` projection, pinned to
 * the caseShowcaseSection's dereferenced references.
 */
export type CaseStudyCardData = NonNullable<
  SectionProps<'caseShowcaseSection'>['caseStudies']
>[number]

/** Eyebrow first half: industry titles; second half: the industryDetail string. */
function caseEyebrow(card: Pick<CaseStudyCardData, 'industries' | 'industryDetail'>): string {
  const industries = (card.industries ?? []).map((industry) => industry.title).filter(Boolean)
  return [...industries, card.industryDetail].filter(Boolean).join(' · ')
}

/**
 * The case-study card, built to the Home frame's card (`1883:3555`) — #42.
 * The **same geometry** carries the Work index grid (#43), which is why it
 * lives on the card rather than inside either section.
 *
 * ```
 * 1248 × 556        padding 72px 72px 88px, content pinned via space-between
 *   background      the hero image, cover
 *   scrim           --gradient-card-scrim — 90deg, ink → 0 between 26% and 79%
 *   top             the client logo, 185px wide, knocked out WHITE (1883:3556)
 *   bottom  gap 24  eyebrow 16px + narrative 28px in a 472px measure
 *                   stat 48px beside its label at 65% white, 24px apart
 *                   Button / Solid Size=Base, white fill
 * ```
 *
 * Nothing here is a text-beside-thumbnail card: the photograph **is** the
 * card, the scrim holds the left column legible, and the copy sits on the
 * floor. The pre-#42 version split it into a copy column and an image panel,
 * which is a different composition entirely.
 *
 * The trailing CTA is a styled `<span>`, not a `Button` — the whole card is
 * already the anchor, and a nested control would be a second tab stop to the
 * same href.
 */
export function CaseStudyCard(card: CaseStudyCardData) {
  const { _type, title, slug, narrativeHeadline, headlineStat, heroMedia, client } = card
  const eyebrow = caseEyebrow(card)

  return (
    <Link
      href={hrefForDoc({ _type, slug })}
      // 362 square at 402 with 32px padding (`1925:5734`); 1248 × 556 with
      // `72px 72px 88px` at 1440 (`1883:3555`). Both are FLOORS, not fixed
      // heights: the frame's demo narrative is two lines and a real one runs
      // to five, and a hard 362 clips the client logo off the top rather than
      // letting the card grow.
      className="rounded-card group relative isolate flex min-h-[362px] flex-col justify-between overflow-hidden p-8 text-white lg:min-h-[556px] lg:p-[72px] lg:pb-[88px]"
    >
      <div className="absolute inset-0 -z-20">
        <SanityImage
          source={heroMedia?.image}
          alt=""
          ratio="fill"
          width={1600}
          sizes="(min-width: 1024px) 1248px, 100vw"
          className="duration-(--duration-reveal) h-full w-full transition-transform ease-out group-hover:scale-[1.03]"
        />
      </div>
      {/*
       * Two different treatments, both read rather than derived. At 1440 the
       * card is 1248 × 556 and the copy occupies a left column, so the frame
       * holds it legible with the 90° `--gradient-card-scrim` (`1883:3555`).
       * At 402 the card is a **362 square** and the copy spans it, so a
       * horizontal scrim would leave the end of every line on open
       * photograph — and the frame doesn't use one: `1925:5734` fills with a
       * flat `rgba(3,3,3,0.6)` wash over the image.
       *
       * This is the responsive contract working as ADR 0006 describes it: the
       * frames are endpoints, and here they differ in kind, not in degree.
       */}
      <div className="lg:bg-(image:--gradient-card-scrim) absolute inset-0 -z-10 bg-[rgba(3,3,3,0.6)]" />

      {client?.logo ? (
        <LogoKnockout source={client.logo} alt={client.name} width={185} height={40} />
      ) : (
        <span className="eyebrow font-bold">{client?.name}</span>
      )}

      <div className="flex flex-col items-start gap-6">
        <div className="flex flex-col gap-3">
          {eyebrow ? <Eyebrow tone="inverse">{eyebrow}</Eyebrow> : null}
          <h3 className="text-display-md font-display max-w-[472px] text-balance">
            {narrativeHeadline ?? title}
          </h3>
        </div>

        {headlineStat?.value ? (
          <p className="flex items-center gap-6">
            <span className="text-display-xl font-display tracking-[-0.0208em]">
              {headlineStat.value}
            </span>
            {headlineStat.label ? (
              <span className="text-on-ink-muted text-base">{headlineStat.label}</span>
            ) : null}
          </p>
        ) : null}

        <span className={buttonVariants({ variant: 'light', size: 'base' })}>
          View our work
          <ArrowIcon />
        </span>
      </div>
    </Link>
  )
}

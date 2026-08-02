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
      className="rounded-card group relative isolate flex min-h-[420px] flex-col justify-between overflow-hidden p-8 pb-11 text-white lg:min-h-[556px] lg:p-[72px] lg:pb-[88px]"
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
      <div className="bg-(image:--gradient-card-scrim) absolute inset-0 -z-10" />

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

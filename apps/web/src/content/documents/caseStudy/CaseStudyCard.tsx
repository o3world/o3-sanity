import Link from 'next/link'

import { Stat } from '@o3/ui'

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

export function CaseStudyCard(card: CaseStudyCardData) {
  const { _type, title, slug, narrativeHeadline, headlineStat, heroMedia } = card
  const eyebrow = caseEyebrow(card)
  return (
    <Link
      href={hrefForDoc({ _type, slug })}
      className="rounded-card bg-ink-soft grid gap-8 p-8 md:grid-cols-2 md:p-12"
    >
      <div className="flex flex-col gap-5">
        {eyebrow ? <p className="eyebrow text-brand-tint">{eyebrow}</p> : null}
        <h3 className="text-display-md font-display text-balance">{narrativeHeadline ?? title}</h3>
        {headlineStat?.value ? (
          <Stat value={headlineStat.value} label={headlineStat.label ?? ''} />
        ) : null}
        {/* A styled span, not a nested link — the whole card is the anchor. */}
        <span className="text-brand-tint mt-auto text-sm font-medium">Read the case →</span>
      </div>
      {/* Stacked, the panel takes its shape from the image; side by side it
          stretches to the text column, so the image fills whatever it gets. */}
      <div className="rounded-card bg-ink aspect-3/2 overflow-hidden md:aspect-auto">
        <SanityImage
          source={heroMedia?.image}
          alt={heroMedia?.alt ?? ''}
          ratio="fill"
          width={1200}
          sizes="(min-width: 768px) 40vw, 100vw"
        />
      </div>
    </Link>
  )
}

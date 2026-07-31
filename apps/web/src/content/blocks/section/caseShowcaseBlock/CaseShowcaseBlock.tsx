import { ArrowLink, DisplayHeading, SectionShell } from '@o3/ui'

import { resolveCtaHref } from '@/content/CtaLink'
import { getCard } from '@/content/documents/card-registry'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type CaseShowcaseBlockProps = SectionProps<'caseShowcaseBlock'>

/**
 * Section block: the "Our Work" showcase. Each referenced case study renders
 * through the caseStudy card (narrative headline + headline stat), stacked
 * vertically — the prototype's sticky-stack scroll effect is post-scaffold
 * motion work.
 */
export function CaseShowcaseBlock({ heading, cta, caseStudies, surface }: CaseShowcaseBlockProps) {
  const Card = getCard('caseStudy')
  return (
    <SectionShell surface={resolveSurface(surface, 'ink')}>
      <div className="flex flex-col gap-12 py-24">
        <div className="flex items-end justify-between gap-6">
          {heading ? <DisplayHeading>{heading}</DisplayHeading> : null}
          {cta?.label ? <ArrowLink href={resolveCtaHref(cta)}>{cta.label}</ArrowLink> : null}
        </div>
        <div className="flex flex-col gap-10">
          {(caseStudies ?? []).map((caseStudy) => (
            <Card key={caseStudy._id} {...caseStudy} />
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

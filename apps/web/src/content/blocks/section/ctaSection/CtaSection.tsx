import { DisplayHeading, SectionShell } from '@o3/ui'

import { CtaLink } from '@/content/CtaLink'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type CtaSectionProps = SectionProps<'ctaSection'>

/** Section block: the closing CTA band ("The best partnerships…"). */
export function CtaSection({ heading, body, cta, surface }: CtaSectionProps) {
  return (
    <SectionShell surface={resolveSurface(surface, 'ink')}>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 py-32 text-center">
        {heading ? <DisplayHeading>{heading}</DisplayHeading> : null}
        {body ? <p className="max-w-xl text-lg opacity-70">{body}</p> : null}
        {cta ? <CtaLink cta={cta} /> : null}
      </div>
    </SectionShell>
  )
}

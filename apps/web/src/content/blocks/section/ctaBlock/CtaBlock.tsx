import { DisplayHeading, SectionShell } from '@o3/ui'

import { CtaLink } from '@/content/CtaLink'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type CtaBlockProps = SectionProps<'ctaBlock'>

/** Section block: the closing CTA band ("The best partnerships…"). */
export function CtaBlock({ heading, body, cta, surface }: CtaBlockProps) {
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

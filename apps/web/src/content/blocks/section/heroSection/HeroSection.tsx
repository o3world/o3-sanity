import { Reveal, SectionShell } from '@o3/ui'

import { CtaLink } from '@/content/CtaLink'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type HeroSectionProps = SectionProps<'heroSection'>

/**
 * Section block: the page hero. Each headline line renders on its own row;
 * the last line is muted per the prototype's homepage h1 treatment. The
 * `decoration` field (orbs) is a post-scaffold motion concern.
 */
export function HeroSection({ headlineLines, subheading, cta, surface }: HeroSectionProps) {
  const lines = headlineLines ?? []
  return (
    <SectionShell surface={resolveSurface(surface, 'ink')}>
      <div className="flex min-h-[70vh] flex-col justify-center gap-8 py-28">
        <Reveal>
          <h1 className="text-hero font-display text-balance">
            {lines.map((line, index) => (
              <span
                key={line}
                className={
                  index === lines.length - 1 && lines.length > 1 ? 'block opacity-60' : 'block'
                }
              >
                {line}
              </span>
            ))}
          </h1>
        </Reveal>
        {subheading ? <p className="max-w-xl text-lg opacity-70">{subheading}</p> : null}
        {cta ? (
          <div>
            <CtaLink cta={cta} />
          </div>
        ) : null}
      </div>
    </SectionShell>
  )
}

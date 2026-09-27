import { SurfaceProvider, surfaceAttrs } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { sectionBackground } from '../../sectionBackground'
import { ButtonLink } from '../../../ButtonLink'
import { CtaFooterPaint } from './CtaFooterPaint'

type CtaSectionProps = SectionProps<'ctaSection'> & {
  /** Alternate line grouping from the mobile frame, when it differs. */
  mobileHeading?: string
}

/** Current Combined CTA + Footer, 3720:62476. */
export function CtaSection({
  heading,
  mobileHeading,
  body,
  button,
  backgroundMedia,
}: CtaSectionProps) {
  return (
    <SurfaceProvider surface="ink">
      <section
        {...surfaceAttrs('ink')}
        className="cta-band relative isolate px-4 text-white lg:px-24"
      >
        <CtaFooterPaint />
        {sectionBackground(backgroundMedia, 'ink')}
        <div className="relative z-10 mx-auto flex max-w-[822px] flex-col items-center gap-12 pb-16 pt-32 text-center lg:pb-48">
          {heading || body ? (
            <div className="flex w-full flex-col items-center gap-8">
              {heading ? (
                <h2 className="text-cta font-display text-on-ink whitespace-pre-line">
                  {mobileHeading ? (
                    <>
                      <span className="lg:hidden">{mobileHeading.replace(/\u2028/g, '\n')}</span>
                      <span className="hidden lg:inline">{heading.replace(/\u2028/g, '\n')}</span>
                    </>
                  ) : (
                    heading.replace(/\u2028/g, '\n')
                  )}
                </h2>
              ) : null}
              {body ? (
                <p className="text-lead text-on-ink-subtle whitespace-normal lg:whitespace-pre-line">
                  {body.replace(/\u2028/g, '\n')}
                </p>
              ) : null}
            </div>
          ) : null}
          {button ? <ButtonLink button={button} /> : null}
        </div>
      </section>
    </SurfaceProvider>
  )
}

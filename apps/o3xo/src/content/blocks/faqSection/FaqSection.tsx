import { SectionShell } from '@o3/ui'
import { resolveSurface, sectionBackground } from '@o3/content-ui'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { fieldAttr, itemAttr } from '@o3/content-runtime/data-attribute'

import { FaqRow } from './FaqRow'

/**
 * THE KIT'S FAQ BAND (`4406:7288`) — a heading and standfirst over a column of
 * questions, on a photograph.
 *
 * ```
 * band     1440 × 751, the picture full-bleed behind it
 *   header   1200 measure, 24px between the two lines
 *     heading     36/40 Regular   (H3 in the kit's ramp)
 *     standfirst  18/28 Light
 *   column   800 wide, left-aligned under the header, 48px below it
 * ```
 *
 * **App-local, and O3XO's alone** (ADR 0028): `faqSection` is on this brand's
 * half of the section roster and O3's design file draws no band like it, so a
 * renderer in `@o3/content-ui` would be one nothing else imports.
 *
 * The kit's own frame is an HTML import sized to its picture — 56.6px above the
 * content and none below — so the band takes the rhythm step nearest it rather
 * than that pair.
 *
 * The question step is `display-sm`, the ramp's H4, which is what the kit names
 * its own row heading (`Heading 4 → …`); the 18px the imported frame draws is
 * the live Framer site's size and not a ramp value.
 */
export function FaqSection({
  heading,
  subheading,
  questions,
  surface,
  backgroundMedia,
  loc,
}: SectionProps<'faqSection'>) {
  const resolved = resolveSurface(surface, 'faqSection')

  return (
    <SectionShell
      surface={resolved}
      top="sm"
      bottom="sm"
      background={sectionBackground(backgroundMedia, resolved)}
    >
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-6" data-sanity={fieldAttr(loc, 'heading')}>
          {heading ? (
            <h2 className="text-display-lg font-display text-balance">{heading}</h2>
          ) : null}
          {subheading ? <p className="text-lead">{subheading}</p> : null}
        </div>
        <div className="flex w-full flex-col lg:max-w-[800px]">
          {(questions ?? []).map((question, index) => (
            <FaqRow
              key={question._key ?? index}
              question={question.heading ?? ''}
              answer={question.body ?? ''}
              dataSanity={itemAttr(loc, 'questions', question._key)}
            />
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

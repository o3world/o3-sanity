import type { ReactNode } from 'react'
import { SectionBackground, type Surface, type Tint } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { SanityImage } from '../SanityImage'

/**
 * A band's stored `backgroundMedia` as the layer `SectionShell` hangs behind
 * it, or **`null` when the band carries no picture** (#239).
 *
 * A function rather than a component, and the null is why: a React element is
 * truthy even when it renders nothing, so a renderer that always handed the
 * shell a component would wrap every band in a stacking context for a picture
 * that is not there — and `isolate` traps the negative-z decorations several
 * bands deliberately bleed out of theirs. The shell's `background` prop asks
 * "is there one?", so this has to be able to answer no.
 *
 * The guard lives here rather than at each of the sixteen call sites, beside
 * `resolveSurface` and `resolveDecoration` — the other two readers of what a
 * band stored about how it is drawn.
 *
 * **The picture is decorative and its `alt` is empty**, deliberately: it says
 * nothing the band's own copy does not, and a description of a texture read out
 * before the heading is noise. The schema carries no alt field for the same
 * reason.
 *
 * `ratio="fill"` lets the editor's hotspot decide what survives the crop — a
 * band is a wide strip, so a tall picture loses a lot of itself — and `width`
 * is the full-bleed request `MediaSection` already makes of a 1440 band.
 */
/**
 * The band background **as the query hands it over**, not as the schema stores
 * it: the projection expands the picture's asset for its LQIP, so the schema
 * type is a narrower shape than any renderer actually receives.
 */
type BandBackground = SectionProps<'heroSection'>['backgroundMedia']

export function sectionBackground(
  media: BandBackground | null | undefined,
  surface: Surface,
): ReactNode | null {
  if (!media?.image) return null
  const tint = stegaClean(media.tint) === 'none' ? 'none' : ('dim' satisfies Tint)

  return (
    <SectionBackground surface={surface} tint={tint}>
      <SanityImage source={media.image} alt="" ratio="fill" width={2400} sizes="100vw" />
    </SectionBackground>
  )
}

import { ThinkingOrb, type OrbSize, type OrbState } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import type { BaseProps } from '@/content/blocks/sectionTypes'

type OrbProps = BaseProps<'orb'>

/**
 * Base block: an animated thought orb in a layoutSection column.
 *
 * Typegen widens the schema's enums to `string` and `number`, so the cast to
 * the library's unions happens here — after `stegaClean`, because a value
 * arriving from a Presentation-mode draft carries invisible encoding
 * characters and `"working…"` matches no state (the same trap
 * `DisciplineGridSection` documents for its `layout` field).
 *
 * Theme is pinned light rather than left on the library's `auto`. A base block
 * sits in a `layoutSection` column and is not told its band's surface, and
 * `auto` falls through to `prefers-color-scheme` — which would paint a
 * light-ink orb, invisible, for every visitor whose OS is in dark mode. The
 * site has one palette; the orb follows it.
 */
export function Orb({ state, size, speed, paused }: OrbProps) {
  return (
    <ThinkingOrb
      state={stegaClean(state) as OrbState | undefined}
      size={stegaClean(size) as OrbSize | undefined}
      speed={stegaClean(speed)}
      paused={stegaClean(paused)}
      theme="light"
    />
  )
}

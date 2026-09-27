import { cn, HalftoneDisc, ThinkingOrb, type OrbSize, type OrbState } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import { SanityImage } from '../../../SanityImage'
import { DotCircle } from './DotCircle'

import type { BaseProps } from '@o3/content-runtime/blocks'

type MarkData = BaseProps<'mark'>

export type MarkProps = MarkData & {
  /**
   * Whether the band behind the mark is the ink surface. Only the orb needs
   * it — the disc draws in `currentColor` and inherits its band's ink the way
   * it always has.
   */
  onInk?: boolean
  /** The slot's diameter, as Tailwind width classes. */
  className?: string
}

/**
 * Decorative artwork beside an item, or a standalone mark in a layout column.
 * The section owns its dimensions; this component chooses the authored image,
 * halftone disc, Dot Circle, or animated orb. An unset kind retains the orb default.
 */
export function Mark({
  kind,
  media,
  icon,
  state,
  size,
  speed,
  paused,
  onInk,
  className,
}: MarkProps) {
  if (stegaClean(kind) === 'dotCircle')
    return <DotCircle icon={stegaClean(icon) ?? undefined} className={className} />
  if (stegaClean(kind) === 'image') {
    return (
      <SanityImage
        source={media?.image}
        alt=""
        width={662}
        sizes="(min-width: 1024px) 331px, 100vw"
        className={cn('object-contain', className)}
      />
    )
  }
  if (stegaClean(kind) === 'disc') return <HalftoneDisc className={className} />
  return (
    <ThinkingOrb
      state={stegaClean(state) as OrbState | undefined}
      size={stegaClean(size) as OrbSize | undefined}
      speed={stegaClean(speed)}
      paused={stegaClean(paused)}
      theme={onInk ? 'dark' : 'light'}
      fill
      className={cn('aspect-square', className)}
    />
  )
}

/**
 * A section block's item hands its `mark` straight to `Mark`, and the field is
 * optional — so this is the null-safe spread, written once rather than at each
 * of the four call sites.
 */
export const markProps = (mark: MarkData | null | undefined): MarkData => mark ?? {}

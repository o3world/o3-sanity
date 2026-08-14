import { cn, HalftoneDisc, ThinkingOrb, type OrbSize, type OrbState } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import type { BaseProps } from '@/content/blocks/sectionTypes'

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
 * The dotted circle beside a card, a row or a discipline — and the base block
 * an editor can drop into a `layoutSection` column on its own.
 *
 * **The one place either drawing is chosen.** Four section blocks and the base
 * tier all draw this slot; before this component each held its own
 * `<HalftoneDisc className="w-…" />`, and adding the orb to all of them would
 * have copied a `stegaClean`-and-cast block five times. The blocks now own the
 * diameter (which is composition, and differs per frame — 138, 132, 113, 70)
 * and nothing else.
 *
 * **Orb unless told otherwise**, including when the field is absent entirely:
 * content authored before the field existed animates, and so does a panel
 * added tomorrow. `disc` is the deliberate step back to the frame's halftone.
 *
 * `stegaClean` before every comparison and cast: a value from a
 * Presentation-mode draft carries invisible encoding characters, so
 * `"disc…"` is not `"disc"` and `"weaving…"` matches no state.
 *
 * Theme is pinned from the surface rather than left on the library's `auto`,
 * which falls through to `prefers-color-scheme` — this site has one palette,
 * and a dark-mode OS would otherwise paint a light-ink orb on a white page.
 */
export function Mark({ kind, state, size, speed, paused, onInk, className }: MarkProps) {
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

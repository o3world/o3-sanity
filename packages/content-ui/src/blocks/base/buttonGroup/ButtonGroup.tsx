import { stegaClean } from '@sanity/client/stega'

import { cn } from '@o3/ui'
import type { BaseProps } from '@o3/content-runtime/blocks'

import { ButtonLink } from '../../../ButtonLink'

type ButtonGroupProps = BaseProps<'buttonGroup'>

const ALIGNMENTS = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
} as const

type Alignment = keyof typeof ALIGNMENTS

function resolveAlignment(value: string | null | undefined): Alignment {
  const clean = stegaClean(value) ?? ''
  return Object.prototype.hasOwnProperty.call(ALIGNMENTS, clean) ? (clean as Alignment) : 'start'
}

/**
 * A row of buttons — the quick-jump nav an editor builds from a band's anchors
 * (#149).
 *
 * **It arranges and nothing else.** Every member is an ordinary `button` and
 * goes through `ButtonLink`, so each one picks its own element from its own
 * destination and its own fill from its own field. The group's whole
 * contribution is the row: where it sits, and that it wraps.
 *
 * Wrapping rather than scrolling is the 402 answer (ADR 0006): a jump row is
 * six or seven short labels, and a horizontal scroll region on a phone hides
 * the links it was built to expose.
 *
 * A `<nav>` is deliberately not the element. This is a group of buttons, and it
 * is the same group whether its members jump down the page, link out, or submit
 * — announcing it as navigation would be true of one of those three.
 */
export function ButtonGroup({ buttons, alignment }: ButtonGroupProps) {
  if (!buttons?.length) return null

  return (
    <div
      className={cn('flex flex-wrap items-center gap-4', ALIGNMENTS[resolveAlignment(alignment)])}
    >
      {buttons.map((button) => (
        <ButtonLink key={button._key} button={button} />
      ))}
    </div>
  )
}

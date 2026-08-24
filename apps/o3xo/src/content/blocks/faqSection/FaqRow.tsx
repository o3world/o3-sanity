'use client'

import { useId, useState } from 'react'

import { cn } from '@o3/ui/lib/utils'

/**
 * ONE ROW OF THE KIT'S FAQ ACCORDION (`4404:4730`'s parent, Accordion canvas
 * `310:1977`) — a question that opens onto its answer.
 *
 * ```
 * row      12px above and below a 25.2px line, then a hairline
 *   disc     24  accent circle, white arrow            gap 12
 *   question 18/25.2 Regular   (Heading 4 in the kit)  fills
 *   chevron  12×6 in a 16 box, points down closed
 * answer   the row's own width, 12px under the question
 * ```
 *
 * **The kit draws this closed and nothing else** — every one of its eight rows
 * is a `Closed` variant, and no interaction state is drawn anywhere in the file
 * (ADR 0028). So the open state is invented from tokens: the chevron turns, the
 * answer takes the band's `body` step, and nothing else moves.
 *
 * The disclosure is a real `<button>` inside the row's heading, which is what
 * gets keyboard operation, `aria-expanded` and the focus ring for free. Rows
 * are independent — opening one leaves the rest alone, the way the live site
 * behaves — so the state is the row's rather than the band's.
 */
export interface FaqRowProps {
  question: string
  answer: string
  /** The row's `data-sanity`, stamped by the band that laid the column out. */
  dataSanity?: string
}

export function FaqRow({ question, answer, dataSanity }: FaqRowProps) {
  const [open, setOpen] = useState(false)
  const answerId = useId()

  return (
    <div
      data-sanity={dataSanity}
      // No `line` role survives an ink band — `--color-line` is not re-pointed
      // under `[data-surface='ink']` — so the hairline rides the copy colour
      // instead and inverts with the surface the way the icons do.
      className="border-current/25 border-b"
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={answerId}
          onClick={() => setOpen((was) => !was)}
          className="flex w-full cursor-pointer items-center gap-3 py-3 text-left"
        >
          <AccentArrow />
          <span className="text-display-sm font-display flex-1">{question}</span>
          <Chevron className={cn('text-fg-muted transition-transform', open && 'rotate-180')} />
        </button>
      </h3>
      <div id={answerId} hidden={!open} className="pb-3">
        <p className="text-body">{answer}</p>
      </div>
    </div>
  )
}

/**
 * The row's leading glyph (`4404:4730`) — an `accent` disc with a white arrow
 * through it.
 *
 * Not one of the kit's eighteen Phosphor glyphs (#246): those are one path in
 * `currentColor`, and this is two inks that do not move with the surface — the
 * yellow is the brand's and the arrow is white against it. Decorative, so it
 * has no accessible name; the question beside it is the row's.
 */
function AccentArrow() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <circle cx="12" cy="12" r="10" className="fill-accent" />
      <path
        d="M13.8 16.6 18 11.8 13.8 7M18 11.8H6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** The disclosure indicator (`4404:4741`) — 12×6 in a 16 box, pointing down. */
function Chevron({ className }: { className?: string }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      focusable="false"
      className={cn('shrink-0', className)}
    >
      <path
        d="M2 5 8 11 14 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

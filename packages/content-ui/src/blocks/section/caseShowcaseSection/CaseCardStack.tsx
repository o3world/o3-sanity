'use client'

import { useEffect, useRef, type ReactNode } from 'react'

import { stackedCardOpacity } from './stackDim'

export interface CaseCardStackProps {
  /**
   * One wrapper element per case card, in document order — the elements the
   * band pins and this component dims. Each is a direct child, because that
   * is what the stack indexes: card `i` is dimmed by card `i + 1`.
   */
  children: ReactNode
}

/**
 * The card stack, and the band's one client boundary.
 *
 * **The stacking itself is CSS and is not here.** Each wrapper is `sticky` at
 * the same offset, so a card pins under the chrome and the next one slides
 * over it; they paint in document order, which is why no card needs a
 * `z-index`. What CSS cannot do is fade the card underneath as it disappears,
 * and that is the whole of this component's job.
 *
 * Opacity is written straight onto the nodes rather than through `setState`:
 * a scroll past three cards is a few hundred frames, and each one would
 * otherwise re-render the band. The cards arrive as `children` so they stay
 * server-rendered — the same channel `PanelBand` uses.
 *
 * Two things are read from layout rather than declared here. The pin offset
 * comes from the wrapper's own computed `top`, so the CSS remains the single
 * place the offset is set; and a wrapper whose computed `position` is not
 * `sticky` is the mobile band, where the cards are in normal flow and the dim
 * would fade copy nothing is covering.
 *
 * Under `prefers-reduced-motion` the dim is skipped. It is decorative — the
 * covered card is already covered — and it is the one part of the band that
 * moves in response to a scroll. The pinning stays: sticky is layout, not
 * motion.
 */
export function CaseCardStack({ children }: CaseCardStackProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const cards = Array.from(root.children).filter(
      (node): node is HTMLElement => node instanceof HTMLElement,
    )
    // One card covers nothing, and the last card is never covered.
    if (cards.length < 2) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    let frame = 0
    let stickyTop = 0
    let enabled = false

    const clear = () => {
      for (const card of cards) card.style.removeProperty('opacity')
    }

    const paint = () => {
      frame = 0
      if (!enabled) return
      for (let index = 0; index < cards.length - 1; index += 1) {
        const card = cards[index]!
        const next = cards[index + 1]!
        card.style.opacity = String(
          stackedCardOpacity({
            stickyTop,
            height: card.offsetHeight,
            nextTop: next.getBoundingClientRect().top,
          }),
        )
      }
    }

    const measure = () => {
      const style = getComputedStyle(cards[0]!)
      enabled = style.position === 'sticky' && !reduced.matches
      stickyTop = Number.parseFloat(style.top) || 0
      if (!enabled) clear()
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }
    const remeasure = () => {
      measure()
      schedule()
    }

    remeasure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', remeasure, { passive: true })
    reduced.addEventListener('change', remeasure)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', remeasure)
      reduced.removeEventListener('change', remeasure)
      clear()
    }
  }, [])

  return (
    /*
     * Gap 24 at 402 (`1889:3620`), 48 at 1440 (`1683:2661`). ADR 0006 lists
     * this band precisely because it is *not* a composition divergence — both
     * frames stack the cards, and only the gap moves.
     */
    <div ref={ref} className="flex flex-col gap-6 lg:gap-12">
      {children}
    </div>
  )
}

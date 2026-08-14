'use client'

import { ThinkingOrb as Orb, type OrbSize, type OrbState, type OrbTheme } from 'thinking-orbs'

import { cn } from '../lib/utils'

export type { OrbSize, OrbState, OrbTheme }

export interface ThinkingOrbProps {
  /** Which of the nine tuned animations to draw. */
  state?: OrbState
  /**
   * The library's two tuned presets, in CSS px. They are separate designs
   * rather than one scaled drawing — each carries its own dot count, dot size
   * and speed — so this is an enum, not a diameter.
   */
  size?: OrbSize
  /** Multiplier on the preset's baked speed. */
  speed?: number
  /** Freeze on the current frame. */
  paused?: boolean
  /** `auto` reads the host's `data-theme`/`dark` class, then the OS. */
  theme?: OrbTheme
  /** Announced to assistive tech; the canvas is otherwise decorative. */
  label?: string
  className?: string
}

/**
 * `thinking-orbs`' canvas orb (MIT, orbs.jakubantalik.com), wrapped so the O3
 * side of the seam speaks O3's vocabulary.
 *
 * **Why a wrapper and not the library component directly.** Three things it
 * owns: `'use client'` (the library paints to a canvas in an effect, so it
 * cannot be a server component), `label` instead of the library's
 * `aria-label` prop (the lexicon governs props, `CONTEXT.md` → Naming), and a
 * `className` that lands on a wrapping element rather than the canvas — the
 * canvas is sized in device pixels by the library and must not be restyled.
 *
 * **It draws at its preset size, centred.** Call sites that hold a larger slot
 * (the discipline row's 138px disc well) size the wrapper and let the orb sit
 * in the middle of it. Stretching the canvas with CSS would upscale a
 * 64 × dpr backing store and soften every dot.
 */
export function ThinkingOrb({
  state = 'working',
  size = 64,
  speed,
  paused,
  theme,
  label,
  className,
}: ThinkingOrbProps) {
  return (
    <div className={cn('flex shrink-0 items-center justify-center', className)}>
      <Orb
        state={state}
        size={size}
        speed={speed}
        paused={paused}
        theme={theme}
        aria-label={label}
      />
    </div>
  )
}

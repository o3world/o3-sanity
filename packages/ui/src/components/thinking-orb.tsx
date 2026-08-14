'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MODE_DRAWS,
  resolvePreset,
  ThinkingOrb as Orb,
  type OrbSize,
  type OrbState,
  type OrbTheme,
} from 'thinking-orbs'

import { cn } from '../lib/utils'

export type { OrbSize, OrbState, OrbTheme }

export interface ThinkingOrbProps {
  /** Which of the nine tuned animations to draw. */
  state?: OrbState
  /**
   * Which tuning to draw it with — the library's two presets, in CSS px. They
   * are separate designs rather than one scaled drawing: each carries its own
   * dot count, dot size and speed. With `fill`, this stays the tuning and
   * stops being the diameter.
   */
  size?: OrbSize
  /**
   * Paint at the wrapper's measured size instead of the preset's, so the orb
   * fills whatever box the call site gives it. See the note below on why this
   * is a real render at that size and not a stretched one.
   */
  fill?: boolean
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

/** Matches the library: cap the backing store at 2× so a 3× phone is not 9× the pixels. */
const dpr = () => Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1)

/**
 * `thinking-orbs`' canvas orb (MIT, orbs.jakubantalik.com), wrapped so the O3
 * side of the seam speaks O3's vocabulary.
 *
 * **Why a wrapper and not the library component directly.** Three things it
 * owns: `'use client'` (the library paints to a canvas in an effect, so it
 * cannot be a server component), `label` instead of the library's
 * `aria-label` prop (the lexicon governs props, `CONTEXT.md` → Naming), and
 * `fill`.
 *
 * **`fill` paints big, it does not scale up.** The library's `size` is both
 * the tuning key and the canvas dimension, and its presets only exist at 64
 * and 20 — so a 138px orb cannot come from the component's own props, and
 * stretching a 64px canvas with CSS would upscale a 64×DPR backing store and
 * soften every dot. The engine is a documented export (`resolvePreset`,
 * `MODE_DRAWS`) whose draw functions are "pure math over (size, t, opts)", so
 * `fill` resolves the preset at `size` for its tuning and paints that geometry
 * at the wrapper's measured diameter. Every dot lands on a real pixel; the
 * drawing is the 64px design at 138px, the way a vector enlarges.
 *
 * Without `fill` the library's own component renders, unchanged.
 */
export function ThinkingOrb({
  state = 'working',
  size = 64,
  fill,
  speed,
  paused,
  theme,
  label,
  className,
}: ThinkingOrbProps) {
  return (
    <div className={cn('flex shrink-0 items-center justify-center', className)}>
      {fill ? (
        <FilledOrb
          state={state}
          size={size}
          speed={speed}
          paused={paused}
          theme={theme}
          label={label}
        />
      ) : (
        <Orb
          state={state}
          size={size}
          speed={speed}
          paused={paused}
          theme={theme}
          aria-label={label}
        />
      )}
    </div>
  )
}

/**
 * The engine-backed arm: the library's loop, re-expressed over a measured
 * diameter. It keeps the four behaviours that make the shipped component safe
 * to leave on a page — a static frame under `prefers-reduced-motion`, and a
 * paused loop when the orb scrolls offscreen or the tab is hidden — because
 * dropping any of them would trade a sharper orb for a hotter one.
 *
 * `theme` resolves the two layers this codebase actually has: a pinned value
 * from the call site, or the OS. The library's third layer — an ancestor
 * `data-theme`/`dark` class, watched with a `MutationObserver` — has nothing
 * to watch here, because the site sets neither.
 */
function FilledOrb({
  state,
  size,
  speed = 1,
  paused = false,
  theme = 'auto',
  label,
}: Required<Pick<ThinkingOrbProps, 'state' | 'size'>> &
  Pick<ThinkingOrbProps, 'speed' | 'paused' | 'theme' | 'label'>) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [diameter, setDiameter] = useState<number>(size)
  const [dark, setDark] = useState(theme === 'dark')

  /* The box is the source of truth for the diameter, so a breakpoint that
     changes the well (the discipline row's 80 → 138) repaints rather than
     rescales. */
  useEffect(() => {
    const el = canvas.current?.parentElement
    if (!el) return
    const measure = () => setDiameter(Math.max(1, Math.round(el.getBoundingClientRect().width)))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (theme !== 'auto') {
      setDark(theme === 'dark')
      return
    }
    if (typeof matchMedia === 'undefined') return
    const query = matchMedia('(prefers-color-scheme: dark)')
    setDark(query.matches)
    const onChange = (event: MediaQueryListEvent) => setDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [theme])

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const ctx = el.getContext('2d')
    if (!ctx) return

    const ratio = dpr()
    el.width = Math.round(diameter * ratio)
    el.height = Math.round(diameter * ratio)

    const { mode, speed: baked, opts } = resolvePreset(state, size)
    const draw = MODE_DRAWS[mode]
    const tempo = baked * speed
    const paint = (t: number) => {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.clearRect(0, 0, diameter, diameter)
      draw(ctx, diameter, t, dark, opts)
    }

    if (
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      // The library's own still frame: 0.6s in, where every mode reads as itself.
      paint(0.6)
      return
    }

    paint((performance.now() / 1000) * tempo)
    if (paused) return

    let frame = 0
    let running = false
    const tick = () => {
      paint((performance.now() / 1000) * tempo)
      if (running) frame = requestAnimationFrame(tick)
    }
    const start = () => {
      if (running) return
      running = true
      frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(frame)
    }

    let onscreen = true
    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            onscreen = Boolean(entry?.isIntersecting)
            if (onscreen && document.visibilityState !== 'hidden') start()
            else stop()
          })
        : null
    observer?.observe(el)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stop()
      else if (onscreen) start()
    }
    document.addEventListener('visibilitychange', onVisibility)
    if (!observer) start()

    return () => {
      stop()
      observer?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [state, size, diameter, dark, speed, paused])

  return (
    <canvas
      ref={canvas}
      role="img"
      /* Mirrors the library's own default label — "Working…", "Weaving…" —
         which it keeps to itself rather than exporting. */
      aria-label={label ?? `${state[0]?.toUpperCase()}${state.slice(1)}…`}
      style={{ width: diameter, height: diameter, display: 'block' }}
    />
  )
}

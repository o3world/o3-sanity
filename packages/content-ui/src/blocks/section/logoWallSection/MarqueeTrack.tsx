'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { cn } from '@o3/ui/lib/utils'

export interface MarqueeTrackProps {
  /** How many times the marks are laid down; the loop shifts by one copy. */
  copies: number
  className?: string
  children: ReactNode
}

/**
 * The time constant of the crawl's braking and pick-up, in ms. Velocity
 * approaches its target exponentially, so this is the time to close 63% of
 * the gap; the strip is visibly still after about three of them — under a
 * second — and back at speed on the same curve. Long enough to read as a
 * deceleration rather than a stop, short enough that a reader who has just
 * spotted a mark is not still watching it slide away.
 */
const EASE_TAU = 280

/** A frame that arrives later than this (a hidden tab, a stall) advances the
    strip by this much, not by the whole gap — a long absence is not a jump. */
const MAX_FRAME = 100

/** `26s` → 26000; `400ms` → 400. `0` for anything unparseable. */
function parseDuration(value: string): number {
  const trimmed = value.trim()
  const number = parseFloat(trimmed)
  if (!Number.isFinite(number)) return 0
  return trimmed.endsWith('ms') ? number : number * 1000
}

/** The x of a computed `matrix(a, b, c, d, tx, ty)`, or `0` for `none`. */
function translateX(transform: string): number {
  const match = /matrix\(([^)]+)\)/.exec(transform)
  if (!match) return 0
  const parts = match[1]!.split(',').map(Number)
  return parts[4] ?? 0
}

/**
 * The partners strip, driven a frame at a time so it can slow down.
 *
 * ── WHY NOT THE CSS ANIMATION ─────────────────────────────────────────────
 *
 * The strip renders with `--animate-marquee` and that is what a reader with
 * no JS, or a reader whose JS has not arrived yet, sees: a crawl at the
 * token's period. But a CSS animation has exactly two speeds, and
 * `animation-play-state: paused` is a wall — the marks stop dead under the
 * pointer and lurch off when it leaves. Nick's launch review asked for the
 * opposite (2026-09-03): the strip should come to rest under a pointer and
 * pick up again once it goes, both gradually. Speed that changes over time is
 * velocity, and velocity has to be integrated, so once this has mounted it
 * takes the transform over from the keyframe and drives it in
 * `requestAnimationFrame`.
 *
 * The handoff reads the keyframe's current x off the computed transform and
 * starts from there, so a track that has already been crawling for a second
 * before hydration does not snap back to its start.
 *
 * ── THE SPEED IS THE TOKEN'S ──────────────────────────────────────────────
 *
 * Full speed is one copy per `--duration-marquee`, read off the computed
 * style, so the keyframe and the drive travel at the same rate and there is
 * one place to set it. The copy width is measured, not derived, and the wrap
 * is at exactly one copy — the same seamless loop the keyframe makes,
 * because the next copy is already where the last one started.
 *
 * ── STOPPING, AND RESTING ─────────────────────────────────────────────────
 *
 * A pointer entering sets the target velocity to zero and leaving sets it
 * back to full; each frame moves the actual velocity a fixed fraction of the
 * way toward the target (`EASE_TAU`). Once the strip is at rest with nothing
 * asking it to move the loop stops scheduling frames, so a still strip costs
 * nothing; the next pointer-leave restarts it.
 *
 * `prefers-reduced-motion` never mounts the drive at all: the keyframe is
 * already off under `motion-reduce:animate-none`, and the copies are
 * identical and centred, so the still strip is the frame's own composition.
 */
export function MarqueeTrack({ copies, className, children }: MarqueeTrackProps) {
  const ref = useRef<HTMLUListElement>(null)
  const [driven, setDriven] = useState(false)

  useEffect(() => {
    const track = ref.current
    if (!track) return
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const style = getComputedStyle(track)
    const period = parseDuration(style.getPropertyValue('--duration-marquee'))
    if (!period) return

    let x = translateX(style.transform)
    let velocity = 0
    let target = 1
    let frame = 0
    let last = 0

    setDriven(true)

    const step = (now: number) => {
      frame = 0
      const dt = last ? Math.min(now - last, MAX_FRAME) : 0
      last = now

      const copyWidth = track.getBoundingClientRect().width / copies
      // Full speed in px/ms: one copy per period.
      const full = copyWidth / period
      velocity += (target * full - velocity) * (1 - Math.exp(-dt / EASE_TAU))

      x -= velocity * dt
      if (x <= -copyWidth) x += copyWidth
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`

      // At rest with nothing asking for motion: stop the clock. A velocity
      // under a hundredth of a pixel per frame is a still strip.
      if (target === 0 && velocity < 0.0005) {
        velocity = 0
        last = 0
        return
      }
      frame = requestAnimationFrame(step)
    }

    const run = () => {
      if (!frame) frame = requestAnimationFrame(step)
    }
    const halt = () => {
      target = 0
      run()
    }
    const resume = () => {
      target = 1
      run()
    }

    track.style.animation = 'none'
    track.addEventListener('pointerenter', halt)
    track.addEventListener('pointerleave', resume)
    run()

    return () => {
      if (frame) cancelAnimationFrame(frame)
      track.removeEventListener('pointerenter', halt)
      track.removeEventListener('pointerleave', resume)
      track.style.animation = ''
      track.style.transform = ''
    }
  }, [copies])

  return (
    <ul
      ref={ref}
      style={{ '--marquee-shift': `-${(100 / copies).toFixed(4)}%` } as CSSProperties}
      className={cn(
        'flex shrink-0 flex-nowrap',
        // The keyframe is the baseline the drive takes over from; until then
        // a pointer pauses it outright, which is the best CSS can do.
        // Reduced motion stops it, and the drive never starts.
        !driven && 'animate-marquee hover:[animation-play-state:paused]',
        'motion-reduce:animate-none',
        className,
      )}
    >
      {children}
    </ul>
  )
}

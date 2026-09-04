'use client'

import { useEffect } from 'react'

import { NAV_INK_TARGET } from './navInkSample'

/**
 * How far the page has scrolled, written to the header as `--nav-scroll`.
 *
 * The Utility Nav strip is in flow and scrolls away; the pill is `fixed` and
 * does not. Left at its resting offset the pill would hold the strip's 69px
 * and the 55px gap under it open long after the strip had gone — a pill
 * floating a quarter of the way down the viewport over nothing. So `SiteNav`
 * sets the pill's `top` to
 * `max(var(--spacing-nav-pinned), var(--spacing-nav-offset) - var(--nav-scroll))`:
 * the pill rides up with the strip, keeping the frame's gap to it, and parks
 * at the strip-less 32px the moment the arithmetic would take it higher. The
 * `max()` is what makes the parking a CSS fact rather than a threshold in
 * here — this only ever reports the scroll.
 *
 * One write per frame, and the value is clamped to the resting offset: past
 * that the `max()` has already won, and a variable that keeps growing is a
 * style mutation on every scroll frame for nothing. A page with no strip
 * never mounts this; its pill sits at the pinned offset from the start.
 */
export function syncNavPin(header: HTMLElement): void {
  const rest = parseFloat(getComputedStyle(header).getPropertyValue('--spacing-nav-offset')) || 0
  const scrolled = `${Math.min(Math.max(window.scrollY, 0), rest)}px`
  if (header.style.getPropertyValue('--nav-scroll') !== scrolled)
    header.style.setProperty('--nav-scroll', scrolled)
}

export function watchNavPin(header: HTMLElement): () => void {
  let frame = 0
  const write = () => {
    frame = 0
    syncNavPin(header)
  }

  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame(write)
  }

  write()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  window.addEventListener('pageshow', schedule)

  return () => {
    if (frame) cancelAnimationFrame(frame)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    window.removeEventListener('pageshow', schedule)
  }
}

export function NavPin({ targetId = NAV_INK_TARGET }: { targetId?: string }) {
  useEffect(() => {
    const header = document.getElementById(targetId)
    if (!header) return
    return watchNavPin(header)
  }, [targetId])

  return null
}

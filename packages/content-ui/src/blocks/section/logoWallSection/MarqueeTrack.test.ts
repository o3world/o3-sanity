// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MarqueeTrack, type MarqueeTrackProps } from './MarqueeTrack'

/**
 * The drive under a controlled clock: frames are handed out one at a time
 * with a chosen timestamp, and the copy is a known width, so the strip's
 * position per frame is arithmetic. What is pinned down is the shape of the
 * motion — full speed is the token's, a pointer brakes it over several
 * frames rather than one, it comes to rest, and it picks up on the same
 * curve.
 */
describe('MarqueeTrack', () => {
  let root: Root
  let host: HTMLDivElement
  let queued: Array<(now: number) => void>
  let now: number

  const x = () => {
    const ul = host.querySelector('ul')!
    const match = /translate3d\(([-\d.]+)px/.exec(ul.style.transform)
    return match ? Number(match[1]) : 0
  }

  /** Advance one frame of `ms`, returning how far the strip moved. */
  const frame = (ms: number) => {
    const before = x()
    now += ms
    const pending = queued.splice(0)
    pending.forEach((cb) => cb(now))
    let after = x()
    // Wrapped: count the distance across the seam.
    if (after > before) after -= 1200
    return before - after
  }

  beforeEach(async () => {
    queued = []
    now = 0
    vi.stubGlobal('requestAnimationFrame', (cb: (now: number) => void) => {
      queued.push(cb)
      return queued.length
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    const computed = window.getComputedStyle.bind(window)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const style = computed(el)
      const get = style.getPropertyValue.bind(style)
      style.getPropertyValue = (name) => (name === '--duration-marquee' ? '10s' : get(name))
      return style
    })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 2400,
    } as DOMRect)

    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
    await act(async () => {
      // `.ts`, not `.tsx`: the unit project globs `*.test.ts`.
      root.render(
        createElement(
          MarqueeTrack,
          { copies: 2 } as MarqueeTrackProps,
          createElement('li', null, 'one'),
        ),
      )
    })
    // The mount frame: dt is zero, nothing moves, the clock starts.
    frame(0)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    host.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('takes over from the keyframe and runs at the token speed', () => {
    const ul = host.querySelector('ul')!
    expect(ul.className).not.toContain('animate-marquee')
    expect(ul.style.animation).toBe('none')
    // 1200px a copy over 10s is 120px/s; after a second of 16ms frames the
    // velocity has fully settled.
    for (let i = 0; i < 60; i++) frame(16)
    expect(frame(100)).toBeCloseTo(12, 0)
  })

  it('brakes over several frames under a pointer, then rests', () => {
    for (let i = 0; i < 60; i++) frame(16)
    host.querySelector('ul')!.dispatchEvent(new Event('pointerenter'))
    const steps = Array.from({ length: 8 }, () => frame(100))
    // Every step shorter than the last, none a wall.
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeLessThan(steps[i - 1]!)
    expect(steps[0]).toBeGreaterThan(1)
    // Still, and no longer asking for frames.
    for (let i = 0; i < 20; i++) frame(100)
    expect(queued).toHaveLength(0)
    expect(frame(100)).toBe(0)
  })

  it('picks up again gradually when the pointer leaves', () => {
    const ul = host.querySelector('ul')!
    ul.dispatchEvent(new Event('pointerenter'))
    for (let i = 0; i < 30; i++) frame(100)
    ul.dispatchEvent(new Event('pointerleave'))
    const steps = Array.from({ length: 8 }, () => frame(100))
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]!)
    expect(steps[0]).toBeLessThan(6)
    // Most of the way back after 800ms, all the way after a couple of seconds.
    expect(steps[7]).toBeGreaterThan(10)
    for (let i = 0; i < 20; i++) frame(100)
    expect(frame(100)).toBeCloseTo(12, 0)
  })
})

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { watchNavInk } from './NavInk'

/**
 * #318 — the bar came up in the wrong skin on some loads and stayed there.
 *
 * The failure was never the walk; it was WHEN the walk ran. The answer was
 * taken once at mount and refreshed only by `scroll` and `resize`, and a page
 * load changes the surface under a fixed bar in several ways that fire
 * neither: fonts and images settling, content streaming in, a client-side
 * route change under a layout that never unmounts, a back/forward-cache
 * restore. Every test here moves the band under the bar WITHOUT touching the
 * scroll position or the viewport, which is exactly the shape of the bug.
 *
 * jsdom has no layout engine, so the page is a script rather than a document:
 * `elementsFromPoint` returns whatever band the test has put under the bar,
 * and each element carries its own rect. That is honest here because the code
 * under test asks the browser exactly three questions — what is under this
 * point, what colour is it, how wide is it — and the bug is in none of them.
 */

const DARK = 'rgb(3, 3, 3)'
const LIGHT = 'rgb(255, 255, 255)'

const BAR = { top: 64, bottom: 144, left: 0, right: 1440, width: 1440, height: 80 }

function rect(box: Partial<DOMRect> & { top: number; bottom: number }) {
  return { left: 0, right: 1440, width: 1440, ...box } as DOMRect
}

let header: HTMLElement
let stop: () => void
/** The stack `elementsFromPoint` answers with, front to back. */
let stack: Element[] = []

/** A full-width opaque band, of the kind the walk is meant to stop on. */
function band(color: string) {
  const element = document.createElement('div')
  element.style.backgroundColor = color
  element.getBoundingClientRect = () => rect({ top: 0, bottom: 2000 })
  document.body.append(element)
  return element
}

/** One frame of the browser's, plus the microtask an observer wakes on. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 32))

beforeEach(() => {
  document.body.innerHTML = ''
  stack = []

  header = document.createElement('header')
  header.id = 'site-nav'
  header.getBoundingClientRect = () => rect(BAR)
  document.body.append(header)

  // jsdom implements neither, and the component's own triggers are what is
  // under test — so they are scripted rather than mocked away.
  document.elementsFromPoint = () => [header, ...stack]
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

afterEach(() => stop?.())

describe('the nav’s ink follows the surface under the bar', () => {
  it('reads the band it starts over', async () => {
    stack = [band(DARK)]
    stop = watchNavInk(header)
    await settle()

    // Dark under the bar: the frame's own skin, no attribute at all.
    expect(header.dataset.ink).toBeUndefined()
  })

  it('flips to dark ink over a light band', async () => {
    stack = [band(LIGHT)]
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBe('dark')
  })

  it('re-reads when the page settles under it, with no scroll and no resize', async () => {
    // The load-order race: the bar samples in the hydration commit, and the
    // band it is over arrives (or changes height, or swaps) a moment later.
    stack = [band(DARK)]
    stop = watchNavInk(header)
    await settle()
    expect(header.dataset.ink).toBeUndefined()

    document.body.innerHTML = ''
    document.body.append(header)
    stack = [band(LIGHT)]
    await settle()

    expect(header.dataset.ink, 'the bar kept a skin the page no longer justifies').toBe('dark')
  })

  it('re-reads in the other direction too — white copy is not the safe default', async () => {
    stack = [band(LIGHT)]
    stop = watchNavInk(header)
    await settle()
    expect(header.dataset.ink).toBe('dark')

    document.body.innerHTML = ''
    document.body.append(header)
    stack = [band(DARK)]
    await settle()

    expect(header.dataset.ink).toBeUndefined()
  })

  it('re-reads on a back/forward-cache restore, where effects never re-run', async () => {
    stack = [band(DARK)]
    stop = watchNavInk(header)
    await settle()

    // The restored page is a different document state with the same mounted
    // component, and `pageshow` is the only signal it produces.
    stack = [band(LIGHT)]
    window.dispatchEvent(new Event('pageshow'))
    await settle()

    expect(header.dataset.ink).toBe('dark')
  })

  it('stops sampling once the bar unmounts', async () => {
    stack = [band(DARK)]
    stop = watchNavInk(header)
    await settle()

    stop()
    stack = [band(LIGHT)]
    window.dispatchEvent(new Event('scroll'))
    await settle()

    expect(header.dataset.ink).toBeUndefined()
  })
})

describe('what counts as the surface', () => {
  it('sees through a translucent veil to the band it covers', async () => {
    const veil = document.createElement('div')
    veil.style.backgroundColor = 'rgba(255, 255, 255, 0.55)'
    veil.getBoundingClientRect = () => rect({ top: 0, bottom: 2000 })
    stack = [veil, band(DARK)]
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBeUndefined()
  })

  it('ignores furniture too narrow to be the band', async () => {
    // A white button on a dark hero: light, opaque, and not the surface.
    const button = document.createElement('a')
    button.style.backgroundColor = LIGHT
    button.getBoundingClientRect = () =>
      rect({ top: 80, bottom: 128, left: 630, right: 810, width: 180 })
    stack = [button, band(DARK)]
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBeUndefined()
  })

  it('treats the browser’s default canvas as light', async () => {
    stack = []
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBe('dark')
  })
})

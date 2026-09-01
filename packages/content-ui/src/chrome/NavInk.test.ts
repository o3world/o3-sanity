// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { watchNavInk } from './NavInk'

/**
 * Two things this pins down.
 *
 * **What the bar reads.** It is sampled in columns across the pill and takes
 * the majority, so a card grid narrower than the bar still gets a vote and a
 * button does not carry one. Every element here therefore carries a real
 * horizontal extent, and the scripted `elementsFromPoint` answers per x — the
 * failure those tests describe is invisible to a harness that hands the same
 * stack to every column.
 *
 * **When it reads it** (#318). The answer used to be taken at mount and
 * refreshed only by `scroll` and `resize`, and a page load changes the surface
 * under a fixed bar in several ways that fire neither: fonts and images
 * settling, content streaming in, a client-side route change under a layout
 * that never unmounts, a back/forward-cache restore. Those tests move the band
 * under the bar WITHOUT touching the scroll position or the viewport.
 *
 * jsdom has no layout engine, so the page is a script rather than a document:
 * each element carries its own rect and the stack is assembled from them. That
 * is honest here because the code under test asks the browser exactly two
 * questions — what is under this point, and what colour is it.
 */

const DARK = 'rgb(3, 3, 3)'
const LIGHT = 'rgb(255, 255, 255)'

/** The header: edge-to-edge, as it is at every width. */
const BAR = { top: 64, bottom: 144, left: 0, right: 1440, width: 1440, height: 80 }
/** The pill inside it: 900 centred, which is the box the columns divide up. */
const PILL = { top: 64, bottom: 144, left: 270, right: 1170, width: 900, height: 80 }

function rect(box: Partial<DOMRect> & { top: number; bottom: number }) {
  return { left: 0, right: 1440, width: 1440, ...box } as DOMRect
}

let header: HTMLElement
let stop: () => void
/** Everything on the page, front to back; each column takes what covers it. */
let painted: Element[] = []

/** Anything the bar can be over: a band, a card, a plate, a button. */
function plate({
  color,
  surface,
  left = 0,
  right = 1440,
}: {
  color?: string
  surface?: string
  left?: number
  right?: number
}) {
  const element = document.createElement('div')
  if (color) element.style.backgroundColor = color
  if (surface) element.dataset.surface = surface
  element.getBoundingClientRect = () => rect({ top: 0, bottom: 2000, left, right })
  document.body.append(element)
  painted.push(element)
  return element
}

/** A full-width opaque band, of the kind the walk stops on. */
const band = (color: string) => plate({ color })

/**
 * A photograph, drawn the way `SanityImage` draws one: the asset's LQIP as the
 * element's own background, `cover` unless the caller is testing a fitted box.
 * The bytes are never read — being a picture is the whole of what is asked.
 */
function picture({
  left = 0,
  right = 1440,
  size = 'cover',
}: { left?: number; right?: number; size?: 'cover' | 'contain' } = {}) {
  const element = document.createElement('img')
  element.style.backgroundImage = 'url("data:image/jpeg;base64,/9j/4AAQSkZJRg==")'
  element.style.backgroundSize = size
  element.style.backgroundPosition = '50% 50%'
  element.getBoundingClientRect = () => rect({ top: 0, bottom: 2000, left, right })
  document.body.append(element)
  painted.push(element)
  return element
}

/** One frame of the browser's, plus the microtask an observer wakes on. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 32))

beforeEach(() => {
  document.body.innerHTML = ''
  painted = []

  header = document.createElement('header')
  header.id = 'site-nav'
  header.getBoundingClientRect = () => rect(BAR)
  const pill = document.createElement('nav')
  pill.getBoundingClientRect = () => rect(PILL)
  header.append(pill)
  document.body.append(header)

  // jsdom implements neither, and the component's own triggers are what is
  // under test — so they are scripted rather than mocked away.
  document.elementsFromPoint = (x: number) => [
    header,
    ...painted.filter((element) => {
      const box = element.getBoundingClientRect()
      return x >= box.left && x <= box.right
    }),
  ]
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

afterEach(() => stop?.())

/** Wipe the page and repaint it, the way a route change or a reflow does. */
function repaint(paint: () => void) {
  document.body.innerHTML = ''
  document.body.append(header)
  painted = []
  paint()
}

describe('the nav’s ink follows the surface under the bar', () => {
  it('reads the band it starts over', async () => {
    band(DARK)
    stop = watchNavInk(header)
    await settle()

    // Dark under the bar: the frame's own skin, no attribute at all.
    expect(header.dataset.ink).toBeUndefined()
  })

  it('flips to dark ink over a light band', async () => {
    band(LIGHT)
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBe('dark')
  })

  it('re-reads when the page settles under it, with no scroll and no resize', async () => {
    // The load-order race: the bar samples in the hydration commit, and the
    // band it is over arrives (or changes height, or swaps) a moment later.
    band(DARK)
    stop = watchNavInk(header)
    await settle()
    expect(header.dataset.ink).toBeUndefined()

    repaint(() => band(LIGHT))
    await settle()

    expect(header.dataset.ink, 'the bar kept a skin the page no longer justifies').toBe('dark')
  })

  it('re-reads in the other direction too — white copy is not the safe default', async () => {
    band(LIGHT)
    stop = watchNavInk(header)
    await settle()
    expect(header.dataset.ink).toBe('dark')

    repaint(() => band(DARK))
    await settle()

    expect(header.dataset.ink).toBeUndefined()
  })

  it('re-reads on a back/forward-cache restore, where effects never re-run', async () => {
    band(DARK)
    stop = watchNavInk(header)
    await settle()

    // The restored page is a different document state with the same mounted
    // component, and `pageshow` is the only signal it produces.
    repaint(() => band(LIGHT))
    window.dispatchEvent(new Event('pageshow'))
    await settle()

    expect(header.dataset.ink).toBe('dark')
  })

  it('holds its skin while a view transition captures the page, then re-reads', async () => {
    // The cross-page fade paints the document as pseudo-elements, and a
    // captured box stops hit-testing — so the walk finds no band, falls through
    // to the body's own white, and the bar takes the light skin over an ink
    // hero. The swap that scheduled that sample is the last thing to happen, so
    // nothing corrects it: the bar was white after every nav click.
    band(DARK)
    stop = watchNavInk(header)
    await settle()
    expect(header.dataset.ink).toBeUndefined()

    // Mid-capture: the new page is ink too, but nothing under the bar answers.
    const transition = { effect: { pseudoElement: '::view-transition-group(root)' } }
    document.getAnimations = () => [transition] as unknown as Animation[]
    repaint(() => {})
    await settle()

    expect(header.dataset.ink, 'the bar read a page that was not being painted').toBeUndefined()

    // The capture ends and the arrived page is what gets read.
    document.getAnimations = () => []
    repaint(() => band(LIGHT))
    await settle()

    expect(header.dataset.ink).toBe('dark')
  })

  it('samples normally where the document cannot enumerate animations', async () => {
    // No `getAnimations` means no view transitions either, so there is nothing
    // to wait for and the bar must not stall waiting for one.
    const enumerate = document.getAnimations
    // @ts-expect-error — the older document this stands in for has no such method.
    delete document.getAnimations

    band(LIGHT)
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBe('dark')
    document.getAnimations = enumerate
  })

  it('stops sampling once the bar unmounts', async () => {
    band(DARK)
    stop = watchNavInk(header)
    await settle()

    stop()
    repaint(() => band(LIGHT))
    window.dispatchEvent(new Event('scroll'))
    await settle()

    expect(header.dataset.ink).toBeUndefined()
  })
})

describe('what counts as the surface', () => {
  it('sees through a translucent veil to the band it covers', async () => {
    plate({ color: 'rgba(255, 255, 255, 0.55)' })
    band(DARK)
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBeUndefined()
  })

  it('reads a declared surface on an element that paints no fill at all', async () => {
    // A /work case-study card: a photograph under a gradient scrim, so every
    // background-color in the stack is transparent and only the declaration
    // says the ground is dark.
    plate({ surface: 'ink', left: 176, right: 1424 })
    band(LIGHT)
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink, 'dark ink over a near-black card').toBeUndefined()
  })

  it('lets a declared light plate win over the dark band it sits on', async () => {
    plate({ surface: 'bone' })
    band(DARK)
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBe('dark')
  })

  it('treats the browser’s default canvas as light', async () => {
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBe('dark')
  })
})

describe('a picture is a dark ground, whatever its pixels average', () => {
  /**
   * The two skins fail asymmetrically: white copy on a 20% black scrim
   * survives almost any ground, and `#232323` on a 10% one needs the ground
   * pale AND even. A photograph is the second thing's enemy even when it is
   * bright — the article picture that produced #372 averaged 205 of 255 under
   * the bar and still ran 81 to 251 inside the bar's own height.
   */
  it('keeps white copy over a picture sitting on a white band', async () => {
    picture()
    band(LIGHT)
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBeUndefined()
  })

  it('reads the band beside a picture too narrow to be the ground', async () => {
    picture({ left: 630, right: 810 })
    band(LIGHT)
    stop = watchNavInk(header)
    await settle()

    // One column of nine over the picture, eight over bone.
    expect(header.dataset.ink).toBe('dark')
  })

  /**
   * `contain` fits the whole picture inside its box and leaves bars either
   * side. A strip of bar is not a strip of picture, so the walk carries on to
   * what is behind — here, the light band the box is sitting on.
   */
  it('walks past the letterbox of a contained picture', async () => {
    const fitted = picture({ size: 'contain' })
    // A wide box holding a square picture: 620px of bar either side, so every
    // column but the middle three lands beside it.
    Object.defineProperty(fitted, 'naturalWidth', { value: 20 })
    Object.defineProperty(fitted, 'naturalHeight', { value: 20 })
    fitted.getBoundingClientRect = () => rect({ top: 0, bottom: 200, left: 0, right: 1440 })
    band(LIGHT)
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBe('dark')
  })

  it('treats a picture whose shape it cannot know yet as a picture', async () => {
    // Before the image decodes there is no `naturalWidth` to locate the
    // letterbox with, and picture is the half of that guess that stays legible.
    picture({ size: 'contain' })
    band(LIGHT)
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBeUndefined()
  })
})

describe('the bar is read in columns, and takes the majority', () => {
  it('keeps white copy over a card grid on a light band', async () => {
    // The /insights feed: three near-black cards three-up on `bone`. Not one
    // of them is as wide as the bar, and together they are what the bar is
    // over — dark copy here is dark copy on a black photograph.
    plate({ color: DARK, left: 176, right: 560 })
    plate({ color: DARK, left: 592, right: 976 })
    plate({ color: DARK, left: 1008, right: 1392 })
    band(LIGHT)
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBeUndefined()
  })

  it('ignores furniture too narrow to carry the vote', async () => {
    // A white button on a dark hero: light, opaque, and one column of nine.
    plate({ color: LIGHT, left: 630, right: 810 })
    band(DARK)
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBeUndefined()
  })

  it('still flips for a light band carrying one dark ornament', async () => {
    plate({ color: DARK, left: 630, right: 810 })
    band(LIGHT)
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBe('dark')
  })

  it('takes a bare majority — half the bar being light is not one', async () => {
    // A plate reaching four of the nine columns, over a dark band. The bar is
    // more over the band than over the plate, so the band answers for it.
    plate({ color: LIGHT, left: 0, right: 620 })
    band(DARK)
    stop = watchNavInk(header)
    await settle()

    expect(header.dataset.ink).toBeUndefined()
  })
})

// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'

import { ANCHOR_GLIDE_SCRIPT } from './anchor-glide'

/**
 * The gate, run rather than read (#156). What matters is not what the script
 * says but *when* it says it: a document that arms the glide before `load`
 * re-opens the bug, because the browser's scroll to the URL's `#fragment` is
 * still in flight and a smooth root turns it into an animation nothing
 * finishes.
 */
let events: EventTarget
let frames: Map<number, FrameRequestCallback>
let nextFrame: number
const run = () =>
  new Function(
    'addEventListener',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    ANCHOR_GLIDE_SCRIPT,
  )(
    events.addEventListener.bind(events),
    (callback: FrameRequestCallback) => {
      frames.set(++nextFrame, callback)
      return nextFrame
    },
    (id: number) => frames.delete(id),
  )
const paint = () => {
  const pending = [...frames.values()]
  frames.clear()
  pending.forEach((callback) => callback(0))
}

const armed = () => document.documentElement.hasAttribute('data-anchor-glide')

const readyState = (value: DocumentReadyState) =>
  Object.defineProperty(document, 'readyState', { value, configurable: true })

beforeEach(() => {
  events = new EventTarget()
  frames = new Map()
  nextFrame = 0
  document.documentElement.removeAttribute('data-anchor-glide')
  readyState('loading')
})

describe('the anchor-glide gate', () => {
  it('leaves the document un-armed while it is still loading', () => {
    run()

    expect(armed()).toBe(false)
  })

  it('arms on load, so the fragment scroll is instant and every jump after it glides', () => {
    run()

    events.dispatchEvent(new Event('load'))

    expect(armed()).toBe(true)
  })

  it('arms immediately when the document has already finished loading', () => {
    readyState('complete')

    run()

    expect(armed()).toBe(true)
  })

  it('keeps native history restoration instant, then restores anchor gliding', () => {
    readyState('complete')
    run()
    events.dispatchEvent(new Event('popstate'))
    expect(armed()).toBe(false)
    paint()
    expect(armed()).toBe(true)
  })

  it('keeps rapid history traversals inside one restoration frame', () => {
    readyState('complete')
    run()
    events.dispatchEvent(new Event('popstate'))
    events.dispatchEvent(new Event('popstate'))
    expect(armed()).toBe(false)
    expect(frames.size).toBe(1)
    paint()
    expect(armed()).toBe(true)
  })

  it('does not arm anchor gliding on a history event before load', () => {
    run()
    events.dispatchEvent(new Event('popstate'))
    paint()
    expect(armed()).toBe(false)
    events.dispatchEvent(new Event('load'))
    expect(armed()).toBe(true)
  })
})

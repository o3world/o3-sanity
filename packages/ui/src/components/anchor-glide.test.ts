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
const run = () => new Function(ANCHOR_GLIDE_SCRIPT)()

const armed = () => document.documentElement.hasAttribute('data-anchor-glide')

const readyState = (value: DocumentReadyState) =>
  Object.defineProperty(document, 'readyState', { value, configurable: true })

beforeEach(() => {
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

    window.dispatchEvent(new Event('load'))

    expect(armed()).toBe(true)
  })

  it('arms immediately when the document has already finished loading', () => {
    readyState('complete')

    run()

    expect(armed()).toBe(true)
  })
})

import { afterEach, describe, expect, it } from 'vitest'

import { pushDataLayerEvent } from './dataLayer'

type Page = { dataLayer?: Record<string, unknown>[] }

describe('pushDataLayerEvent', () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window
  })

  it('queues the event even before GTM has loaded', () => {
    const page: Page = {}
    ;(globalThis as { window?: unknown }).window = page
    pushDataLayerEvent({ event: 'book_call_click', location: 'hero' })
    expect(page.dataLayer).toEqual([{ event: 'book_call_click', location: 'hero' }])
  })

  it('appends to the layer GTM already owns', () => {
    const page: Page = { dataLayer: [{ event: 'gtm.js' }] }
    ;(globalThis as { window?: unknown }).window = page
    pushDataLayerEvent({ event: 'start_check_click', location: 'package-check' })
    expect(page.dataLayer).toEqual([
      { event: 'gtm.js' },
      { event: 'start_check_click', location: 'package-check' },
    ])
  })

  it('carries the package a package button sells', () => {
    const page: Page = {}
    ;(globalThis as { window?: unknown }).window = page
    pushDataLayerEvent({
      event: 'book_call_click',
      location: 'package-review',
      package: 'AI Visibility Review',
    })
    expect(page.dataLayer).toEqual([
      { event: 'book_call_click', location: 'package-review', package: 'AI Visibility Review' },
    ])
  })

  it('does nothing on the server', () => {
    expect(() => pushDataLayerEvent({ event: 'book_call_click', location: 'nav' })).not.toThrow()
  })
})

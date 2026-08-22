import { describe, expect, it } from 'vitest'

import { decodePathParam } from './decodePathParam'

/**
 * This helper exists because Next hands `Page` the RAW segment and
 * `generateMetadata` the DECODED one for the same request. Slugs are stored
 * decoded, so without normalizing, a page would find its document while its
 * metadata silently missed — a bug that shows up as a blank <title> on exactly
 * the accented URLs nobody tests by hand.
 */
describe('decodePathParam', () => {
  it('leaves a plain ASCII slug untouched', () => {
    expect(decodePathParam('headless-cms-vs-traditional-cms')).toBe(
      'headless-cms-vs-traditional-cms',
    )
  })

  /**
   * The two o3xo.ai slugs with a curly apostrophe: the corpus stores the
   * character, a browser sends the escape, and the lookup has to match (#218).
   */
  it('decodes a percent-encoded segment to the form slugs are stored in', () => {
    expect(decodePathParam('mike-gadsby-on-pact%E2%80%99s-digital-phorum-podcast')).toBe(
      'mike-gadsby-on-pact’s-digital-phorum-podcast',
    )
    expect(decodePathParam('solu%C3%A7%C3%B5es')).toBe('soluções')
  })

  it('is idempotent — an already-decoded segment passes through unchanged', () => {
    const decoded = decodePathParam('solu%C3%A7%C3%B5es')
    expect(decodePathParam(decoded)).toBe(decoded)
  })

  it('handles astral-plane characters as whole code points, not lone surrogates', () => {
    expect(decodePathParam(encodeURIComponent('🎉'))).toBe('🎉')
  })

  // A malformed escape is a URL nobody published, and the route's answer to it
  // is 404 — which it cannot give if normalizing threw first.
  it('passes a malformed escape through rather than throwing', () => {
    expect(decodePathParam('100%-certain')).toBe('100%-certain')
  })

  it('returns an empty string unchanged', () => {
    expect(decodePathParam('')).toBe('')
  })
})

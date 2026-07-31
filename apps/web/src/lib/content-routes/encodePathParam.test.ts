import { describe, expect, it } from 'vitest'

import { encodePathParam } from './encodePathParam'

/**
 * This helper exists because Next hands `Page` the RAW segment and
 * `generateMetadata` the DECODED one for the same request. Slugs are stored
 * encoded, so without normalizing, a page would find its document while its
 * metadata silently missed — a bug that shows up as a blank <title> on exactly
 * the accented URLs nobody tests by hand.
 */
describe('encodePathParam', () => {
  it('leaves a plain ASCII slug untouched', () => {
    expect(encodePathParam('headless-cms-vs-traditional-cms')).toBe(
      'headless-cms-vs-traditional-cms',
    )
  })

  it('encodes raw non-ASCII to the form slugs are stored in', () => {
    expect(encodePathParam('soluções')).toBe('solu%C3%A7%C3%B5es')
  })

  it('is idempotent — an already-encoded segment passes through unchanged', () => {
    const encoded = encodePathParam('soluções')
    expect(encodePathParam(encoded)).toBe(encoded)
  })

  // A blanket encodeURIComponent(decodeURIComponent(s)) round-trip would turn
  // a literal '+' into '%2B' and corrupt the lookup. Every ASCII byte passes
  // through untouched instead.
  it('leaves ASCII punctuation alone rather than round-tripping it', () => {
    expect(encodePathParam('a+b')).toBe('a+b')
    expect(encodePathParam('a/b')).toBe('a/b')
    expect(encodePathParam("o'brien")).toBe("o'brien")
  })

  it('handles astral-plane characters as whole code points, not lone surrogates', () => {
    expect(encodePathParam('🎉')).toBe(encodeURIComponent('🎉'))
  })

  it('returns an empty string unchanged', () => {
    expect(encodePathParam('')).toBe('')
  })
})

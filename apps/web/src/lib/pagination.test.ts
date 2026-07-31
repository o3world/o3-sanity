import { describe, expect, it } from 'vitest'

import { clampPage, pageRange, parsePage } from './pagination'

describe('parsePage', () => {
  it('defaults to page 1 for a missing or empty param', () => {
    expect(parsePage(undefined)).toBe(1)
    expect(parsePage('')).toBe(1)
  })

  it('reads the first value when Next hands over a repeated param', () => {
    expect(parsePage(['3', '7'])).toBe(3)
  })

  // ?page=0, ?page=-2 and ?page=abc are all reachable from a URL bar or a
  // stale link; none of them should reach the query as a negative offset.
  it('falls back to page 1 for junk rather than producing a negative offset', () => {
    expect(parsePage('abc')).toBe(1)
    expect(parsePage('0')).toBe(1)
    expect(parsePage('-2')).toBe(1)
    expect(parsePage('NaN')).toBe(1)
    expect(parsePage('Infinity')).toBe(1)
  })

  it('floors a fractional page', () => {
    expect(parsePage('2.9')).toBe(2)
  })
})

describe('clampPage', () => {
  it('leaves an in-range page alone', () => {
    expect(clampPage(2, 5)).toBe(2)
  })

  it('clamps past the end to the last page', () => {
    expect(clampPage(99, 5)).toBe(5)
  })

  it('clamps below the start to the first page', () => {
    expect(clampPage(0, 5)).toBe(1)
  })

  it('returns page 1 for an empty feed rather than page 0', () => {
    expect(clampPage(3, 0)).toBe(1)
  })
})

describe('pageRange', () => {
  it('slices from zero on the first page', () => {
    expect(pageRange(1, 12)).toEqual({ offset: 0, end: 12 })
  })

  it('advances by a full page each step, with an exclusive end', () => {
    expect(pageRange(2, 12)).toEqual({ offset: 12, end: 24 })
    expect(pageRange(3, 12)).toEqual({ offset: 24, end: 36 })
  })
})

import { describe, expect, it } from 'vitest'

import { pageRange } from './pagination'

describe('pageRange', () => {
  it('slices from zero on the first page', () => {
    expect(pageRange(1, 12)).toEqual({ offset: 0, end: 12 })
  })

  it('advances by a full page each step, with an exclusive end', () => {
    expect(pageRange(2, 12)).toEqual({ offset: 12, end: 24 })
    expect(pageRange(3, 12)).toEqual({ offset: 24, end: 36 })
  })
})

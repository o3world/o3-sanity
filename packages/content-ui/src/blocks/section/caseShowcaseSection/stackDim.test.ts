import { describe, expect, it } from 'vitest'

import { STACK_DIM_FLOOR, stackedCardOpacity } from './stackDim'

/** A card pinned 160px down the viewport, 500px tall. */
const pinned = { stickyTop: 160, height: 500 }

describe('the dim a covered case card carries', () => {
  it('is fully opaque while the next card is still below it', () => {
    expect(stackedCardOpacity({ ...pinned, nextTop: 660 })).toBe(1)
  })

  it('stays opaque when the next card is further down the page still', () => {
    expect(stackedCardOpacity({ ...pinned, nextTop: 2000 })).toBe(1)
  })

  it('sits halfway to the floor when half the card is covered', () => {
    expect(stackedCardOpacity({ ...pinned, nextTop: 410 })).toBeCloseTo(
      1 - 0.5 * (1 - STACK_DIM_FLOOR),
    )
  })

  it('reaches the floor exactly as the next card covers the pinned one', () => {
    expect(stackedCardOpacity({ ...pinned, nextTop: 160 })).toBeCloseTo(STACK_DIM_FLOOR)
  })

  it('holds at the floor once the next card has scrolled past', () => {
    expect(stackedCardOpacity({ ...pinned, nextTop: -800 })).toBeCloseTo(STACK_DIM_FLOOR)
  })

  it('takes a floor of its own', () => {
    expect(stackedCardOpacity({ ...pinned, nextTop: 160 }, 0.5)).toBeCloseTo(0.5)
  })

  it('leaves a card with no height alone', () => {
    expect(stackedCardOpacity({ stickyTop: 160, height: 0, nextTop: 0 })).toBe(1)
  })
})

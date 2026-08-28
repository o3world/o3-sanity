import { describe, expect, it } from 'vitest'

import { coversSample, LIGHT_LUMINANCE, luminance, positionOffset } from './navInkSample'

/**
 * The bar treats a picture as a dark ground whatever its pixels average
 * (#372), so the only arithmetic left is the one question that decision still
 * needs asking: under `background-size: contain` a strip of the box can fall
 * beside the picture rather than on it, and the ground there belongs to
 * whatever is behind.
 */

describe('background-position resolves against the slack, not the box', () => {
  it('slides a percentage across the gap', () => {
    // 60px of image in a 100px box: 40px of gap to distribute.
    expect(positionOffset('0%', 100, 60)).toBeCloseTo(0)
    expect(positionOffset('50%', 100, 60)).toBe(20)
    expect(positionOffset('100%', 100, 60)).toBe(40)
  })

  it('takes a length as the offset it is', () => {
    expect(positionOffset('12px', 100, 60)).toBe(12)
  })

  it('reads an unparseable value as no offset at all', () => {
    expect(positionOffset('auto', 100, 60)).toBe(0)
  })
})

describe('whether a strip of the bar lands on a contained picture', () => {
  /** A square picture centred in a wide box: 100px bars either side. */
  const box = { left: 0, top: 0, right: 400, bottom: 200 }
  const natural = { width: 20, height: 20 }
  const centred = { x: '50%', y: '50%' }

  it('lands on the picture across the middle of the box', () => {
    expect(
      coversSample({ left: 150, top: 0, right: 250, bottom: 200 }, box, natural, centred),
    ).toBe(true)
  })

  it('lands in the letterbox at the edge', () => {
    expect(coversSample({ left: 0, top: 0, right: 90, bottom: 200 }, box, natural, centred)).toBe(
      false,
    )
  })

  it('follows the position when the picture is pushed to one side', () => {
    const strip = { left: 0, top: 0, right: 90, bottom: 200 }
    expect(coversSample(strip, box, natural, { x: '0%', y: '50%' })).toBe(true)
    expect(coversSample(strip, box, natural, { x: '100%', y: '50%' })).toBe(false)
  })

  it('answers no for a box with no area', () => {
    expect(
      coversSample(
        { left: 0, top: 0, right: 10, bottom: 10 },
        { left: 0, top: 0, right: 0, bottom: 0 },
        natural,
        centred,
      ),
    ).toBe(false)
  })
})

describe('what a colour weighs', () => {
  it('puts bone and white above the threshold, ink below it', () => {
    expect(luminance(241, 240, 236)).toBeGreaterThan(LIGHT_LUMINANCE)
    expect(luminance(255, 255, 255)).toBeGreaterThan(LIGHT_LUMINANCE)
    expect(luminance(10, 10, 11)).toBeLessThan(LIGHT_LUMINANCE)
  })

  it('weighs a colour the way the eye does — green over blue', () => {
    expect(luminance(0, 255, 0)).toBeGreaterThan(luminance(0, 0, 255))
  })
})

import { describe, expect, it } from 'vitest'

import {
  averageLuminance,
  LIGHT_LUMINANCE,
  luminance,
  positionOffset,
  sampledRegion,
  type Pixels,
} from './navInkSample'

/**
 * The bar reads a photograph through the LQIP `SanityImage` paints under it,
 * which is only honest if the strip of placeholder it samples is the strip of
 * picture the reader sees. That mapping is `object-fit` arithmetic — scale,
 * overflow, hotspot — and it is what these tests pin down; the DOM side is in
 * `NavInk.test.ts`.
 */

/** A grid whose left half is black and right half white, at 1px per cell. */
function halved(width: number, height: number): Pixels {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = x < width / 2 ? 0 : 255
      const at = (y * width + x) * 4
      data[at] = data[at + 1] = data[at + 2] = value
      data[at + 3] = 255
    }
  }
  return { width, height, data }
}

describe('background-position resolves against the slack, not the box', () => {
  it('slides a percentage across the overflow', () => {
    // 100px of image in a 60px box: 40px of overflow to distribute.
    expect(positionOffset('0%', 60, 100)).toBeCloseTo(0)
    expect(positionOffset('50%', 60, 100)).toBe(-20)
    expect(positionOffset('100%', 60, 100)).toBe(-40)
  })

  it('takes a length as the offset it is', () => {
    expect(positionOffset('12px', 60, 100)).toBe(12)
  })

  it('reads an unparseable value as no offset at all', () => {
    expect(positionOffset('auto', 60, 100)).toBe(0)
  })
})

describe('which pixels a strip of the bar lands on', () => {
  const natural = { width: 20, height: 20 }
  /** A 400x200 box: the image covers it at 20x, overflowing top and bottom. */
  const box = { left: 0, top: 0, right: 400, bottom: 200 }

  it('maps a centred cover crop back to image pixels', () => {
    const region = sampledRegion({ left: 0, top: 0, right: 20, bottom: 200 }, box, natural, true, {
      x: '50%',
      y: '50%',
    })
    // 400/20 = 20x scale, so the first 20px of the box is the first image
    // pixel, and the 200px box crops the middle ten rows out of the twenty.
    expect(region).toEqual({ left: 0, top: 5, right: 1, bottom: 15 })
  })

  it('follows the hotspot when the crop is positioned off-centre', () => {
    // A tall image in a square box: 200px of it overflow, and the hotspot
    // decides which 200 survive.
    const portrait = { width: 20, height: 40 }
    const square = { left: 0, top: 0, right: 200, bottom: 200 }
    const strip = { left: 0, top: 0, right: 200, bottom: 40 }
    const top = sampledRegion(strip, square, portrait, true, { x: '50%', y: '0%' })
    const bottom = sampledRegion(strip, square, portrait, true, { x: '50%', y: '100%' })

    expect(top).toEqual({ left: 0, top: 0, right: 20, bottom: 4 })
    // Pulled to the bottom of the crop, the same strip of box shows rows the
    // top-aligned crop had pushed out of view.
    expect(bottom).toEqual({ left: 0, top: 20, right: 20, bottom: 24 })
  })

  it('returns nothing for a strip that falls in a contain’s letterbox', () => {
    // A square image fitted inside a wide box leaves bars either side.
    const region = sampledRegion({ left: 0, top: 0, right: 20, bottom: 200 }, box, natural, false, {
      x: '50%',
      y: '50%',
    })
    expect(region).toBeNull()
  })

  it('returns nothing for a box with no area', () => {
    expect(
      sampledRegion(
        { left: 0, top: 0, right: 10, bottom: 10 },
        { left: 0, top: 0, right: 0, bottom: 0 },
        natural,
        true,
        { x: '50%', y: '50%' },
      ),
    ).toBeNull()
  })
})

describe('what a region weighs', () => {
  const pixels = halved(20, 20)

  it('reads the dark half as dark and the light half as light', () => {
    const dark = averageLuminance(pixels, { left: 0, top: 0, right: 10, bottom: 20 })
    const light = averageLuminance(pixels, { left: 10, top: 0, right: 20, bottom: 20 })
    expect(dark).toBeLessThan(LIGHT_LUMINANCE)
    expect(light).toBeGreaterThan(LIGHT_LUMINANCE)
  })

  it('averages a region that straddles both halves', () => {
    expect(averageLuminance(pixels, { left: 0, top: 0, right: 20, bottom: 20 })).toBeCloseTo(
      127.5,
      0,
    )
  })

  it('weighs a colour the way the eye does — green over blue', () => {
    expect(luminance(0, 255, 0)).toBeGreaterThan(luminance(0, 0, 255))
  })
})

import { describe, expect, it } from 'vitest'

import { imageDimensions, imageHotspot } from './image'

const PORTRAIT = 'image-1111111111111111111111111111111111111111-2000x3000-jpg'

const anImage = (extra: Record<string, unknown> = {}) => ({
  _type: 'image',
  asset: { _type: 'reference', _ref: PORTRAIT },
  ...extra,
})

describe('imageDimensions', () => {
  it('reads the asset’s real shape off its id, so a portrait stays a portrait', () => {
    expect(imageDimensions(anImage())).toEqual({
      width: 2000,
      height: 3000,
      aspectRatio: 2000 / 3000,
    })
  })

  it('narrows to the editor’s crop — the CDN applies it, so it is the delivered shape', () => {
    // 20% off the sides, 10% off the bottom: 1200 x 2700.
    const dimensions = imageDimensions(anImage({ crop: { left: 0.2, right: 0.2, bottom: 0.1 } }))
    expect(dimensions).toMatchObject({ width: 1200, height: 2700 })
  })

  it('finds the id whether it arrives as a ref, an expanded asset, or a bare string', () => {
    const expected = { width: 2000, height: 3000 }
    expect(imageDimensions({ asset: { _id: PORTRAIT } })).toMatchObject(expected)
    expect(imageDimensions({ _ref: PORTRAIT })).toMatchObject(expected)
    expect(imageDimensions(PORTRAIT)).toMatchObject(expected)
  })

  it('returns null rather than a wrong shape when there is nothing to parse', () => {
    expect(imageDimensions(null)).toBeNull()
    expect(imageDimensions({})).toBeNull()
    expect(imageDimensions({ asset: {} })).toBeNull()
    expect(imageDimensions('image-abc-not-dimensions-jpg')).toBeNull()
  })
})

describe('imageHotspot', () => {
  it('passes the editor’s hotspot through', () => {
    expect(imageHotspot(anImage({ hotspot: { x: 0.25, y: 0.75 } }))).toEqual({ x: 0.25, y: 0.75 })
  })

  it('is null without one — centred is the browser default already', () => {
    expect(imageHotspot(anImage())).toBeNull()
    expect(imageHotspot(null)).toBeNull()
  })
})

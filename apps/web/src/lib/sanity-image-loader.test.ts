import { describe, expect, it } from 'vitest'

import sanityImageLoader from './sanity-image-loader'

/**
 * A URL as `urlForImage` builds it: the asset path, `auto=format`, `fit=max`
 * and the `w` the caller asked for. Every expectation below is a hand-written
 * URL, not one this module produced.
 */
const BUILT =
  'https://cdn.sanity.io/images/p/production/abc-2400x1350.jpg?auto=format&fit=max&w=1600'

/** Parsed query of a loader result, so an assertion names one parameter. */
function query(url: string): Record<string, string> {
  return Object.fromEntries(new URL(url).searchParams)
}

describe('sanityImageLoader', () => {
  it('asks the CDN for the width the srcset entry wants', () => {
    const url = sanityImageLoader({ src: BUILT, width: 640 })
    expect(query(url).w).toBe('640')
  })

  it('keeps the browser on the source CDN, so no transformation is billed', () => {
    // The optimizer bypass is the whole point of the module (#268, spec #260):
    // a `/_next/image?url=…` result here is a billed transformation per image.
    const url = sanityImageLoader({ src: BUILT, width: 828 })
    expect(new URL(url).hostname).toBe('cdn.sanity.io')
    expect(new URL(url).pathname).toBe('/images/p/production/abc-2400x1350.jpg')
  })

  it('rescales a ratio crop’s height so the requested width keeps its shape', () => {
    // A 16/9 box asked for at 1600×900; at 400 wide the same shape is 225 tall.
    const cropped =
      'https://cdn.sanity.io/images/p/production/abc-2400x1350.jpg?auto=format&fit=crop&w=1600&h=900'
    expect(query(sanityImageLoader({ src: cropped, width: 400 }))).toMatchObject({
      w: '400',
      h: '225',
    })
  })

  it('rounds a height that does not divide evenly', () => {
    const cropped =
      'https://cdn.sanity.io/images/p/production/abc-2400x1350.jpg?auto=format&fit=crop&w=822&h=548'
    expect(query(sanityImageLoader({ src: cropped, width: 640 }))).toMatchObject({
      w: '640',
      h: '427', // 548 / 822 × 640 = 426.6
    })
  })

  it('leaves the crop rectangle alone — `rect` is in source pixels', () => {
    const cropped =
      'https://cdn.sanity.io/images/p/production/abc-2400x1350.jpg?rect=0,120,2400,1350&auto=format&fit=crop&w=1600&h=900'
    expect(query(sanityImageLoader({ src: cropped, width: 750 })).rect).toBe('0,120,2400,1350')
  })

  it('adds no height to an uncropped image, so nothing is trimmed', () => {
    expect(query(sanityImageLoader({ src: BUILT, width: 1080 })).h).toBeUndefined()
  })

  it('keeps the format negotiation and fit the builder asked for', () => {
    expect(query(sanityImageLoader({ src: BUILT, width: 96 }))).toMatchObject({
      auto: 'format',
      fit: 'max',
    })
  })

  it('does not override a fit the URL already carries', () => {
    const clipped = 'https://cdn.sanity.io/images/p/production/abc-2400x1350.jpg?fit=clip&w=800'
    expect(query(sanityImageLoader({ src: clipped, width: 400 }))).toMatchObject({
      fit: 'clip',
      auto: 'format',
    })
  })

  it('defaults format negotiation on for a URL built some other way', () => {
    const bare = 'https://cdn.sanity.io/images/p/production/abc-2400x1350.jpg'
    expect(query(sanityImageLoader({ src: bare, width: 640 }))).toEqual({
      w: '640',
      auto: 'format',
      fit: 'max',
    })
  })

  it('passes a quality through, and asks for none when the caller set none', () => {
    expect(query(sanityImageLoader({ src: BUILT, width: 640, quality: 60 })).q).toBe('60')
    expect(query(sanityImageLoader({ src: BUILT, width: 640 })).q).toBeUndefined()
  })

  it('hands back a local asset untouched rather than throwing on a relative path', () => {
    expect(sanityImageLoader({ src: '/og.png', width: 1200 })).toBe('/og.png')
  })

  it('hands back a foreign host untouched — only Sanity URLs are ours to rewrite', () => {
    const foreign = 'https://images.example.com/photo.jpg?w=100'
    expect(sanityImageLoader({ src: foreign, width: 640 })).toBe(foreign)
  })
})

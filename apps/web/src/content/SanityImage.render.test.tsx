import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SanityImage } from './SanityImage'

/**
 * A real asset id — `@sanity/image-url` parses the trailing `WxH` out of it
 * and rejects anything looser. 2000x3000 is deliberately portrait: a wrong
 * intrinsic height shows up as a wrong ratio, not as a rounding difference.
 */
const PORTRAIT = 'image-1111111111111111111111111111111111111111-2000x3000-jpg'

const anImage = (extra: Record<string, unknown> = {}) => ({
  _type: 'image' as const,
  asset: { _type: 'reference' as const, _ref: PORTRAIT },
  ...extra,
})

/** The `src` of the single <img> in the markup, decoded. */
function srcOf(html: string): string {
  const src = /<img[^>]*\ssrc="([^"]+)"/.exec(html)?.[1] ?? ''
  return src.replace(/&amp;/g, '&')
}

describe('SanityImage', () => {
  describe('ratio="original" (the default)', () => {
    it('lays out at the image’s own shape rather than a guessed one', () => {
      const html = renderToStaticMarkup(<SanityImage source={anImage()} alt="" width={1600} />)
      expect(html).toContain('width="1600"')
      // 2000x3000 at width 1600 is 2400 tall. A 3:2 guess would say 1067.
      expect(html).toContain('height="2400"')
    })

    it('asks the CDN for no crop, so nothing is trimmed away', () => {
      const html = renderToStaticMarkup(<SanityImage source={anImage()} alt="" width={800} />)
      expect(srcOf(html)).toContain('fit=max')
      expect(srcOf(html)).not.toContain('h=')
    })

    it('renders one bare <img>, with no box around it', () => {
      const html = renderToStaticMarkup(<SanityImage source={anImage()} alt="A view" />)
      expect(html).not.toContain('<div')
      expect(html).toContain('alt="A view"')
    })
  })

  describe('a ratio box', () => {
    it('shapes the box and crops on the CDN, at the ratio’s own dimensions', () => {
      const html = renderToStaticMarkup(
        <SanityImage source={anImage()} alt="" ratio="16/9" width={1600} />,
      )
      expect(html).toContain('aspect-video')
      expect(html).toContain('object-cover')
      expect(srcOf(html)).toContain('w=1600')
      expect(srcOf(html)).toContain('h=900')
      expect(srcOf(html)).toContain('fit=crop')
    })

    it('cuts around the hotspot instead of the centre', () => {
      const centred = srcOf(
        renderToStaticMarkup(<SanityImage source={anImage()} alt="" ratio="1/1" width={600} />),
      )
      const topWeighted = srcOf(
        renderToStaticMarkup(
          <SanityImage
            source={anImage({ hotspot: { x: 0.5, y: 0.1, width: 0.2, height: 0.2 } })}
            alt=""
            ratio="1/1"
            width={600}
          />,
        ),
      )
      // Both crop to a square; only the hotspot decides which square.
      expect(centred).toContain('rect=')
      expect(topWeighted).toContain('rect=')
      expect(topWeighted).not.toBe(centred)
    })

    it('fit="contain" keeps the whole image, letterboxed inside the box', () => {
      const html = renderToStaticMarkup(
        <SanityImage source={anImage()} alt="" ratio="4/3" width={900} fit="contain" />,
      )
      expect(html).toContain('aspect-4/3')
      expect(html).toContain('object-contain')
      // No forced height: the CDN returns the whole image and CSS fits it.
      expect(srcOf(html)).not.toContain('h=')
      expect(srcOf(html)).toContain('fit=max')
    })

    it('puts the caller’s className on the box, not the image', () => {
      const html = renderToStaticMarkup(
        <SanityImage source={anImage()} alt="" ratio="3/2" className="rounded-card" />,
      )
      expect(/<div[^>]*rounded-card/.test(html)).toBe(true)
    })
  })

  describe('ratio="fill"', () => {
    it('hands the shape to the parent and steers the crop by hotspot', () => {
      const html = renderToStaticMarkup(
        <SanityImage source={anImage({ hotspot: { x: 0.25, y: 0.75 } })} alt="" ratio="fill" />,
      )
      expect(html).toContain('h-full w-full')
      expect(html).toContain('object-cover')
      expect(html).toContain('object-position:25% 75%')
    })
  })

  it('renders nothing for an empty or unset image field', () => {
    expect(renderToStaticMarkup(<SanityImage source={null} alt="" />)).toBe('')
    expect(renderToStaticMarkup(<SanityImage source={undefined} alt="" />)).toBe('')
    expect(renderToStaticMarkup(<SanityImage source={{ asset: undefined }} alt="" />)).toBe('')
  })
})

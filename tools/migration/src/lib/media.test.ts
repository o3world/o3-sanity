import { describe, expect, it } from 'vitest'

import { isImageBuffer } from './media'

/** A buffer starting with `bytes`, padded so subarray reads are in range. */
function withHeader(bytes: number[] | string, padTo = 64): Buffer {
  const head = typeof bytes === 'string' ? Buffer.from(bytes, 'binary') : Buffer.from(bytes)
  return Buffer.concat([head, Buffer.alloc(Math.max(0, padTo - head.length))])
}

const JPEG = withHeader([0xff, 0xd8, 0xff, 0xe0])
const PNG = withHeader([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const GIF = withHeader('GIF89a')
const WEBP = withHeader('RIFF\x00\x00\x00\x00WEBP')
const AVIF = withHeader('\x00\x00\x00\x20ftypavif')

describe('isImageBuffer', () => {
  it('recognises every format the pipeline uploads, from the bytes alone', () => {
    // Filename deliberately useless — the bytes have to carry it.
    for (const [format, buf] of Object.entries({ JPEG, PNG, GIF, WEBP, AVIF })) {
      expect(isImageBuffer(buf, 'no-extension'), `${format} not recognised`).toBe(true)
    }
  })

  /**
   * The regression this function exists for. WordPress serves this upload with
   * a **bare trailing dot** and no extension; the old extension-only test made
   * it a `file-…` asset, which `@sanity/image-url` rejects — surfacing months
   * later as `Malformed asset _ref` during prerender and taking the build down.
   */
  it('uploads an extensionless WordPress image as an image (#32)', () => {
    expect(isImageBuffer(WEBP, 'img_6328a6474b86e.')).toBe(true)
  })

  it('treats a real document as a file, not an image', () => {
    const pdf = withHeader('%PDF-1.7')
    expect(isImageBuffer(pdf, 'whitepaper.pdf')).toBe(false)
  })

  describe('SVG, which has no magic number', () => {
    it('finds the element after a declaration or a comment', () => {
      const declared = Buffer.from('<?xml version="1.0"?>\n<!-- drawn --><svg viewBox="0 0 1 1">')
      expect(isImageBuffer(declared, 'mark')).toBe(true)
    })

    it('does not call every XML document an image', () => {
      const feed = Buffer.from('<?xml version="1.0"?><rss version="2.0"><channel/></rss>')
      expect(isImageBuffer(feed, 'feed.xml')).toBe(false)
    })
  })

  it('falls back to the extension when the bytes say nothing', () => {
    const unknown = withHeader([0x00, 0x01, 0x02, 0x03])
    expect(isImageBuffer(unknown, 'mystery.png')).toBe(true)
    expect(isImageBuffer(unknown, 'mystery.bin')).toBe(false)
  })

  it('does not read past the end of a very short buffer', () => {
    expect(() => isImageBuffer(Buffer.from([0xff]), 'tiny')).not.toThrow()
    expect(isImageBuffer(Buffer.alloc(0), 'empty.jpg')).toBe(true)
  })
})

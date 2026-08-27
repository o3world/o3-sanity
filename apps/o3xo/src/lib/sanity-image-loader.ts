import type { ImageLoaderProps } from 'next/image'

/**
 * The source's own pixel width, so the loader never asks for more of an image
 * than exists.
 *
 * Sanity names an asset after its dimensions (`<hash>-1240x600.png`), and a
 * URL carrying a crop rectangle has already narrowed that — `rect` is
 * `x,y,w,h` in source pixels, so its third value is what the transform has to
 * work with.
 *
 * Returns null for a path that names no dimensions, which is the one case
 * where the requested width has to be taken on trust.
 */
function sourceWidth(url: URL): number | null {
  const rect = url.searchParams.get('rect')
  if (rect) {
    const width = Number(rect.split(',')[2])
    if (Number.isFinite(width) && width > 0) return width
  }
  const named = /-(\d+)x\d+\.[a-z0-9]+$/i.exec(url.pathname)
  return named ? Number(named[1]) : null
}

/**
 * Global next/image loader (next.config.ts → images.loaderFile).
 *
 * Sanity's image CDN already resizes and format-negotiates for free, so
 * routing its files through Vercel's optimizer would pay per transformation
 * for work the source CDN does anyway. This loader rewrites the URL the
 * builder produced to the width next/image asks for, and the browser fetches
 * cdn.sanity.io directly — Vercel never touches the image.
 *
 * `urlForImage` (packages/sanity/src/image.ts) is the only producer of these
 * URLs, and it always sets `auto=format` and `fit=max`; the defaults here
 * only cover a URL built some other way. When the builder set both `w` and
 * `h` (a ratio crop), the height is rescaled so the requested width keeps the
 * crop's shape — `rect` is in source pixels and survives rescaling untouched.
 *
 * **The width is clamped to the source.** next/image builds a srcset from
 * `deviceSizes`, which runs to 3840, so a 1240px-wide asset is asked for at
 * 2048, 2400 and 3840 as well — three more CDN variants, three more cached
 * objects and three more billed requests for one picture that has no more
 * detail to give. `fit=max` already refuses to upscale, so those responses
 * carry the same bytes under different URLs; clamping collapses them onto the
 * one the CDN can actually serve. It also fixes an outright failure:
 * `?w=2400&fit=max&auto=format` on a 1240px source answers 404, which is what
 * emptied one card of the Keep-reading band 630 times in a week.
 */
export default function sanityImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // A relative src is a local asset, which nothing renders today; hand it
  // back untouched rather than throw in `new URL`.
  if (src.startsWith('/')) return src

  const url = new URL(src)
  if (url.hostname !== 'cdn.sanity.io') return src

  const source = sourceWidth(url)
  const requested = source ? Math.min(width, source) : width

  const w = url.searchParams.get('w')
  const h = url.searchParams.get('h')
  if (w && h) {
    url.searchParams.set('h', String(Math.round((Number(h) / Number(w)) * requested)))
  }
  url.searchParams.set('w', String(requested))
  if (!url.searchParams.has('auto')) url.searchParams.set('auto', 'format')
  if (!url.searchParams.has('fit')) url.searchParams.set('fit', 'max')
  if (quality) url.searchParams.set('q', String(quality))
  return url.toString()
}

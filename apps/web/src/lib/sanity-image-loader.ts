import type { ImageLoaderProps } from 'next/image'

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
 */
export default function sanityImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // A relative src is a local asset, which nothing renders today; hand it
  // back untouched rather than throw in `new URL`.
  if (src.startsWith('/')) return src

  const url = new URL(src)
  if (url.hostname !== 'cdn.sanity.io') return src

  const w = url.searchParams.get('w')
  const h = url.searchParams.get('h')
  if (w && h) {
    url.searchParams.set('h', String(Math.round((Number(h) / Number(w)) * width)))
  }
  url.searchParams.set('w', String(width))
  if (!url.searchParams.has('auto')) url.searchParams.set('auto', 'format')
  if (!url.searchParams.has('fit')) url.searchParams.set('fit', 'max')
  if (quality) url.searchParams.set('q', String(quality))
  return url.toString()
}

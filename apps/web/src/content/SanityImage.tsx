/* eslint-disable no-restricted-imports -- this is the one sanctioned wrapper
 * over next/image + the low-level image helpers; every other content
 * component renders Sanity images through it (see the boundary rule in the
 * root eslint config). */
import Image from 'next/image'
import { stegaClean } from '@sanity/client/stega'

import { cn } from '@o3/ui/lib/utils'
import {
  imageDimensions,
  imageHotspot,
  isRenderableImage,
  isVectorImage,
  rawImageUrl,
  urlForImage,
  type SanityImageSource,
} from '@o3/sanity/image'

/**
 * Generated image fields are looser than `SanityImageSource` (asset is
 * optional), so accept the loose shape and guard at runtime.
 */
type LooseImageSource = SanityImageSource | { asset?: unknown }

/**
 * The ratio boxes an image can be asked to fill. Values are written out as
 * static Tailwind classes because the scanner cannot see a class built from
 * a variable — never interpolate the key into `aspect-[…]`.
 */
const RATIO_CLASS = {
  '1/1': 'aspect-square',
  '4/3': 'aspect-4/3',
  '3/2': 'aspect-3/2',
  '16/9': 'aspect-video',
  '21/9': 'aspect-21/9',
  '3/4': 'aspect-3/4',
  '4/5': 'aspect-4/5',
  '9/16': 'aspect-9/16',
} as const

export type ImageRatio = keyof typeof RATIO_CLASS

/**
 * How the image is shaped:
 *
 * - `'original'` — the image's own shape, nothing cropped away (the default).
 * - a ratio — a box of exactly that shape.
 * - `'fill'` — the parent element is the box; use it when the surrounding
 *   layout (a stretched grid cell, a fixed-height rail) decides the shape.
 */
export type ImageBox = 'original' | ImageRatio | 'fill'

export interface SanityImageProps {
  source: LooseImageSource | null | undefined
  alt?: string | null
  /** Box shape. Defaults to `'original'` — the whole image, uncropped. */
  ratio?: ImageBox
  /**
   * How the image sits inside a box: `'crop'` (default) fills it and trims
   * the overflow around the hotspot; `'contain'` fits the whole image inside
   * it, letterboxed. Ignored when `ratio` is `'original'` — an original is by
   * definition never trimmed.
   */
  fit?: 'crop' | 'contain'
  /** Requested CDN width. Also the intrinsic width when `ratio` is `'original'`. */
  width?: number
  sizes?: string
  priority?: boolean
  /**
   * Styles the outermost element this renders: the `<img>` for an original,
   * the ratio box for every other `ratio`.
   */
  className?: string
}

/** Shape for an image whose asset id doesn't carry dimensions (never, in practice). */
const FALLBACK_ASPECT = 3 / 2

function ratioValue(ratio: ImageRatio): number {
  const [width, height] = ratio.split('/')
  return Number(width) / Number(height)
}

/**
 * The single next/image wrapper for Sanity-hosted images. It owns three
 * things content components should never re-decide:
 *
 * - **Shape.** `ratio` picks between the image's own proportions and a box;
 *   `fit` picks between cropping into that box and fitting inside it.
 * - **Cropping.** A ratio box is cut on the CDN, so the crop respects the
 *   editor's crop rectangle and hotspot instead of trimming blindly from the
 *   edges. `'fill'` can't (the ratio isn't known until layout), so it steers
 *   `object-position` by the hotspot instead.
 * - **Absence.** An empty or unset image field renders `null`, so callers
 *   don't need their own guards — as does an image field whose asset is not a
 *   renderable image, which would otherwise throw and fail the build (#32).
 */
export function SanityImage({
  source,
  alt,
  ratio = 'original',
  fit = 'crop',
  width = 1600,
  sizes,
  priority,
  className,
}: SanityImageProps) {
  if (!source) return null
  if (typeof source === 'object' && 'asset' in source && !source.asset) return null
  // An image field holding a non-image asset throws inside the URL builder
  // rather than degrading, which fails the whole prerender. Drop the image
  // instead; `pnpm --filter @o3/migration verify` is what reports the bad data.
  if (!isRenderableImage(source)) return null
  const image = source as SanityImageSource
  // `alt` is an attribute, not rendered text — stega's zero-width payload is
  // announced verbatim by a screen reader there, so strip it (same reasoning
  // as the `aria-label` in InFlightSection's rows).
  const cleanAlt = stegaClean(alt) ?? ''

  // A vector never goes through the optimiser. `next/image` rasterises it at a
  // fixed width, which discards the resolution independence that made it a
  // vector and — for the engagement diagrams, whose keyframes live inside the
  // file — freezes the animation on frame one. So this branch hands the browser
  // the uploaded file and lets CSS size it.
  //
  // The CDN cannot crop a vector either, so a ratio box is honoured with
  // `object-fit` rather than a server-side rect. That loses hotspot-aware
  // cropping, which is the trade a vector asset makes by being one.
  if (isVectorImage(image)) {
    const src = rawImageUrl(image)
    if (!src) return null
    const dimensions = imageDimensions(image)
    const img = (
      // eslint-disable-next-line @next/next/no-img-element -- bypassing next/image is this branch's whole purpose; see above.
      <img
        src={src}
        alt={cleanAlt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...(ratio === 'original'
          ? { width: dimensions?.width, height: dimensions?.height, className }
          : {
              className: cn('h-full w-full', fit === 'crop' ? 'object-cover' : 'object-contain'),
            })}
      />
    )
    if (ratio === 'original') return img
    return (
      <div
        className={cn(
          'relative overflow-hidden',
          ratio === 'fill' ? 'h-full w-full' : RATIO_CLASS[ratio],
          className,
        )}
      >
        {img}
      </div>
    )
  }

  // Original: intrinsic layout at the image's real shape. The dimensions come
  // from the asset id, so a portrait image lays out as a portrait — a guessed
  // height here is what makes an image look cropped when nothing cropped it.
  if (ratio === 'original') {
    const aspectRatio = imageDimensions(image)?.aspectRatio ?? FALLBACK_ASPECT
    return (
      <Image
        src={urlForImage(image).width(width).url()}
        alt={cleanAlt}
        width={width}
        height={Math.round(width / aspectRatio)}
        sizes={sizes}
        priority={priority}
        className={className}
      />
    )
  }

  const cropped = fit === 'crop'
  let url = urlForImage(image).width(width)
  // Both dimensions + fit=crop is what makes @sanity/image-url compute a
  // hotspot-aware rect; passing an explicit `crop()` mode would switch that
  // off, so don't.
  if (cropped && ratio !== 'fill')
    url = url.height(Math.round(width / ratioValue(ratio))).fit('crop')
  const hotspot = cropped && ratio === 'fill' ? imageHotspot(image) : null

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        ratio === 'fill' ? 'h-full w-full' : RATIO_CLASS[ratio],
        className,
      )}
    >
      <Image
        src={url.url()}
        alt={cleanAlt}
        fill
        sizes={sizes ?? '100vw'}
        priority={priority}
        className={cropped ? 'object-cover' : 'object-contain'}
        style={hotspot ? { objectPosition: `${hotspot.x * 100}% ${hotspot.y * 100}%` } : undefined}
      />
    </div>
  )
}

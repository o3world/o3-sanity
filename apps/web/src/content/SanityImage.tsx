/* eslint-disable no-restricted-imports -- this is the one sanctioned wrapper
 * over next/image + the low-level image helpers; every other content
 * component renders Sanity images through it (see the boundary rule in the
 * root eslint config). */
import Image from 'next/image'

import { urlForImage, type SanityImageSource } from '@o3/sanity/image'

/**
 * Generated image fields are looser than `SanityImageSource` (asset is
 * optional), so accept the loose shape and guard at runtime.
 */
type LooseImageSource = SanityImageSource | { asset?: unknown }

export interface SanityImageProps {
  source: LooseImageSource | null | undefined
  alt?: string | null
  /** Requested CDN width (also the intrinsic width unless `fill`). */
  width?: number
  height?: number
  fill?: boolean
  sizes?: string
  priority?: boolean
  className?: string
}

/**
 * The single next/image wrapper for Sanity-hosted images: routes the source
 * through `urlForImage` (hotspot/crop-aware CDN URLs, auto format) and
 * degrades to `null` for empty/unset image fields so callers don't need
 * their own guards.
 */
export function SanityImage({
  source,
  alt,
  width = 1600,
  height,
  fill = false,
  sizes,
  priority,
  className,
}: SanityImageProps) {
  if (!source) return null
  if (typeof source === 'object' && 'asset' in source && !source.asset) return null

  let builder = urlForImage(source as SanityImageSource).width(width)
  if (height) builder = builder.height(height)
  const src = builder.url()

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt ?? ''}
        fill
        sizes={sizes}
        priority={priority}
        className={className}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt ?? ''}
      width={width}
      height={height ?? Math.round((width * 2) / 3)}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  )
}

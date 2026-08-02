/* eslint-disable no-restricted-imports -- the mask needs a raw CDN URL, not an
 * <img>; SanityImage cannot express a CSS mask. This is the second sanctioned
 * use of the low-level image helpers, alongside SanityImage itself. */
import { isRenderableImage, urlForImage, type SanityImageSource } from '@o3/sanity/image'

import { cn } from '@o3/ui/lib/utils'

interface LogoKnockoutProps {
  source: unknown
  /** Accessible name — the client's own name. Empty renders it decorative. */
  alt?: string | null
  /** Rendered width in px; the frame's card logos are 185 wide. */
  width?: number
  /** Rendered height in px. The frame sizes each logo to its own artwork. */
  height?: number
  className?: string
}

/**
 * A client logo rendered as a solid **white silhouette**.
 *
 * Figma draws this as a "Mask group" (`1883:3556`): a white rectangle clipped
 * by the logo bitmap, so whatever colours the artwork carries, the card shows
 * one flat white shape. Every logo on the case-study cards is treated this
 * way — a full-colour logo dropped straight onto the scrim reads as a foreign
 * object, which is the point of the knockout.
 *
 * Reproduced with a CSS mask rather than an `<img>`, because that is the same
 * operation: the element supplies the fill, the artwork supplies the shape.
 * The mask needs a bare CDN URL, so this is one of the two places allowed to
 * reach past `SanityImage`.
 */
export function LogoKnockout({ source, alt, width = 185, height, className }: LogoKnockoutProps) {
  if (!source) return null
  if (typeof source === 'object' && 'asset' in source && !(source as { asset?: unknown }).asset) {
    return null
  }
  // Same guard SanityImage carries: a non-image asset throws inside the URL
  // builder and takes the whole prerender with it (#32).
  if (!isRenderableImage(source)) return null

  const url = urlForImage(source as SanityImageSource)
    .width(width * 2)
    .url()

  return (
    <span
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn('block bg-white', className)}
      style={{
        width,
        height,
        maskImage: `url(${url})`,
        WebkitMaskImage: `url(${url})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskPosition: 'left center',
        WebkitMaskPosition: 'left center',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }}
    />
  )
}

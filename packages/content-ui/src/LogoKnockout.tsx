/* eslint-disable no-restricted-imports -- the knockout sizes and filters its
 * own <img>, which SanityImage's box model cannot express. This is the second
 * sanctioned use of the low-level image helpers, alongside SanityImage
 * itself. */
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
 * Drawn as an `<img>`, whose own alpha is the shape, with `brightness-0
 * invert` flattening every colour in the artwork to white. **Not a CSS mask**,
 * which is the same drawing and the wrong fetch: a mask image is loaded in
 * CORS mode, so the browser sends an `Origin` header, `cdn.sanity.io` answers
 * 403 for any origin the Sanity project has not registered, and the logo fails
 * to load — permanently, on every Storybook port and every unregistered dev
 * host (#233). An `<img>` has no such check to fail.
 *
 * The box is this component's, not `SanityImage`'s: the caller gives a width
 * and a height in px and the artwork fits inside them flush left, which is
 * neither an intrinsic image nor one of the ratio boxes that wrapper offers.
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
    // The caller's className lands on the box rather than the artwork, because
    // what it carries is the drop shadow — and a filter on the <img> itself
    // would replace the whitening one rather than compose with it.
    <span className={cn('block', className)} style={{ width, height }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image
          rewrites the src through the optimiser, and the knockout wants the
          uploaded artwork; same trade SanityImage's vector branch makes. */}
      <img
        src={url}
        alt={alt || ''}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain object-left brightness-0 invert"
      />
    </span>
  )
}

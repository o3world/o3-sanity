/* eslint-disable @next/next/no-img-element -- a plain <img> is the entire
 * point of this file: it stands in FOR next/image so the render layer does not
 * need Next's build-time image config. Nothing here ships to a browser. */

import type { CSSProperties } from 'react'

/**
 * Stands in for `next/image` in the `render` test layer — a plain <img> that
 * keeps `src`/`alt` assertable. See the note in vitest.config.ts for why the
 * real component is not used.
 */
interface StubImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  sizes?: string
  priority?: boolean
  className?: string
  style?: CSSProperties
}

export default function Image({
  src,
  alt,
  width,
  height,
  sizes,
  priority,
  className,
  style,
}: StubImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      // next/image's own rule, mirrored so "exactly one image on this route is
      // preloaded" is assertable from the markup rather than from the prop
      // (#268): a lazy image carries `loading="lazy"`, and a priority image
      // carries no `loading` at all — Next expresses its urgency as a hoisted
      // `<link rel="preload">`, which the render layer has no DOM to receive.
      loading={priority ? undefined : 'lazy'}
      className={className}
      style={style}
    />
  )
}

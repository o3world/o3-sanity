import type { CSSProperties } from 'react'

/**
 * Stands in for `next/image` in the `render` test layer — a plain <img> that
 * keeps `src`/`alt` assertable. See the note in `../project.ts` for why the
 * real component is not used.
 *
 * A plain `<img>` is the entire point: this file stands in FOR next/image so
 * the layer needs no build-time image config, and nothing here ships to a
 * browser. `@next/next/no-img-element` would forbid it, which is one reason
 * the Next plugin is not registered over this package.
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

import createImageUrlBuilder from '@sanity/image-url'
import { clientConfig } from './client'

export type SanityImageSource = Parameters<ReturnType<typeof createImageUrlBuilder>['image']>[0]

const builder = createImageUrlBuilder({
  projectId: clientConfig.projectId,
  dataset: clientConfig.dataset,
})

export function urlForImage(source: SanityImageSource) {
  return builder.image(source).auto('format').fit('max')
}

/**
 * Every Sanity image asset id ends `-<width>x<height>-<ext>`, so the source
 * document carries its own pixel dimensions — no asset fetch needed.
 */
const ASSET_DIMENSIONS = /-(\d+)x(\d+)-[a-z]+$/i

/** The subset of an image field this module reads. */
interface ImageFieldLike {
  asset?: unknown
  _ref?: unknown
  _id?: unknown
  crop?: { top?: number; bottom?: number; left?: number; right?: number } | null
  hotspot?: { x?: number; y?: number } | null
}

function asRecord(value: unknown): ImageFieldLike | null {
  return value && typeof value === 'object' ? (value as ImageFieldLike) : null
}

/** The asset id, wherever it hides: a bare string, `_ref`, `_id`, or nested under `asset`. */
function assetId(source: unknown, depth = 0): string | null {
  if (typeof source === 'string') return source
  const image = asRecord(source)
  if (!image || depth > 2) return null
  if (typeof image._ref === 'string') return image._ref
  if (typeof image._id === 'string') return image._id
  return assetId(image.asset, depth + 1)
}

export interface ImageDimensions {
  /** Delivered width in pixels — the asset's, minus any crop the editor set. */
  width: number
  /** Delivered height in pixels. */
  height: number
  /** `width / height` — the shape the image renders at when nothing crops it. */
  aspectRatio: number
}

/**
 * What the CDN will actually hand back for an unconstrained request: the
 * asset's own dimensions narrowed by the editor's crop rectangle (the URL
 * builder applies that crop whenever only a width is specified).
 *
 * Returns `null` for a source with no parseable asset id, which is the signal
 * to fall back rather than to render a wrong intrinsic size.
 */
export function imageDimensions(source: unknown): ImageDimensions | null {
  const id = assetId(source)
  const match = id ? ASSET_DIMENSIONS.exec(id) : null
  if (!match) return null

  const assetWidth = Number(match[1])
  const assetHeight = Number(match[2])
  if (!assetWidth || !assetHeight) return null

  const crop = asRecord(source)?.crop
  const width = Math.round(assetWidth * (1 - (crop?.left ?? 0) - (crop?.right ?? 0)))
  const height = Math.round(assetHeight * (1 - (crop?.top ?? 0) - (crop?.bottom ?? 0)))
  if (width <= 0 || height <= 0) return null

  return { width, height, aspectRatio: width / height }
}

/**
 * The editor's hotspot as fractions of the image, for the one case the URL
 * builder can't serve: a CSS-cropped box whose ratio isn't known at build
 * time. `null` when the image has no hotspot — the centre is the browser's
 * own default, so there's nothing to emit.
 */
export function imageHotspot(source: unknown): { x: number; y: number } | null {
  const hotspot = asRecord(source)?.hotspot
  if (!hotspot || typeof hotspot.x !== 'number' || typeof hotspot.y !== 'number') return null
  return { x: hotspot.x, y: hotspot.y }
}

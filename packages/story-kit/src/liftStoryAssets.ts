/**
 * Commit shape → query-projected render shape, for catalog-driven stories.
 * ONE visible transform: every `{_type:'image', asset:{_ref}}` node becomes
 * the dereferenced asset object the GROQ `asset->` projection would return.
 * Dimensions parse from the ref string (`…-<w>x<h>-<ext>`) — true for real
 * seeded refs AND fake-fixture refs authored to that grammar. v1 lifts images
 * ONLY; document-reference projections are NOT lifted (extension point: add a
 * lifter here per projection kind).
 */

export const DUMMY_LQIP =
  'data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAFAAgDASIAAhEBAxEB'

const REF_DIMENSIONS = /-(\d+)x(\d+)-(\w+)$/

type UnknownRecord = Record<string, unknown>

function isImageRefNode(v: unknown): v is UnknownRecord & { asset: { _ref: string } } {
  if (typeof v !== 'object' || v === null) return false
  const node = v as UnknownRecord
  if (node._type !== 'image') return false
  const asset = node.asset as UnknownRecord | undefined
  return typeof asset?._ref === 'string'
}

function liftImage(node: UnknownRecord & { asset: { _ref: string } }): UnknownRecord {
  const ref = node.asset._ref
  const match = REF_DIMENSIONS.exec(ref)
  if (!match) {
    throw new Error(
      `liftStoryAssets: cannot parse dimensions from asset ref "${ref}" — ` +
        `refs must end in -<width>x<height>-<ext>.`,
    )
  }
  const width = Number(match[1])
  const height = Number(match[2])
  return {
    ...node,
    asset: {
      _id: ref,
      url: `https://picsum.photos/seed/${ref}/${width}/${height}`,
      metadata: {
        lqip: DUMMY_LQIP,
        dimensions: {
          _type: 'sanity.imageDimensions',
          width,
          height,
          aspectRatio: width / height,
        },
      },
    },
  }
}

function walk(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(walk)
  if (typeof value !== 'object' || value === null) return value
  if (isImageRefNode(value)) return liftImage(value)
  return Object.fromEntries(Object.entries(value as UnknownRecord).map(([k, v]) => [k, walk(v)]))
}

/** Immutable: returns a lifted copy; the input is never mutated. */
export function liftStoryAssets<T extends Record<string, unknown>>(value: T): T {
  return walk(value) as T
}

/** Provenance for a fixture pulled from a real dataset document. */
export interface DocumentFixtureSource {
  kind: 'document'
  documentId: string
  documentType: string
  urn: string
  liveUrl?: string
  /** Array path within the source document, e.g. 'sections[8]'. */
  path?: string
  dataset: string
  pulledAt: string
}

/** Provenance for the schema-declared placeholder fixture (packages/sanity placeholders registry). */
export interface PlaceholderFixtureSource {
  kind: 'placeholder'
  /** Sanity `_type` the placeholder is declared for. */
  schemaType: string
  /** Repo-relative path to the registry the placeholder was read from. */
  registry: string
  pulledAt: string
}

/** Provenance for a generated fixture — either a dataset document or the schema placeholder. */
export type FixtureSource = DocumentFixtureSource | PlaceholderFixtureSource

/** Hand-authored fixture — synthetic states the dataset can't produce. */
export interface NamedFixture<T> {
  name: string
  data: T
}

/** Fixture carrying dataset/placeholder provenance. */
export interface GeneratedFixture<T> extends NamedFixture<T> {
  source: FixtureSource
}

export type AnyFixture<T> = NamedFixture<T> | GeneratedFixture<T>

export function isGenerated<T>(fixture: AnyFixture<T>): fixture is GeneratedFixture<T> {
  return 'source' in fixture
}

/** Committed `<Name>.fixtures.generated.ts` module shape — a schema-meta snapshot + fixtures. */
export interface BlockFixtureModule<T> {
  /** Sanity _type this module snapshots. */
  type: string
  /** The schema's variant→story contract ([] when the block declares no variants). */
  variantStories: readonly { value: string; story: string }[]
  /** placeholder-tier fixture first (when the schema declares one), then document-tier pulls. */
  fixtures: readonly GeneratedFixture<T>[]
}

/** Strip Sanity system fields to match the registry's BlockComponentSlot prop
 *  contract (Omit<…, '_key' | '_type' | 'scheduling'>). The omitted trio here
 *  mirrors the TYPE contract block components are written against, not the
 *  dispatch spread. */
export function toProps<T extends object>(data: T): Omit<T, '_type' | '_key' | 'scheduling'> {
  const { _type, _key, scheduling, ...rest } = data as T & {
    _type?: unknown
    _key?: unknown
    scheduling?: unknown
  }
  void _type
  void _key
  void scheduling
  return rest as Omit<T, '_type' | '_key' | 'scheduling'>
}

// ---------------------------------------------------------------------------
// Catalog contract — STRUCTURAL mirrors of @o3/sanity's catalog types.
// story-kit must not depend on @o3/sanity (workspace cycle), so the contract
// is duck-typed here and TS validates compatibility at the stories-file call
// site, where both sides meet. The applier travels the same way: stories pass
// their `applyPresetPatches` into defineBlockStories.
// ---------------------------------------------------------------------------

export type PresetPatchLike =
  | { op: 'set'; path: string[]; value: unknown }
  | { op: 'unset'; path: string[] }

export interface CatalogPresetLike {
  name: string
  title: string
  /** Storybook export name for the preset story. */
  story: string
  patches: readonly PresetPatchLike[]
}

export interface CatalogVariantLike {
  value: string
  title: string
  /** Schema-declared Storybook export name (variant-story-parity contract). */
  story: string
}

export interface CatalogLike {
  type: string
  placeholder: Record<string, unknown>
  storyPlaceholder: Record<string, unknown>
  presets: readonly CatalogPresetLike[]
  variants: readonly CatalogVariantLike[]
}

export type ApplyPatchesFn = (
  value: Record<string, unknown>,
  patches: readonly PresetPatchLike[],
) => Record<string, unknown>

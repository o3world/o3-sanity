// The subpath, never the package root (#269). Every block renderer reaches
// this module, and the root export is the same barrel the Presentation overlay
// comes out of — ~640KB of @sanity/ui, styled-components and comlink that a
// published page has no use for. Turbopack does shake that barrel down to this
// one function today; the subpath is the version that does not depend on it,
// and it resolves to @sanity/visual-editing-csm, which is string building.
import { createDataAttribute } from '@sanity/visual-editing/create-data-attribute'

// A location in a Sanity document: the document identity plus a GROQ path
// into the content tree. Passing this down the render chain lets a wrapper
// element stamp a `data-sanity` attribute that Presentation can resolve back
// to the exact field (or array item) it represents.
export interface SanityLoc {
  id: string
  type: string
  path: string
}

// Defense-in-depth: Sanity-generated `_key` values are random
// `[A-Za-z0-9_-]{12}`, but `key` is a `string` from a typed React tree and
// nothing in the type system stops a caller from passing tainted data. A
// `_key` containing a `"` or `]` would break out of the GROQ string and
// inject path syntax into the Visual Editing resolver.
const SAFE_KEY = /^[A-Za-z0-9_-]+$/

function assertSafeKey(key: string): void {
  if (!SAFE_KEY.test(key)) {
    throw new Error(`Unsafe _key for data-sanity path: ${JSON.stringify(key)}`)
  }
}

// The same argument one segment up. Field names are literals at every call
// site today, but they are `string` parameters and the cost of saying so is
// four lines.
const SAFE_FIELD = /^[A-Za-z_][A-Za-z0-9_]*$/

function assertSafeField(field: string): void {
  if (!SAFE_FIELD.test(field)) {
    throw new Error(`Unsafe field for data-sanity path: ${JSON.stringify(field)}`)
  }
}

// The embedded Studio lives at `/studio`; `createDataAttribute` defaults
// `baseUrl` to `/`, which would 404 Presentation's "Open in Studio" links.
const STUDIO_BASE_URL = '/studio'

export function dataAttr(loc: SanityLoc): string {
  return createDataAttribute({ baseUrl: STUDIO_BASE_URL, ...loc }).toString()
}

/**
 * A document reference the builders below hang a path off. A `SanityLoc`
 * satisfies it structurally, which is what lets a location compose: pass the
 * parent location as the document and its own `path` as the parent path.
 */
type DocRef = { id: string; type: string }

/**
 * Build a location for a named field under `parentPath` — `''` for a field on
 * the document itself, a block's own path for a field on that block.
 *
 * Paths are built by **composition** and never by inspecting a segment name.
 * That is the whole answer to the trap vtx-web's overlay resolver hit: a
 * portable-text field is also called `content`, so a path can carry several
 * prefixes that look like block roots without being one. A builder that only
 * ever appends cannot get that wrong, and `layoutSection` — which nests blocks
 * inside blocks — needs it to stay that way.
 */
export function fieldLoc(doc: DocRef, parentPath: string, field: string): SanityLoc {
  assertSafeField(field)
  return { id: doc.id, type: doc.type, path: parentPath ? `${parentPath}.${field}` : field }
}

/**
 * Build a location for a keyed item in the array at `arrayPath` — the array's
 * full path, so this composes at any depth (`sections[_key=="a"].panels`).
 */
export function arrayItemLoc(doc: DocRef, arrayPath: string, key: string): SanityLoc {
  assertSafeKey(key)
  return { id: doc.id, type: doc.type, path: `${arrayPath}[_key=="${key}"]` }
}

// Build a location for a named top-level field, e.g. the page's `sections`
// array itself (the container element Presentation treats as reorderable).
export function rootFieldLoc(doc: DocRef, field: string): SanityLoc {
  return fieldLoc(doc, '', field)
}

/**
 * The two block-facing builders: the `data-sanity` value for a field or a
 * keyed array item **under a block's own location**, or `undefined` when
 * there is no location to build from.
 *
 * A block renders in three places — a document view, a Storybook story, a
 * render test — and only the first has a document behind it. Tolerating an
 * absent `loc` here is what keeps that guard out of every call site; React
 * drops an attribute whose value is `undefined`.
 */
export function fieldAttr(loc: SanityLoc | undefined, field: string): string | undefined {
  return loc ? dataAttr(fieldLoc(loc, loc.path, field)) : undefined
}

export function itemAttr(
  loc: SanityLoc | undefined,
  arrayField: string,
  key: string | undefined,
): string | undefined {
  if (!loc || !key) return undefined
  const array = fieldLoc(loc, loc.path, arrayField)
  return dataAttr(arrayItemLoc(array, array.path, key))
}

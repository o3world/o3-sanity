import { createDataAttribute } from '@sanity/visual-editing'

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

// The embedded Studio lives at `/studio`; `createDataAttribute` defaults
// `baseUrl` to `/`, which would 404 Presentation's "Open in Studio" links.
const STUDIO_BASE_URL = '/studio'

export function dataAttr(loc: SanityLoc): string {
  return createDataAttribute({ baseUrl: STUDIO_BASE_URL, ...loc }).toString()
}

// Build a location for an item inside a top-level document array, e.g.
// `sections[_key=="abc"]` under a page document.
export function rootArrayItemLoc(
  doc: { id: string; type: string },
  arrayField: string,
  key: string,
): SanityLoc {
  assertSafeKey(key)
  return { id: doc.id, type: doc.type, path: `${arrayField}[_key=="${key}"]` }
}

// Build a location for a named top-level field, e.g. the page's `sections`
// array itself (the container element Presentation treats as reorderable).
export function rootFieldLoc(doc: { id: string; type: string }, field: string): SanityLoc {
  return { id: doc.id, type: doc.type, path: field }
}

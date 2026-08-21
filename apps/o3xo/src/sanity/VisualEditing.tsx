'use client'

import dynamic from 'next/dynamic'

/**
 * The one VisualEditing mount for the site (issue #15), and the seam that
 * keeps the overlay it mounts out of a published page's JavaScript (#269).
 *
 * **A draft-only client component may not be imported by a server component.**
 * Turbopack gives a route one eager chunk group and puts every client entry of
 * that route in it, so a `'use client'` module a server component imports is
 * downloaded by every visitor whether or not it renders — `{isDraft ? … }` in
 * the layout gates the render, not the download. `next/dynamic` does not undo
 * that: called from a server component it still registers a client entry.
 * Called from a client component, as here, the target is an ordinary module in
 * the client graph and Turbopack splits it.
 *
 * So this file is the whole boundary: a client component thin enough to cost
 * nothing, holding the only reference to `PresentationOverlay`. Everything the
 * overlay drags in — `@sanity/visual-editing`, `@sanity/ui`,
 * styled-components, comlink, ~640KB uncompressed — loads when an editor opens
 * Presentation and never otherwise.
 *
 * `ssr: false` would be wrong: draft mode server-renders this branch, and the
 * overlay expects to hydrate with the page.
 */
const PresentationOverlay = dynamic(() =>
  import('./PresentationOverlay').then((m) => m.PresentationOverlay),
)

export function VisualEditing() {
  return <PresentationOverlay />
}

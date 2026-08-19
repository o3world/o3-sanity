# @o3/content-ui

What a Sanity document looks like: the section and base block renderers, the
site chrome, the cards, and the support layer all three are built from
(`SanityImage`, `ButtonLink`, portable text, the surface and decoration
resolvers).

Nothing here reads a block registry. An app imports these and binds them
itself, which is the seam [ADR 0028](../../docs/adr/0028-o3xo-is-a-second-app-in-the-monorepo.md)
needs: a second brand re-binds one block type to its own component without
forking the other fifteen. `@o3/content-runtime` is the other half — the route
builders and the dispatch loop that call into these.

## Exports

| Subpath           | What it is                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `.`               | every section and base renderer, the base bindings, and the renderer support layer                          |
| `./chrome`        | `SiteNav`, `UtilityNav`, `SiteFooter`, `MobileNavMenu`, `NavInk` — authored entirely in Site Settings       |
| `./cards`         | `getCard`, `CARD_PROJECTIONS`, and the four card components; client-safe, because section blocks render one |
| `./portable-text` | `PortableTextBody` — a separate entry because it pulls `@portabletext/react`                                |
| `./format-date`   | the two date formats an insight shows                                                                       |
| `./testing`       | `classTokens` and the 402 assertions (ADR 0006), plus the seed projections the render layer shares          |
| `./testing/seed`  | the committed seed tree projected for the browser — what the block stories and the page mockups render      |

## The app owns the binding

`clientComponents.ts`, `registry.ts` and the three dispatchers
(`Blocks`, `BlockRenderer`, `ClientBlockRenderer`) stay in the app, closed by
the `satisfies` clause that checks the app's own roster. That is deliberate:
a block type this app does not have must not force a renderer into it, and a
renderer this app draws differently is one changed line in its bindings list.

The **base** bindings are the exception and ship from here. `LayoutSection`
dispatches base blocks itself, so the base tier is the inline vocabulary a
section renderer draws with rather than a per-app roster.

## Two boundaries this package carries

Both moved here with the components (#212), and both are path-scoped in
`eslint.config.mjs` — a rule pointed at a directory goes quiet the moment the
directory moves, and it goes quiet silently.

- **Images** go through `SanityImage`, never raw `next/image` or
  `@o3/sanity/image`. The wrapper owns hotspot, crop and the CDN params.
- **Fetching** goes through `sanityFetch` from `@o3/content-runtime/live`. A
  bare client serves stale published content inside Presentation.

Import `stegaClean` from `@sanity/client/stega`, never the `next-sanity`
barrel: the barrel drags in `@portabletext/react`, whose `react/compiler-runtime`
import breaks every story for the block that reaches it (ADR 0004).

## Stories are the tests

One story set, moved with the components, globbed from
`packages/story-kit`'s `SHARED_STORY_ROOTS` and run in real Chromium by the
`stories` layer. Both Storybook hosts serve it — the O3 one under O3's paint,
the O3XO one under O3XO's — and the Brand toolbar flips either to the other,
which is what makes a hardcoded brand colour here visible the day it lands.

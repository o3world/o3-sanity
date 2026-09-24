# @o3/content-ui

What a Sanity document looks like: the section and base block renderers, the
site chrome, the cards, and the support layer all three are built from
(`SanityImage`, `ButtonLink`, portable text, the surface and decoration
resolvers).

Nothing here reads a block registry. `apps/web` imports these and binds them
itself. `@o3/content-runtime` is the other half — the route
builders and the dispatch loop that call into these.

## Exports

| Subpath           | What it is                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `.`               | every section and base renderer, the base bindings, and the renderer support layer                     |
| `./chrome`        | `SiteNav`, `UtilityNav`, `SiteFooter`, `MobileNavMenu`, `NavInk` — authored entirely in Site Settings  |
| `./cards`         | `getCard`, `CARD_PROJECTIONS` and the three cards; client-safe, because section blocks render one      |
| `./portable-text` | `PortableTextBody` — a separate entry because it pulls `@portabletext/react`                           |
| `./format-date`   | the two date formats an insight shows                                                                  |
| `./testing`       | `classTokens` and the 402 assertions (ADR 0006), plus the seed projections the render layer shares     |
| `./testing/seed`  | the committed seed tree projected for the browser — what the block stories and the page mockups render |

## The app owns the binding

`clientComponents.tsx`, `registry.ts` and the three dispatchers
(`Blocks`, `BlockRenderer`, `ClientBlockRenderer`) stay in the app, closed by
the `satisfies` clause that checks the roster. A renderer that needs something
only the app has lives there too; `renderer-seam.test.ts` fails when a renderer
is drawn both here and in the app, or in neither. The placement table in
`AGENTS.md` says which home a renderer takes.

The **base** bindings ship from here. `LayoutSection` dispatches base blocks
itself, from the shared table in `blocks/base/baseComponents.tsx`.

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
`stories` layer. The Storybook host in `apps/storybook` serves it.

# @o3/content-runtime

What turns Sanity documents into rendered pages: the four route builders, the
block dispatch loop, and the fetch, cache-tag, SEO and URL layers they sit on.
It holds no block renderers and no site chrome — those are `@o3/content-ui`,
which an app binds itself.

This is the part ADR 0028 commits to sharing. A second brand app is a second
consumer of these modules, not a second copy of them.

## Exports

| Subpath                | What it is                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `./routes`             | `buildDetailRoute` / `buildCatchAllRoute` / `buildSingletonRoute` / `buildIndexRoute`, the `define*Type` entry helpers, the entry types, and the cache-tag scheme                    |
| `./routes/index-paths` | the collection-index URL scheme — `indexHref`, `readIndexState`, `indexQueryRedirects` — with no server runtime behind it, so a `next.config.ts` or a client component can import it |
| `./blocks`             | `renderDispatchedBlocks`, `defineBlockRender`, `bindingsToRecord`, section anchors, and the generated-type pin points a registry is checked against                                  |
| `./data-attribute`     | `dataAttr` and the location builders Presentation resolves back to a field                                                                                                           |
| `./live`               | the draft-aware Sanity client: `sanityFetch`, `SanityLive`, `client`                                                                                                                 |
| `./site-settings`      | `getSiteSettings`, one request-cached read                                                                                                                                           |
| `./seo`                | `buildDocumentMetadata` — one resolution chain for every routable type                                                                                                               |
| `./urls`               | `hrefForDoc` and `previewPathForDoc`                                                                                                                                                 |
| `./base-url`           | `getBaseUrl` — the absolute origin sitemap, robots and OpenGraph URLs are built on                                                                                                   |

## The app still owns the bindings

Route entries (`defineDetailType(...)`), the block registry, and the two
renderers that read it stay in the app. That is what lets one app add a block
type without forcing a renderer into the other.

## Only the production build prerenders the whole collection

`publishedSlugs` — what every `generateStaticParams` reads — caps itself at
three slugs unless the build is the production one (`VERCEL_ENV=production`, or
`O3_PRERENDER_ALL=1`, which `promote.yml` sets so the deploy visitors land on
does not depend on how the CLI names its environment).

Every build of every branch used to prerender all of them. The insight detail
query was 57% of the project's Sanity requests in the week to 2026-08-26 —
107,694 of 189,171, against 288 articles nobody had changed — and the weekend
in the middle of that week drew 2,408 requests, which is the proof that almost
none of it was traffic.

A page that is not prerendered is not a page that is missing. `dynamicParams`
is on, so it renders on first request and is cached from then on, invalidated
by the same webhook tag as its prerendered twin; `build:assert` calls this
"unknown slugs still cache" and fails the build if it stops being true. The
visitor who lands on a cold one pays a query. The build used to pay 288.

The cap is never a zero: an empty `generateStaticParams` is
`EmptyGenerateStaticParamsError` under Cache Components, so a collection with
documents in it always prerenders at least one.

A collection index enumerates the same way and under the same cap (#370). Its
state is in the path — `/insights/page/2`, `/insights/category/design` — so
each page and each facet value is a route, and `buildIndexRoute` returns one
`generateStaticParams` per shape: `pageParams`, `facetParams`,
`facetPageParams`. Page counts come from the entry's own query with an empty
slice, and facet values from the `facetValues` query the entry declares.

## Stega belongs to draft mode, and nothing here turns it on

Stega is the invisible payload Presentation reads out of a rendered string to
map it back to a field. next-sanity owns the condition: `defineLive` encodes
only when `serverToken` is set, the client declares a `studioUrl`, and the
request is in draft mode. Pass `stega: true` to a `sanityFetch` and you
override all three — every anonymous visitor gets the characters, in copy they
paste and in markup a crawler reads (#229).

So a body fetch says nothing about stega and inherits the gate. Only a
metadata fetch says `stega: false`, because `<title>` and OG tags are strings
no browser renders. A brand app that adds a route builder gets the rule by
saying nothing;
`apps/web/src/content/documents/stegaGating.render.test.tsx` fails the build if
one starts talking.

## `#live` is the network seam

`build.tsx` and `siteSettings.ts` reach the Sanity client through the package's
own `#live` import (package.json → `imports`), while apps reach the same module
as `@o3/content-runtime/live`. A Vite alias matches the specifier as written, so
the render test layer stubs both forms — see `@o3/render-kit`. Stub only the
app's and every route render in the suite goes to the network.

# @o3/content-runtime

What turns Sanity documents into rendered pages: the four route builders, the
block dispatch loop, and the fetch, cache-tag, SEO and URL layers they sit on.
It holds no block renderers and no site chrome — those are `@o3/content-ui`,
which an app binds itself.

This is the part ADR 0028 commits to sharing. A second brand app is a second
consumer of these modules, not a second copy of them.

## Exports

| Subpath            | What it is                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `./routes`         | `buildDetailRoute` / `buildCatchAllRoute` / `buildSingletonRoute` / `buildIndexRoute`, the `define*Type` entry helpers, the entry types, and the cache-tag scheme |
| `./blocks`         | `renderDispatchedBlocks`, `defineBlockRender`, `bindingsToRecord`, section anchors, and the generated-type pin points a registry is checked against               |
| `./data-attribute` | `dataAttr` and the location builders Presentation resolves back to a field                                                                                        |
| `./live`           | the draft-aware Sanity client: `sanityFetch`, `SanityLive`, `client`                                                                                              |
| `./site-settings`  | `getSiteSettings`, one request-cached read                                                                                                                        |
| `./seo`            | `buildDocumentMetadata` — one resolution chain for every routable type                                                                                            |
| `./urls`           | `hrefForDoc` and `previewPathForDoc`                                                                                                                              |
| `./base-url`       | `getBaseUrl` — the absolute origin sitemap, robots and OpenGraph URLs are built on                                                                                |

## The app still owns the bindings

Route entries (`defineDetailType(...)`), the block registry, and the two
renderers that read it stay in the app. That is what lets one app add a block
type without forcing a renderer into the other.

## `#live` is the network seam

`build.tsx` and `siteSettings.ts` reach the Sanity client through the package's
own `#live` import (package.json → `imports`), while apps reach the same module
as `@o3/content-runtime/live`. A Vite alias matches the specifier as written, so
the render test layer stubs both forms — see `@o3/render-kit`. Stub only the
app's and every route render in the suite goes to the network.

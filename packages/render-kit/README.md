# @o3/render-kit

The `render` test layer (ADR 0004), as a package: `renderRoute`, the four
module stubs that let a route render outside Next, and the fixtures typed
against the shared queries.

A render test takes a route shim exactly as a `page.tsx` re-exports it, feeds
it fixture documents, and gets back the HTML a visitor would receive plus the
`<head>` metadata Next would emit. No Sanity project, no token, no network, no
dev server.

```tsx
const { html, metadata } = await renderRoute(buildDetailRoute(insight), {
  data: withSettings(anInsight({ title: 'Hello world' })),
  params: { slug: 'hello' },
})
expect(html).toContain('Hello world')
```

## Exports

| Subpath     | What it is                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `.`         | `renderRoute`, `expectNotFound`, the fixtures, the `data-sanity` readers, and the 402 assertions re-exported from `@o3/content-ui/testing` |
| `./project` | `renderProject` — one app's vitest project, read by the repo-root `vitest.config.mts`                                                      |

## An app instantiates the layer

A vitest project resolves one `@/` alias and carries one environment, so two
brand apps are two projects rather than one project with two globs. Each is one
call in `vitest.config.mts`:

```ts
renderProject({
  name: 'render:o3xo',
  appSrc: resolve(root, 'apps/o3xo/src'),
  env: { ...TEST_ENV, NEXT_PUBLIC_BRAND: 'o3xo' },
  include: ['apps/o3xo/src/**/*.render.test.tsx'],
})
```

**Pin the brand there, out loud.** `next.config.ts` is what puts
`NEXT_PUBLIC_BRAND` in the running app and vitest never loads it, so an
unpinned project gets `brandConfig()`'s fallback — `o3`. Every URL the second
app builds would then canonicalise to o3world.com and link case studies at
`/work`, and the assertions would agree with it, because they read the same
config. The port pin above it is the same kind of value for the same kind of
reason; both belong at the call site where a reader can see them.

App-side, each app keeps a `src/test/index.ts` that re-exports this package
plus its own on-disk fixtures — O3's migrated corpus for `apps/web`, the
bootstrap seeds for `apps/o3xo` — so a test in either app imports one thing:

```tsx
import { renderRoute, anInsight } from '@/test'
```

Fixtures that read a tree off disk stay in the app. Everything typed against a
generated query result belongs here: the queries are shared, so the fixture is
a fact about the schema rather than about a site.

## `#live` is stubbed twice

The one network seam is `sanityFetch`, and it is reached by two specifiers: an
app imports `@o3/content-runtime/live`, while the route builders inside that
package import their own `#live` (package.json → `imports`). A Vite alias
matches the specifier as written, so `project.ts` aliases both — stub only the
app's and every route render in the suite goes to the network.

Three more modules are stubbed, each for a reason written next to it in
`project.ts`. The one worth knowing about is `next/dynamic`: outside a Next
build there is no loadable manifest, so the real `dynamic()` resolves to
nothing and every registered document View renders **blank, silently**.
`React.lazy` is the honest stand-in.

## What is not here

Anything a browser has to run. Components are covered by the `stories` layer
in real Chromium with real CSS; this layer renders to a string, which is why
its asset ids can be fabricated and its images can be a plain `<img>`.

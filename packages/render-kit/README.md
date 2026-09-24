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
| `./project` | `renderProject` — the app's vitest project, read by the repo-root `vitest.config.mts`                                                      |

## The app instantiates the layer

A vitest project resolves one `@/` alias and carries one environment. The
`render` project is one call in `vitest.config.mts`:

```ts
renderProject({
  name: 'render',
  appSrc: appSrc('web'),
  env: TEST_ENV,
  include: ['apps/web/src/**/*.render.test.tsx', 'packages/*/src/**/*.render.test.tsx'],
})
```

**Pin the port there, out loud.** `TEST_ENV` fixes `WEB_PORT` and
`NEXT_PUBLIC_BASE_URL`, so a canonical URL belongs to the test environment
rather than to whichever port the checkout's dev server owns. It belongs at the
call site where a reader can see it.

App-side, `apps/web/src/test/index.ts` re-exports this package plus the app's
own on-disk fixtures (the migrated corpus), so a test imports one thing:

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

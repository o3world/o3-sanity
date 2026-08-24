import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { TestProjectInlineConfiguration } from 'vitest/config'

const here = dirname(fileURLToPath(import.meta.url))
const stub = (file: string) => resolve(here, 'stubs', file)

export interface RenderProjectOptions {
  /** Vitest project name — `render` for apps/web, `render:o3xo` for the second app. */
  readonly name: string
  /** The app's `src/` directory, absolute. `@/` resolves here, and nowhere else. */
  readonly appSrc: string
  /** Test files this project collects, as globs relative to the repo root. */
  readonly include: readonly string[]
  /**
   * The environment the layer asserts against. The caller writes it out rather
   * than inheriting a default, because every value in it is a pin a test can
   * read back — the port a canonical URL is built from, the brand
   * `brandConfig()` answers with. See the call sites in `vitest.config.mts`.
   */
  readonly env: Readonly<Record<string, string>>
}

/**
 * One app's instance of the `render` layer (ADR 0004): its route entries
 * rendered to HTML from fixture documents, with no network and no Next build.
 *
 * A project can resolve one `@/` and carry one environment, so a second brand
 * app is a second project rather than a second glob on the first. Everything
 * that is the same in both — the four module stubs, the JSX override, the leak
 * guard — is here; everything that differs is an argument.
 */
export function renderProject(options: RenderProjectOptions): TestProjectInlineConfiguration {
  return {
    // Server components are rendered through react-dom/server's streaming API
    // (see renderRoute.tsx) because the tree contains async components — the
    // sync renderToStaticMarkup cannot await them.
    //
    // An app's tsconfig sets `jsx: "preserve"` because Next runs its own JSX
    // transform. Vite honours tsconfig, so without this override the `.tsx`
    // under test reaches the parser with its JSX still in it.
    oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
    // Anchored regexes, most specific first — an unanchored `@` prefix alias
    // would swallow `@o3/content-runtime/live` before its own entry matched.
    resolve: {
      alias: [
        // The one network seam. `installDataset()` feeds routes their
        // documents, so a render test needs no Sanity project, no token, and
        // no network.
        //
        // Two entries for one module: an app reaches it by its package
        // subpath, while the route builders inside @o3/content-runtime reach
        // it through the package's own `#live` import (package.json →
        // `imports`). A Vite alias matches the specifier as written, so
        // stubbing one form does not stub the other — and stubbing only the
        // app's would leave every route render hitting the network.
        { find: /^@o3\/content-runtime\/live$/, replacement: stub('sanity-live.ts') },
        { find: /^#live$/, replacement: stub('sanity-live.ts') },
        // next/image needs Next's build-time image config to render. The
        // component under test is our SanityImage wrapper, whose real work
        // (urlForImage CDN URL construction) happens before next/image is
        // reached — so stubbing it to a plain <img> keeps the assertion
        // surface on our code without hiding anything we wrote.
        { find: /^next\/image$/, replacement: stub('next-image.tsx') },
        // Without a Next build there is no loadable manifest, so the real
        // next/dynamic resolves to nothing and every registered document View
        // renders blank — silently. React.lazy is the honest stand-in.
        { find: /^next\/dynamic$/, replacement: stub('next-dynamic.tsx') },
        // draftMode() needs a request scope that only exists inside the Next
        // server. The stub lets a test pick the published or draft path
        // explicitly.
        { find: /^next\/headers$/, replacement: stub('next-headers.ts') },
        { find: /^server-only$/, replacement: stub('empty.ts') },
        { find: /^@\//, replacement: `${options.appSrc}/` },
      ],
    },
    test: {
      name: options.name,
      environment: 'node',
      env: { ...options.env },
      include: [...options.include],
      setupFiles: [resolve(here, 'setup.ts')],
    },
  }
}

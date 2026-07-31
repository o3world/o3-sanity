import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const root = dirname(fileURLToPath(import.meta.url))
const webSrc = resolve(root, 'apps/web/src')

/**
 * Three test layers (ADR 0004). Each answers a different question, and the
 * file-name suffix tells you which layer you are in without opening the file:
 *
 *   unit     `*.test.ts`          — pure functions. Migration mappers, lib
 *                                   helpers, and invariants over the
 *                                   committed migration JSON. No React.
 *   render   `*.render.test.tsx`  — a document or route rendered from fixture
 *                                   data to HTML, with no network. Answers
 *                                   "does this content actually display?"
 *   stories  `*.stories.tsx`      — every Storybook story, mounted in real
 *                                   Chromium with real CSS, plus an axe scan.
 *                                   No test files to write: writing the story
 *                                   IS the test. Configured next to Storybook
 *                                   itself (apps/storybook/vitest.config.ts)
 *                                   so its addon resolves from that package.
 *
 * Run one layer with `pnpm test --project unit`.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          // `.test.ts` only — the render layer's files are `.render.test.tsx`,
          // so the two layers cannot collect each other's tests by accident.
          include: [
            'tools/migration/src/**/*.test.ts',
            'apps/web/src/**/*.test.ts',
            'packages/*/src/**/*.test.ts',
          ],
        },
      },
      {
        // Server components are rendered through react-dom/server's streaming
        // API (see apps/web/src/test/renderRoute.tsx) because the tree
        // contains async components — the sync renderToStaticMarkup cannot
        // await them.
        //
        // apps/web's tsconfig sets `jsx: "preserve"` because Next runs its own
        // JSX transform. Vite honours tsconfig, so without this override the
        // `.tsx` under test reaches the parser with its JSX still in it.
        oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
        // Anchored regexes, most specific first — an unanchored `@` prefix
        // alias would swallow `@/sanity/live` before its own entry matched.
        resolve: {
          alias: [
            // The one network seam. `installDataset()` feeds routes their
            // documents, so a render test needs no Sanity project, no token,
            // and no network.
            {
              find: /^@\/sanity\/live$/,
              replacement: resolve(webSrc, 'test/stubs/sanity-live.ts'),
            },
            // next/image needs Next's build-time image config to render. The
            // component under test is our SanityImage wrapper, whose real work
            // (urlForImage CDN URL construction) happens before next/image is
            // reached — so stubbing it to a plain <img> keeps the assertion
            // surface on our code without hiding anything we wrote.
            { find: /^next\/image$/, replacement: resolve(webSrc, 'test/stubs/next-image.tsx') },
            // Without a Next build there is no loadable manifest, so the real
            // next/dynamic resolves to nothing and every registered document
            // View renders blank — silently. React.lazy is the honest stand-in.
            {
              find: /^next\/dynamic$/,
              replacement: resolve(webSrc, 'test/stubs/next-dynamic.tsx'),
            },
            // draftMode() needs a request scope that only exists inside the
            // Next server. The stub lets a test pick the published or draft
            // path explicitly.
            { find: /^next\/headers$/, replacement: resolve(webSrc, 'test/stubs/next-headers.ts') },
            { find: /^server-only$/, replacement: resolve(webSrc, 'test/stubs/empty.ts') },
            { find: /^@\//, replacement: `${webSrc}/` },
          ],
        },
        test: {
          name: 'render',
          environment: 'node',
          include: ['apps/web/src/**/*.render.test.tsx'],
          setupFiles: [resolve(webSrc, 'test/setup.ts')],
        },
      },
      './apps/storybook/vitest.config.ts',
    ],
  },
})

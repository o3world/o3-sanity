import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

import { renderProject } from '@o3/render-kit/project'

const root = dirname(fileURLToPath(import.meta.url))
const appSrc = (app: string) => resolve(root, 'apps', app, 'src')

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
 *                                   The layer itself is `@o3/render-kit`.
 *   stories  `*.stories.tsx`      — every Storybook story, mounted in real
 *                                   Chromium with real CSS, plus an axe scan.
 *                                   No test files to write: writing the story
 *                                   IS the test. Configured next to each
 *                                   Storybook host so its addon resolves from
 *                                   that package.
 *
 * Run one layer with `pnpm test --project unit`.
 *
 * **The suite pins its own port** (#116). Vitest loads the repo-root `.env`
 * into `process.env`, and provisioning writes a unique `WEB_PORT` into every
 * worktree's `.env` so parallel dev servers do not collide. `getBaseUrl()`
 * reads that same variable, so without the pin below the canonical and
 * OpenGraph assertions compare `http://localhost:3000` against whichever port
 * this checkout happens to own, and seven SEO tests fail in every worktree for
 * reasons that have nothing to do with the ticket being worked. A canonical
 * URL belongs to the test environment, not to the dev server — so the layer
 * declares the port it asserts against, and each project declares it because
 * an inline project does not inherit root-level `test` options.
 * `NEXT_PUBLIC_BASE_URL` is pinned too: it is the first thing `getBaseUrl()`
 * reads, ahead of `VERCEL_URL`, so the origin also cannot follow a deployment
 * host when the suite runs in a Vercel build.
 */
const TEST_ENV = {
  WEB_PORT: '3000',
  NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
}

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          env: TEST_ENV,
          // `.test.ts` only — the render layer's files are `.render.test.tsx`,
          // so the two layers cannot collect each other's tests by accident.
          include: [
            'tools/build-assert/src/**/*.test.ts',
            'tools/engine-seam/src/**/*.test.ts',
            'tools/figma-sync/src/**/*.test.ts',
            'tools/perf-probe/src/**/*.test.ts',
            'tools/visual-regression/src/**/*.test.ts',
            'tools/migration/src/**/*.test.ts',
            'tools/guidance/src/**/*.test.ts',
            // The plugin's eval cases are data, and the grader engine that
            // reads them is the one part of the harness a machine can check.
            'tools/authoring-skill/evals/*.test.ts',
            // The slop linter's own tests, including the calibration that
            // pins it at zero hits over approved site copy.
            'tools/authoring-skill/scripts/*.test.ts',
            'apps/web/src/**/*.test.ts',
            'packages/*/src/**/*.test.ts',
            // The worktree scripts are shell, and their seams are subcommands.
            // A test here shells out to the script the same way a session does,
            // so `pnpm test` stays the one checkpoint rather than growing a
            // second runner for the half of the toolchain written in bash.
            'scripts/*.test.ts',
          ],
          // Studio v6.8 added a top-level `import "@sanity-labs/ui-poc/styles.css"`
          // to the `sanity` barrel. The migration mappers reach that barrel for
          // `defineField`/`defineType` via `@o3/sanity/schemas`, and an
          // externalised dep is loaded by Node itself — which has no idea what a
          // `.css` file is and throws `Unknown file extension ".css"` before a
          // single test collects. Inlining routes the barrel through Vite, whose
          // CSS handling is a no-op here (`test.css` defaults to false).
          server: { deps: { inline: ['sanity'] } },
        },
      },
      /** The app, plus the shared renderers' own render tests (#212). */
      renderProject({
        name: 'render',
        appSrc: appSrc('web'),
        env: TEST_ENV,
        include: ['apps/web/src/**/*.render.test.tsx', 'packages/*/src/**/*.render.test.tsx'],
      }),
      './apps/storybook/vitest.config.ts',
    ],
  },
})

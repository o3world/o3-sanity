import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { StorybookConfig } from '@storybook/nextjs-vite'
import type { InlineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { STORY_GLOB_SUFFIX, STORYBOOK_CONFIG_PREFIX, storyGlobs } from '@o3/story-kit/story-roots'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// `@storybook/nextjs-vite` aliases bare `react` (and several subpaths) to
// next's bundled copy. That's fine for stories whose entire tree lives
// inside the addon, but stories that pull in workspace components
// (packages/ui, later apps/web) re-import React directly. Two React copies →
// two `AppRouterContext` instances → the addon's RouterDecorator populates
// one while `useRouter` reads the other → "expected app router to be
// mounted" / "more than one copy of React in the same app" crashes. Pin
// every React entry to the workspace copy so there's exactly one instance
// across the bundle.
const require_ = createRequire(import.meta.url)
const reactEntries = {
  react: require_.resolve('react'),
  'react-dom': require_.resolve('react-dom'),
  'react-dom/client': require_.resolve('react-dom/client'),
  'react/jsx-runtime': require_.resolve('react/jsx-runtime'),
  'react/jsx-dev-runtime': require_.resolve('react/jsx-dev-runtime'),
  'react/compiler-runtime': require_.resolve('react/compiler-runtime'),
}

// Glob roots come from @o3/story-kit/story-roots (single source).
// STORY_ROOTS already declares apps/web/src ahead of the web app's scaffold
// ticket, and Storybook crashes on a glob whose base directory doesn't
// exist — filter to the roots present on disk. Delete the filter once
// apps/web lands.
const stories = storyGlobs(STORYBOOK_CONFIG_PREFIX).filter((glob) =>
  fs.existsSync(path.resolve(__dirname, glob.slice(0, glob.length - STORY_GLOB_SUFFIX.length - 1))),
)

// Captured prototypes (apps/storybook/prototypes/README.md). A set is a
// directory with an `index.html` entry page; everything beside it — sibling
// pages, assets, the artifact's own runtime JS — ships with it, so the
// cross-links inside a set keep working. Deriving the mounts from disk means
// adding a prototype is "drop the folder, write a story", with no config edit
// to forget.
const prototypesDir = path.resolve(__dirname, '../prototypes')
const staticDirs = fs.existsSync(prototypesDir)
  ? fs
      .readdirSync(prototypesDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() && fs.existsSync(path.join(prototypesDir, entry.name, 'index.html')),
      )
      .map((entry) => ({ from: `../prototypes/${entry.name}`, to: `/prototypes/${entry.name}` }))
  : []

const config: StorybookConfig = {
  stories,
  staticDirs,
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    // Renders a "Design" tab beside a story when it sets
    // `parameters.design = { type: 'figma', url }` — the source-of-truth
    // frame next to the built component.
    '@storybook/addon-designs',
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  typescript: {
    reactDocgen: 'react-docgen',
  },
  viteFinal: async (cfg: InlineConfig) => {
    // Don't let Vite wipe the terminal — otherwise an on-demand transform or
    // dep-optimize crash (the kind that fires when you navigate to a story
    // whose import graph hits a module Vite can't resolve) scrolls away
    // before you can read it.
    cfg.clearScreen = false
    cfg.logLevel = 'info'
    cfg.resolve = cfg.resolve ?? {}
    // Replace the addon's alias set: pin every React entry to the workspace
    // copy (see reactEntries above). Anchored regexes = exact match for the
    // bare import paths only.
    cfg.resolve.alias = Object.entries(reactEntries).map(([name, replacement]) => ({
      find: new RegExp(`^${name.replace(/\//g, '\\/')}$`),
      replacement,
    }))
    cfg.resolve.dedupe = Array.from(
      new Set([...(cfg.resolve.dedupe ?? []), ...Object.keys(reactEntries)]),
    )
    // Per-package `@/*`-style aliases resolve via each file's nearest
    // tsconfig.json `paths`.
    cfg.plugins = [...(cfg.plugins ?? []), tsconfigPaths()]

    // ── The same pin, for the dependency PRE-BUNDLE ────────────────────────
    //
    // `cfg.resolve.alias` governs the module graph. It does not govern
    // `optimizeDeps`, which runs esbuild with its own resolver — and there the
    // Next preset's `react` → `next/dist/compiled/react/index.js` alias wins
    // and esbuild appends the subpath to it. A dependency whose first line is
    // `import { c } from "react/compiler-runtime"` (the React Compiler's
    // output; `@portabletext/react` and `@sanity/visual-editing` both ship it)
    // therefore asks for
    // `…/compiled/react/index.js/compiler-runtime` — a path that treats a file
    // as a directory — and the optimizer dies before a single story renders.
    //
    // Same fix as above, applied one layer down: resolve every React entry to
    // the workspace copy. Excluding each offending package from pre-bundling
    // also works and was tried first; it is whack-a-mole, because the failing
    // import is the compiler's standard preamble and any dependency can grow
    // one on a minor bump.
    //
    // This is the wall `apps/web` has been coding around: `CtaLink` and
    // `InquiryForm` both carry a "never the next-sanity barrel, it drags in
    // @portabletext/react" comment with a lint rule behind it. Those stay
    // worth keeping (the barrel drags in far more than this), but the reason
    // is now "the barrel is heavy" rather than "Storybook cannot load portable
    // text" — which is what lets a page mockup render a `richText` block, and
    // a page mockup render at all.
    cfg.optimizeDeps = cfg.optimizeDeps ?? {}
    cfg.optimizeDeps.esbuildOptions = {
      ...(cfg.optimizeDeps.esbuildOptions ?? {}),
      plugins: [
        ...(cfg.optimizeDeps.esbuildOptions?.plugins ?? []),
        {
          name: 'o3-pin-react-compiler-runtime',
          setup(build) {
            // ONLY `react/compiler-runtime`, deliberately. Pinning the whole
            // `reactEntries` set here also builds, and then every story fails
            // at runtime with "Cannot read properties of null (reading
            // 'useContext')" from the addon's `virtual:next/image` — because
            // the pre-bundle would then carry the workspace React while the
            // addon's own virtual modules still carry next's compiled copy,
            // which is the two-copies bug at the top of this file, inverted.
            // `compiler-runtime` is the one entry with no counterpart in
            // next's compiled bundle, so it is the one that has to be pinned
            // and the only one that may be.
            build.onResolve({ filter: /^react\/compiler-runtime$/ }, () => ({
              path: reactEntries['react/compiler-runtime'],
            }))
          },
        },
      ],
    }

    // The workspace has `'use client'` components (packages/ui client
    // primitives, later apps/web chrome). Vite strips the directive when
    // bundling for Storybook (non-Next) and emits a MODULE_LEVEL_DIRECTIVE
    // warning per module, plus a follow-on SOURCEMAP_ERROR ("Can't resolve
    // original location of error") because stripping the line shifts the
    // source map. The flood is harmless but intermittently tips
    // `storybook build` to a non-zero exit. Drop source maps for the
    // Storybook bundle (it's a static doc build, not debugged) and silence
    // just those two warning codes so the build is deterministic — every
    // other warning still surfaces.
    cfg.build = { ...(cfg.build ?? {}), sourcemap: false }
    cfg.build.rollupOptions = cfg.build.rollupOptions ?? {}
    const prevOnwarn = cfg.build.rollupOptions.onwarn
    cfg.build.rollupOptions.onwarn = (warning, defaultHandler) => {
      if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'SOURCEMAP_ERROR') return
      if (typeof prevOnwarn === 'function') prevOnwarn(warning, defaultHandler)
      else defaultHandler(warning)
    }

    return cfg
  },
}

export default config

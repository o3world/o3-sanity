import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * The `stories` layer of the three in vitest.config.mts (ADR 0004).
 *
 * Every story in STORY_ROOTS is mounted in real headless Chromium — real CSS,
 * real layout — and scanned by axe. There are no test files: a component with
 * a story is already covered, which is why the wireframe build-out gets its
 * safety net for free.
 *
 * Lives here rather than in the root config so `@storybook/addon-vitest` and
 * the `.storybook` config it reads resolve from the package that owns them.
 */
export default defineConfig({
  plugins: [storybookTest({ configDir: resolve(here, '.storybook') })],
  test: {
    name: 'stories',
    // No setup file: since Storybook 10.3 the addon applies .storybook/preview
    // (globals.css, backgrounds, viewports, a11y config) automatically, so a
    // story under test renders exactly as it does in the Storybook UI.
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})

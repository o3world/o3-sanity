import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * The `stories` layer for this host — `apps/o3xo`'s own stories only.
 *
 * The addon derives its `include` from the host's story globs, which is every
 * story this Storybook serves. The exclude below cuts that back to the app's
 * own: the `stories` project already mounts the shared packages, and mounting
 * them twice buys a second axe scan of the same markup. What is left is
 * exactly what the O3 host cannot run — components that name a token role only
 * O3XO's package declares. The glob is written relative to this file because
 * that is what Vitest matches an exclude against; a `**`-prefixed one silently
 * matches nothing here.
 *
 * The brand comes from `.storybook/preview`, which defaults this host to
 * `o3xo`, so a story renders under test in the paint it is drawn for.
 */
export default defineConfig({
  plugins: [storybookTest({ configDir: resolve(here, '.storybook') })],
  test: {
    name: 'stories:o3xo',
    exclude: ['../../packages/**'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})

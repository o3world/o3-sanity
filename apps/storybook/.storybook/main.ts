import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineStorybookConfig } from '@o3/story-kit/storybook-config'

/**
 * The O3 host. Shared component stories, the O3 app's page mockups, and the
 * captured prototypes (ADR 0010), all painted in O3's tokens.
 *
 * `pnpm vr` builds this host by path, so it stays at `apps/storybook`.
 */
export default defineStorybookConfig({
  configDir: path.dirname(fileURLToPath(import.meta.url)),
  appStoryRoots: ['apps/web/src'],
  prototypesDir: '../prototypes',
})

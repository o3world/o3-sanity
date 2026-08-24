import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineStorybookConfig } from '@o3/story-kit/storybook-config'

/**
 * The O3XO host. The same shared component stories the O3 host serves, painted
 * in O3XO's tokens, plus the components `apps/o3xo` owns — the ones that name
 * a token role only O3XO's package declares and so cannot live in
 * `packages/ui` (ADR 0028).
 *
 * No prototypes mount: the captured artifacts are O3's history (ADR 0010) and
 * stay on the O3 host.
 */
export default defineStorybookConfig({
  configDir: path.dirname(fileURLToPath(import.meta.url)),
  appStoryRoots: ['apps/o3xo/src'],
})

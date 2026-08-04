import { defineCliConfig } from 'sanity/cli'

import { resolveDataset, resolveProjectId } from '@o3/sanity/constants'

/**
 * `load` and `verify` run through this config. It used to read a
 * `SANITY_DATASET` variable that nothing in the repo ever set, so every load
 * wrote to `production` regardless of what the web app was pointed at —
 * `resolveDataset` is the shared resolver that makes that impossible.
 */
export default defineCliConfig({
  api: {
    projectId: resolveProjectId(),
    dataset: resolveDataset(),
  },
})

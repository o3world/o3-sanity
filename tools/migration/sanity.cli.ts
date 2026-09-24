import { defineCliConfig } from 'sanity/cli'

import { resolveDataset, resolveProjectId } from '@o3/sanity/brand'

/**
 * Every `sanity exec` command in this package runs through this config, so
 * this is where a run gets its project and dataset: the site's, with
 * `NEXT_PUBLIC_SANITY_DATASET` choosing between `production` and
 * `development` (`pnpm dataset <name>` sets it).
 */
export default defineCliConfig({
  api: { projectId: resolveProjectId(), dataset: resolveDataset() },
})

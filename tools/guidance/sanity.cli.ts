import { defineCliConfig } from 'sanity/cli'

import { resolveDataset, resolveProjectId } from '@o3/sanity/brand'

export default defineCliConfig({
  api: {
    projectId: resolveProjectId(),
    dataset: resolveDataset(),
  },
})

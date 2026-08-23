import { defineCliConfig } from 'sanity/cli'

import { resolveDataset, resolveProjectId } from './src/brand'

export default defineCliConfig({
  api: {
    projectId: resolveProjectId(),
    dataset: resolveDataset(),
  },
})

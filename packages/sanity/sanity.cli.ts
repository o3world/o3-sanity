import { defineCliConfig } from 'sanity/cli'

import { resolveDataset, resolveProjectId } from './src/constants'

export default defineCliConfig({
  api: {
    projectId: resolveProjectId(),
    dataset: resolveDataset(),
  },
})

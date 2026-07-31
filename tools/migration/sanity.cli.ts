import { defineCliConfig } from 'sanity/cli'

import { DATASETS, PROJECT_ID } from '@o3/sanity/constants'

export default defineCliConfig({
  api: {
    projectId: PROJECT_ID,
    dataset: (process.env.SANITY_DATASET as (typeof DATASETS)[number]) ?? 'production',
  },
})

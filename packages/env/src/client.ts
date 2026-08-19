import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const clientEnv = createEnv({
  client: {
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1).optional(),
    // Matches o3's `defaultDataset` in @o3/sanity/brand — an unset variable
    // means the scratch dataset, never the live one.
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1).default('development'),
    NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
})

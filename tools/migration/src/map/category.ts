import { z } from 'zod'

import { migrationObject } from '../core/state'

export const categoryDoc = z.object({
  /* `-wp-<termId>`, for the WordPress category it came from. */
  _id: z.string().regex(/^category-wp-\d+$/),
  _type: z.literal('category'),
  title: z.string().min(1),
  slug: z.object({ _type: z.literal('slug'), current: z.string().min(1) }),
  migration: migrationObject,
})

import { z } from 'zod'

import { migrationObject } from '../core/state'
import { migratableImage } from './types'

export const personDoc = z.object({
  /* `-wp-<id>`, for the WordPress user or team post it came from. */
  _id: z.string().regex(/^person-wp-\d+$/),
  _type: z.literal('person'),
  name: z.string().min(1),
  title: z.string().min(1).optional(),
  /* WordPress's team posts carry one; the site draws none. */
  bio: z.string().min(1).optional(),
  headshot: migratableImage.optional(),
  migration: migrationObject,
})

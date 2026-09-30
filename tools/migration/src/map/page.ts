import { z } from 'zod'

import { migrationObject } from '../core/state'
import { seoObject } from './seo'

export const pageDoc = z.object({
  _id: z.string().regex(/^page-wp-\d+$/),
  _type: z.literal('page'),
  title: z.string().min(1),
  slug: z.object({ _type: z.literal('slug'), current: z.string().min(1) }),
  pageType: z.literal('standard'),
  sections: z.array(z.record(z.string(), z.unknown())).min(1),
  seo: seoObject.optional(),
  migration: migrationObject,
})

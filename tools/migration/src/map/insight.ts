import { z } from 'zod'

import { migrationObject } from '../core/state'
import { seoObject } from './seo'

export const insightDoc = z.object({
  /* Every deterministic id form (README → Rules of the road): `-wp-<id>` for a
   * post migrated from WordPress, `-seed-<slug>` for one written here. `verify`
   * re-runs this gate over the whole dataset, so a seeded insight has to
   * satisfy the same shape a converted one does. That is the point, not a
   * loophole. */
  _id: z.string().regex(/^insight-(wp-\d+|seed-[a-z0-9-]+)$/),
  _type: z.literal('insight'),
  title: z.string().min(1),
  slug: z.object({ _type: z.literal('slug'), current: z.string().min(1) }),
  excerpt: z.string().min(1),
  /* Optional: WordPress showed a byline only where an editor set the ACF
   * author, so most insights carry none. */
  author: z.object({ _type: z.literal('reference'), _ref: z.string() }).optional(),
  categories: z.array(
    z.object({ _type: z.literal('reference'), _ref: z.string(), _key: z.string() }),
  ),
  /* Required of every source, which is what keeps an insight from silently
   * losing its date and its place in the collection's order. */
  publishedAt: z.string().datetime(),
  cardMedia: z.unknown().optional(),
  featuredImage: z.unknown().optional(),
  body: z.array(z.record(z.string(), z.unknown())).min(1),
  seo: seoObject.optional(),
  migration: migrationObject.loose(),
})

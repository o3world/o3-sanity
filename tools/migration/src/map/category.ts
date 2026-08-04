import { z } from 'zod'

import { ok, type ExtractMeta, type Mapped } from './types'

export interface WpCategory {
  _meta: ExtractMeta
  wpId: number
  slug: string
  name: string
  count?: number
}

export const categoryDoc = z.object({
  _id: z.string().regex(/^category-wp-\d+$/),
  _type: z.literal('category'),
  title: z.string().min(1),
  slug: z.object({ _type: z.literal('slug'), current: z.string().min(1) }),
  migration: z.object({ locked: z.boolean(), sourceId: z.string() }),
})

export type CategoryDoc = z.infer<typeof categoryDoc>

/** Categories are a flat rename — no body, so nothing here can fail loud. */
export function mapCategory(cat: WpCategory): Mapped<CategoryDoc> {
  return ok({
    _id: `category-wp-${cat.wpId}`,
    _type: 'category' as const,
    title: cat.name,
    slug: { _type: 'slug' as const, current: cat.slug },
    migration: {
      locked: false,
      sourceId: `wp:term:${cat.wpId}`,
    },
  })
}

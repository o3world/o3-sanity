import { z } from 'zod'

import { ok, type ExtractMeta, type Mapped } from './types'

export interface WpPerson {
  _meta: ExtractMeta
  wpId: number
  slug: string
  name: string
  bio?: string
}

export const personDoc = z.object({
  _id: z.string().regex(/^person-wp-\d+$/),
  _type: z.literal('person'),
  name: z.string().min(1),
  migration: z.object({ locked: z.boolean(), sourceId: z.string(), extractedAt: z.string() }),
})

export type PersonDoc = z.infer<typeof personDoc>

/**
 * Authors carry only `name` today — WP bios are empty across the board and
 * the real author enrichment is its own ticket (#17).
 */
export function mapPerson(person: WpPerson): Mapped<PersonDoc> {
  return ok({
    _id: `person-wp-${person.wpId}`,
    _type: 'person' as const,
    name: person.name,
    migration: {
      locked: false,
      sourceId: `wp:user:${person.wpId}`,
      extractedAt: person._meta.extractedAt,
    },
  })
}

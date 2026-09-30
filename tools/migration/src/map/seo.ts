import { z } from 'zod'

import { migratableImage } from './types'

/**
 * The `seo` object a committed document carries — the gate every document
 * type's zod schema reuses, so no document holds a shape the Studio schema
 * does not have (#26).
 *
 * **`seo` holds overrides, never resolved values.** Every key is optional:
 * absent means "derive it", which `packages/content-runtime/src/seo.ts` does at
 * render time, and `false` booleans are never written.
 */
export const seoObject = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  ogImage: migratableImage.optional(),
  canonical: z.string().url().optional(),
  noIndex: z.literal(true).optional(),
  noFollow: z.literal(true).optional(),
})

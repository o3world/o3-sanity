import { z } from 'zod'

/**
 * An image in a committed document, in either of its two valid states:
 * carrying a URL marker before the binary is uploaded, or an `asset`
 * reference after. Gates are applied to the committed JSON by the corpus tests
 * AND to the dataset by `verify`, so they have to accept both — a gate that
 * only knows the pre-upload shape reports every loaded document as broken.
 *
 * **The marker names the source the bytes come from.** `_wpSrc` is a WordPress
 * upload URL, `_srcUrl` a URL on any other source site, `_localSrc` a
 * repo-relative file (seed imagery). `core/drift.ts` holds the table of which
 * are remote and which are read off disk.
 */
export const migratableImage = z
  .object({
    _type: z.literal('image'),
    _wpSrc: z.string().url().optional(),
    _srcUrl: z.string().url().optional(),
    asset: z.object({ _ref: z.string() }).loose().optional(),
  })
  .loose()
  .refine((image) => Boolean(image._wpSrc ?? image._srcUrl ?? image.asset), {
    message: 'image has neither a source URL marker nor an uploaded asset',
  })

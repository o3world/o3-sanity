import { z } from 'zod'

import type { ConversionIssue } from '../lib/htmlToPortableText'

/**
 * An image in a pipeline-owned document, in either of its two valid states:
 * carrying a `_wpSrc` URL marker before `load` uploads the binary, or an
 * `asset` reference after. Gates are applied to the committed JSON at convert
 * time AND to the dataset by `verify`, so they have to accept both — a gate
 * that only knows the pre-load shape reports every loaded document as broken.
 */
export const migratableImage = z
  .object({
    _type: z.literal('image'),
    _wpSrc: z.string().url().optional(),
    asset: z.object({ _ref: z.string() }).loose().optional(),
  })
  .loose()
  .refine((image) => Boolean(image._wpSrc ?? image.asset), {
    message: 'image has neither a _wpSrc marker nor an uploaded asset',
  })

/**
 * Every mapper returns one of these instead of throwing or half-writing:
 * a document that passed its zod gate, or the reasons it did not (ADR 0002's
 * fail-loud rule). `convert.ts` writes the `ok` ones and reports the rest.
 *
 * `notes` is the third outcome the fail-loud rule needs but a boolean can't
 * express: the document converted, and something about the source is worth a
 * human's attention anyway. Six years of WordPress editing leaves broken SEO
 * title templates and OG images pointing at deleted attachments — normalizing
 * those silently across 272 documents (#17) is exactly the invisible loss the
 * ADR is about, but neither is a reason to refuse the document.
 */
export type Mapped<T> =
  | { readonly ok: true; readonly doc: T; readonly notes?: readonly ConversionIssue[] }
  | { readonly ok: false; readonly issues: readonly ConversionIssue[] }

export function ok<T>(doc: T, notes: readonly ConversionIssue[] = []): Mapped<T> {
  return notes.length > 0 ? { ok: true, doc, notes } : { ok: true, doc }
}

export function failed<T>(issues: readonly ConversionIssue[]): Mapped<T> {
  return { ok: false, issues }
}

/** Every extract record carries this provenance header. */
export interface ExtractMeta {
  readonly type: string
  readonly source: string
  readonly extractedAt: string
}

/** `2026-07-31 20:07:34` (WP GMT) → `2026-07-31T20:07:34Z`. */
export function toIso(wpGmt: string): string {
  return wpGmt.replace(' ', 'T') + 'Z'
}

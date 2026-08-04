/**
 * Deciding whether an upload is an image or a plain file.
 *
 * This lives here rather than in `load.ts` because `load.ts` builds a Sanity
 * CLI client at module scope and can only run under `sanity exec` — importing
 * it from a test is not possible. The rule below is worth a test, so it moves.
 */

/** Extensions we treat as images when the bytes are inconclusive. */
export const IMAGE_EXTENSION = /\.(jpe?g|png|gif|webp|avif|svg)$/i

/**
 * The only asset id shape `@sanity/image-url` will parse:
 * `image-<id>-<width>x<height>-<ext>`. It throws `Malformed asset _ref` on
 * anything else — a `file-…` upload included.
 *
 * The id segment is mixed-case alphanumeric, not hex: Sanity mints ids like
 * `Tb9Ew8CXIwaY6R1kjMvI0uRR`, and only this pipeline's own uploads happen to
 * be sha1 hex.
 *
 * `verify` uses this to catch the shape that loads cleanly, resolves as a
 * reference, and only fails much later during prerender. The web renderer
 * enforces the same rule at its own boundary (`isRenderableImage` in
 * `@o3/sanity/image`); keep the two in step.
 */
const IMAGE_ASSET_ID = /^image-[A-Za-z0-9_]+-\d+x\d+-[A-Za-z0-9]+$/

/** Whether `ref` is an asset id an image field can legally hold. */
export function isImageAssetId(ref: string): boolean {
  return IMAGE_ASSET_ID.test(ref)
}

/**
 * Image or file, decided from the **bytes** rather than the filename.
 *
 * The filename is not trustworthy. WordPress serves uploads whose URL carries
 * no extension at all — `…/uploads/2022/09/img_6328a6474b86e.` ends in a bare
 * dot — and under the old extension-only test exactly one of those uploaded as
 * a `file-…` asset. `@sanity/image-url` rejects a file ref, so it did not fail
 * at load time: it failed much later as `Malformed asset _ref` while
 * prerendering the insight that used it, taking the production build down
 * with it and blocking the `pre-push` hook for everyone.
 *
 * Sniffing bytes also survives the media cache, which stores the response body
 * and not its headers — a `Content-Type` check would be right on a cold run and
 * unavailable on every cached one.
 *
 * The extension stays as a fallback for anything with no magic number we know.
 */
export function isImageBuffer(buf: Buffer, filename: string): boolean {
  const ascii = (start: number, end: number) => buf.subarray(start, end).toString('binary')

  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true // JPEG
  if (ascii(0, 8) === '\x89PNG\r\n\x1a\n') return true // PNG
  if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') return true // GIF
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return true // WebP
  if (ascii(4, 8) === 'ftyp' && /avi[fs]|mif1|msf1/.test(ascii(8, 12))) return true // AVIF

  // SVG is XML, so there is no magic number — it may open with a comment, a
  // declaration or a doctype. Look for the actual element rather than treating
  // every XML document as an image.
  if (/<svg[\s>]/i.test(ascii(0, 1024))) return true

  return IMAGE_EXTENSION.test(filename)
}

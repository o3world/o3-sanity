/**
 * Normalize a route param to the form this repo's slugs are stored in: decoded.
 *
 * Next.js is not consistent about this: for the same request it hands `Page`
 * the RAW segment (`pact%E2%80%99s-podcast`) but `generateMetadata` the DECODED
 * one (`pact’s-podcast`), so without normalizing, one of the two silently misses
 * its document.
 *
 * **Decoded is the form a slug is stored in here.** Both corpora write the
 * character itself — o3xo.ai's two curly-apostrophe slugs are the only non-ASCII
 * ones either brand has, and path parity keeps them as the site serves them
 * (`tools/migration/src/map/framer.ts`). Normalizing the other way asked Sanity
 * for `pact%E2%80%99s-podcast` and 404'd both articles (#218).
 *
 * A segment that is not valid percent-encoding is passed through rather than
 * throwing: a malformed URL is a 404, not a 500.
 */
export function decodePathParam(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

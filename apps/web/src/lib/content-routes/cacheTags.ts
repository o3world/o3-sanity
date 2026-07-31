/**
 * Single source of truth for the Sanity cache-tag scheme. Both sides of the
 * revalidation contract derive tags from here:
 *
 * - readers: the route builders in `build.tsx` tag their `sanityFetch`es;
 * - writer: `/api/revalidate` maps webhook payloads onto the same tags.
 *
 * Shapes (single-locale simplification of vtx-web's ADR 0014 scheme —
 * the `<language>` dimension is dropped, ADR 0001):
 *   `sanity:<type>`          — type-level (new docs, singletons, feeds)
 *   `sanity:<type>:<slug>`   — exact document
 *
 * The exact tag uses `slug.current` verbatim on both sides — o3 matches
 * documents by slug (no materialized path), and the webhook payload carries
 * the same full slug (`services/ux-audit` included), so reader and writer
 * stay in lockstep without leaf normalization.
 */

export function typeTag(type: string): string {
  return `sanity:${type}`
}

export function docTag(type: string, slug: string): string {
  return `sanity:${type}:${slug}`
}

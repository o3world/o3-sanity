import type { DocumentResolver } from 'sanity/presentation'

import { COLLECTION_PREFIXES } from '@o3/sanity/constants'

/**
 * Presentation's route <-> document wiring, lifted out of `sanity.config.ts`
 * so it can be unit-tested — the same move `draftModeRoutes.ts` makes for the
 * draft-mode handlers.
 *
 * These strings are parsed by **path-to-regexp**, bundled inside `sanity`, and
 * a malformed pattern is not a soft failure: `getRouteContext` re-throws out of
 * the effect that drives `useMainDocument`, which takes the whole Presentation
 * tool down for every URL that reaches the bad pattern. `presentationRoutes.test.ts`
 * compiles each one so that lands in CI instead of in the tool.
 *
 * URL shapes mirror `src/content/documents/urls.ts` (hrefForDoc) — keep the two
 * in sync.
 */

/** The type-only import above keeps the `sanity` barrel out of this module. */
export const mainDocumentRoutes: DocumentResolver[] = [
  {
    route: '/',
    filter: `_type == "page" && slug.current == "index"`,
  },
  {
    route: `${COLLECTION_PREFIXES.caseStudy}/:slug`,
    filter: `_type == "caseStudy" && slug.current == $slug`,
  },
  {
    route: `${COLLECTION_PREFIXES.perspective}/:slug`,
    filter: `_type == "perspective" && slug.current == $slug`,
  },
  {
    // Catch-all pages store their full multi-segment path in `slug.current`
    // (`services/ux-audit`); a wildcard's segments come back as an array.
    //
    // `*slug`, NOT the `:slug*` this used to be. Studio 6.8 bundles
    // path-to-regexp 8, which dropped the `*` modifier — see the module
    // comment for why the old spelling took the tool out rather than just
    // failing to match.
    //
    // Last in the list: it matches everything the routes above don't, and
    // Presentation resolves in order.
    route: '/*slug',
    resolve: (ctx) => {
      const raw = ctx.params.slug as string | string[] | undefined
      const slug = Array.isArray(raw) ? raw.join('/') : raw
      return slug
        ? { filter: `_type == "page" && slug.current == $slug`, params: { slug } }
        : undefined
    },
  },
]

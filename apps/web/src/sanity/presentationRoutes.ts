import type { DocumentResolver } from 'sanity/presentation'

import { collectionPrefixes } from '@o3/sanity/brand'

/**
 * Presentation's route <-> document wiring, lifted out of `sanity.config.ts`
 * so it can be unit-tested — the same move `@o3/editor-chrome/draft-mode`
 * makes for the draft-mode handlers.
 *
 * These strings are parsed by **path-to-regexp**, bundled inside `sanity`, and
 * a malformed pattern is not a soft failure: `getRouteContext` re-throws out of
 * the effect that drives `useMainDocument`, which takes the whole Presentation
 * tool down for every URL that reaches the bad pattern. `presentationRoutes.test.ts`
 * compiles each one so that lands in CI instead of in the tool.
 *
 * URL shapes mirror `@o3/content-runtime/urls` (hrefForDoc) — keep the two
 * in sync.
 */

/** The type-only import above keeps the `sanity` barrel out of this module. */
export const mainDocumentRoutes: DocumentResolver[] = [
  {
    route: '/',
    filter: `_type == "page" && slug.current == "index"`,
  },
  /*
   * THE TWO COLLECTION INDEXES, above their own detail routes and well above
   * the catch-all (#347, #348).
   *
   * They need patterns of their own because they are the one route kind whose
   * URL is not a document's slug: the route owns `/insights`, and the document
   * that fills it is found by `collection`. Without these the catch-all
   * matched and asked for a `page` whose slug is "insights" — no document, so
   * Presentation showed the two routes an editor is meant to compose as
   * having nothing to edit, and offered to create the page instead.
   *
   * Order is load-bearing twice over: before `/*slug`, which matches anything;
   * and harmlessly beside `<prefix>/:slug`, which needs a segment these do not
   * have. `presentationRoutes.test.ts` pins both directions.
   */
  {
    route: collectionPrefixes().insight,
    filter: `_type == "collectionIndex" && collection == "insight"`,
  },
  {
    route: collectionPrefixes().caseStudy,
    filter: `_type == "collectionIndex" && collection == "caseStudy"`,
  },
  {
    route: `${collectionPrefixes().caseStudy}/:slug`,
    filter: `_type == "caseStudy" && slug.current == $slug`,
  },
  {
    route: `${collectionPrefixes().insight}/:slug`,
    filter: `_type == "insight" && slug.current == $slug`,
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

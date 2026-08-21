import type { RenderingPolicy } from './rendering'

/**
 * The rendering strategy, declared (#265, spec #260).
 *
 * Every route in `apps/web` serves from the CDN unless it is named here. A
 * route that renders per request bills a function invocation on every page
 * view, so the set is a reviewed list in one file: changing it is a diff in a
 * pull request rather than a line on the invoice.
 *
 * `inherent` — nothing to prerender, in any mode.
 * `migrating` — should serve a static shell and does not yet. Turning on
 * Cache Components stops honouring these entries, and the entry is deleted in
 * the same change that fixes the route.
 */
export const RENDERING_POLICY: RenderingPolicy = {
  perRequest: [
    {
      route: '/api/draft-mode/disable',
      kind: 'inherent',
      reason: 'clears the draft-mode cookie for the current request',
    },
    {
      route: '/api/draft-mode/enable',
      kind: 'inherent',
      reason: 'validates a Presentation preview URL and sets the cookie',
    },
    {
      route: '/api/revalidate',
      kind: 'inherent',
      reason: "the publish webhook's POST target",
    },
    {
      route: '/studio/[[...tool]]',
      kind: 'inherent',
      reason: 'the Studio is a client application behind a login',
    },
    {
      route: '/insights',
      kind: 'migrating',
      reason: 'pagination and the category facet are read from searchParams',
    },
    {
      route: '/work',
      kind: 'migrating',
      reason: 'pagination is read from searchParams',
    },
  ],
}

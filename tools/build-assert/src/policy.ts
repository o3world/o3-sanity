import type { RenderingPolicy } from './rendering'

/**
 * The rendering strategy, declared (#265, spec #260).
 *
 * Every route in `apps/web` serves from the CDN unless it is named here. A
 * route that renders per request bills a function invocation on every page
 * view, so the set is a reviewed list in one file: changing it is a diff in a
 * pull request rather than a line on the invoice.
 *
 * The list is route handlers and nothing else: under Cache Components every
 * page route has a shell, the Studio's client application included.
 *
 * `inherent` — nothing to prerender, in any mode.
 * `migrating` — should serve a static shell and does not yet. Cache Components
 * is what fixes such a route, and turning it on stops honouring the entry, so
 * the change that fixes the route is the change that deletes it.
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
  ],
}

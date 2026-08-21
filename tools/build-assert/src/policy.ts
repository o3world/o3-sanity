import type { JsBudget } from './bundle'
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

/**
 * How much JavaScript a route may ship, declared (#269, spec #260).
 *
 * The default is the site's own measurement plus room to move: the audit in
 * #269 left every content route at 667,149 uncompressed bytes of first-load
 * JavaScript, and 734,000 is that plus 10%. The headroom is deliberately
 * smaller than any single thing the audit removed — the cheapest was comlink
 * at ~64KB — so a regression of the kind that ticket fixed cannot fit under
 * the ceiling, while a dependency bump or one more small client component
 * does not fail a build.
 *
 * The number to beat next is `/_not-found` at 520,264: a route with no content
 * at all, and therefore the floor Next and React charge for a page here.
 *
 * A route is held to the default unless it is named below, so a route added
 * next month is inside the budget without anyone remembering it exists.
 */
export const JS_BUDGET: JsBudget = {
  defaultBytes: 734_000,
  routes: [
    {
      route: '/studio/[[...tool]]',
      bytes: 8_635_000,
      // Measured at 7,849,537, again plus 10%. Nobody browses to the Studio by
      // accident and no visitor pays for it; what this entry buys is a warning
      // when the editing application doubles.
      reason: 'an editing application, reached only by editors',
    },
  ],
}

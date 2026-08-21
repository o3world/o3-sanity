/**
 * What the build says about how each route renders (#265, spec #260).
 *
 * The ground truth is what Next writes into `.next` — no route-file parsing,
 * no guessing from source:
 *
 *   - `app-path-routes-manifest.json` maps every app path to its route
 *     (`"/(site)/insights/page"` → `"/insights"`), so it is the full route
 *     table including route handlers and the Studio catch-all.
 *   - `prerender-manifest.json` lists what the build actually prerendered:
 *     `routes` holds concrete paths, `dynamicRoutes` holds the parameterised
 *     routes themselves.
 *   - `required-server-files.json` carries the resolved config, which is where
 *     `cacheComponents` comes from.
 *
 * A route the prerender manifest never mentions is one the server renders on
 * demand for every request — the shape that bills a function invocation per page view.
 * That is the same set the build's own route table marks `ƒ (Dynamic)`.
 */

/**
 * Only the keys are read. Next fills the entries with cache-control fields,
 * data routes and headers, and none of them says anything about whether the
 * route serves from the CDN — the entry existing is the whole signal.
 */
export interface PrerenderManifest {
  /** Concrete prerendered paths: `/`, `/about`, `/insights/some-slug`. */
  routes: Record<string, unknown>
  /** Parameterised routes the build prerendered: `/insights/[slug]`. */
  dynamicRoutes: Record<string, unknown>
}

/** The slice of the build output the manifest-reading assertions work from. */
export interface RenderingOutput {
  /** `config.cacheComponents` as the build recorded it. */
  cacheComponents: boolean
  /** app path → route, from `app-path-routes-manifest.json`. */
  appPathRoutes: Record<string, string>
  prerender: PrerenderManifest
}

/**
 * A route the allowlist permits to render per request.
 *
 * `inherent` says there is nothing to prerender in any mode — a POST handler,
 * the Studio's client app. `migrating` says the route should serve a static
 * shell and does not yet; Cache Components is what fixes it, and turning that
 * mode on stops honouring these entries.
 */
interface AllowedRoute {
  route: string
  kind: 'inherent' | 'migrating'
  reason: string
}

export interface RenderingPolicy {
  perRequest: AllowedRoute[]
}

export type Problem =
  /** Renders per request and the allowlist does not say it may. */
  | { kind: 'unexpected'; route: string }
  /** Allowlisted, but the build prerenders it — the entry has outlived its cause. */
  | { kind: 'stale'; route: string }
  /** Allowlisted, and the build has no such route. */
  | { kind: 'unknown'; route: string }
  /** Cache Components is on and the route prerendered no shell. */
  | { kind: 'no-shell'; route: string }

/** One line a reader can act on, starting from the route. */
export function describeProblem(problem: Problem): string {
  switch (problem.kind) {
    case 'unexpected':
      return `${problem.route} is server-rendered on demand and the allowlist does not permit it. Every request to it bills a function invocation.`
    case 'no-shell':
      return `${problem.route} prerendered no static shell. Under Cache Components every route has one, so this route reads something dynamic outside a Suspense boundary.`
    case 'stale':
      return `${problem.route} is prerendered now, so its allowlist entry is spent — delete it.`
    case 'unknown':
      return `${problem.route} is on the allowlist and the build has no such route — delete the entry or fix its path.`
  }
}

/** Every route the build produced, deduplicated and sorted. */
export function allRoutes(build: RenderingOutput): string[] {
  return [...new Set(Object.values(build.appPathRoutes))].sort()
}

/** `/insights/[slug]`, `/studio/[[...tool]]` — a route that takes params. */
function isParameterised(route: string): boolean {
  return route.includes('[')
}

/**
 * The routes the build prerendered nothing for — server-rendered on demand.
 *
 * A parameterised route has to hold its own `dynamicRoutes` entry; the
 * concrete paths sitting under it in `routes` do not stand in for one. One
 * path bailing out of prerendering costs the whole route that entry while its
 * siblings stay behind, and Next prints the route as `ƒ` — so reading the
 * siblings as proof would pass a route that bills every request.
 */
export function perRequestRoutes(build: RenderingOutput): string[] {
  const paths = new Set(Object.keys(build.prerender.routes))
  const parameterised = new Set(Object.keys(build.prerender.dynamicRoutes))

  return allRoutes(build).filter((route) =>
    isParameterised(route) ? !parameterised.has(route) : !paths.has(route),
  )
}

/**
 * Every way the build can disagree with the policy. An empty array is a pass.
 */
export function checkRenderingStrategy(build: RenderingOutput, policy: RenderingPolicy): Problem[] {
  // Cache Components prerenders a shell for every route that can have one, so
  // the only entries it still honours are the ones with nothing to prerender.
  const allowed = new Set(
    policy.perRequest
      .filter((entry) => !build.cacheComponents || entry.kind === 'inherent')
      .map((entry) => entry.route),
  )
  const perRequest = new Set(perRequestRoutes(build))
  const routes = new Set(allRoutes(build))

  const problems: Problem[] = []
  for (const route of perRequest) {
    if (allowed.has(route)) continue
    problems.push({ kind: build.cacheComponents ? 'no-shell' : 'unexpected', route })
  }
  // The allowlist is the exact set, not a ceiling: an entry the build has
  // outgrown is a diff someone should see rather than a quiet permission.
  for (const entry of policy.perRequest) {
    if (!routes.has(entry.route)) problems.push({ kind: 'unknown', route: entry.route })
    else if (!perRequest.has(entry.route)) problems.push({ kind: 'stale', route: entry.route })
  }
  return problems
}

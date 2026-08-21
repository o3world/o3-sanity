/**
 * What the build says about how each route renders (#265, spec #260).
 *
 * The ground truth is two manifests Next writes into `.next`, and nothing
 * else — no route-file parsing, no guessing from source:
 *
 *   - `app-path-routes-manifest.json` maps every app path to its route
 *     (`"/(site)/insights/page"` → `"/insights"`), so it is the full route
 *     table including route handlers and the Studio catch-all.
 *   - `prerender-manifest.json` lists what the build actually prerendered:
 *     `routes` holds concrete paths (each naming the route it came from in
 *     `srcRoute`), `dynamicRoutes` holds the parameterised routes themselves.
 *
 * A route with no entry in either is one the server renders on demand for
 * every request — the shape that bills a function invocation per page view.
 * That is the same set the build's own route table marks `ƒ (Dynamic)`.
 */

/**
 * Set by Next on each prerender entry once PPR is on (`cacheComponents: true`).
 * Off, the field is absent.
 */
export type RenderingMode = 'STATIC' | 'PARTIALLY_STATIC'

export interface PrerenderEntry {
  /** The route this concrete path was generated from, or the path itself. */
  srcRoute?: string | null
  renderingMode?: RenderingMode
}

export interface PrerenderManifest {
  routes: Record<string, PrerenderEntry>
  dynamicRoutes: Record<string, PrerenderEntry>
}

export interface BuildOutput {
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
export interface AllowedRoute {
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
export function allRoutes(build: BuildOutput): string[] {
  return [...new Set(Object.values(build.appPathRoutes))].sort()
}

/**
 * The routes the build prerendered nothing for — server-rendered on demand.
 */
export function perRequestRoutes(build: BuildOutput): string[] {
  const prerendered = new Set<string>(Object.keys(build.prerender.dynamicRoutes))
  for (const [path, entry] of Object.entries(build.prerender.routes)) {
    prerendered.add(entry.srcRoute ?? path)
  }
  return allRoutes(build).filter((route) => !prerendered.has(route))
}

/**
 * Every way the build can disagree with the policy. An empty array is a pass.
 */
export function checkRenderingStrategy(build: BuildOutput, policy: RenderingPolicy): Problem[] {
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

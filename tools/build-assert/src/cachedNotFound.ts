/**
 * An unknown slug must still be answered from the cache (#267, spec #260).
 *
 * Measured on production against the Cache Components build: a probe of an
 * unknown slug costs one function invocation with `cacheReason: cold`, and
 * every repeat after it is a CDN hit carrying a 404. Scanner noise buys one
 * render per slug rather than one per request.
 *
 * What holds that up is a single field. Next records each parameterised
 * route's handling of an unrecognised param in `prerender-manifest.json` as
 * `fallback`, and `null` is its encoding of blocking: render the unknown param
 * on demand, then cache what came back — a 404 included. The rendering
 * assertion next door cannot see this. It asks whether a route prerendered
 * anything at all, and a route can keep its shell while changing what it does
 * with a slug nobody published.
 *
 * The two ways to lose it, and why each is worth a failed build:
 *
 *   - `false` is `dynamicParams: false` — an unrecognised slug 404s without
 *     the route rendering. Cheap, and wrong: the set of real slugs is then
 *     fixed at build time, so a newly published document 404s until someone
 *     redeploys. The publish webhook cannot fix what the router refuses to
 *     ask about.
 *   - a string is a prebuilt fallback shell, which the route fills per
 *     request. That is the cost regression: every probe of every made-up slug
 *     bills an invocation again.
 */
import type { RenderingOutput } from './rendering'

/**
 * The routes whose params are slugs out of the dataset — the ones a scanner
 * walks and the ones a publish has to be able to bring to life. Declared
 * rather than derived: `/studio/[[...tool]]` is also parameterised and
 * legitimately carries a fallback shell, and no field in the build output
 * tells the two kinds apart.
 */
const CONTENT_ROUTES = ['/[...segments]', '/insights/[slug]', '/work/[slug]'] as const

/** Next writes `null` for blocking, `false` for `dynamicParams: false`. */
function fallbackOf(entry: unknown): unknown {
  return (entry as { fallback?: unknown }).fallback
}

/**
 * Every content route that no longer blocks on an unknown slug. An empty
 * array is a pass.
 *
 * A content route with no `dynamicRoutes` entry at all is passed over in
 * silence: that is the per-request regression, and `checkRenderingStrategy`
 * already names it. Two failures for one cause point the reader at the wrong
 * file.
 */
export function checkCachedNotFound(build: RenderingOutput): string[] {
  const routes = new Set(Object.values(build.appPathRoutes))
  const problems: string[] = []

  for (const route of CONTENT_ROUTES) {
    if (!routes.has(route)) {
      problems.push(
        `${route} is declared a content route here and the build has no such route — ` +
          `delete the entry in cachedNotFound.ts or fix its path.`,
      )
      continue
    }

    const entry = build.prerender.dynamicRoutes[route]
    if (entry === undefined) continue

    const fallback = fallbackOf(entry)
    if (fallback === null) continue

    problems.push(
      fallback === false
        ? `${route} no longer renders unknown slugs (fallback: false). Its slugs are fixed at ` +
            `build time, so a document published after this build 404s until someone redeploys.`
        : `${route} answers an unknown slug from a fallback shell (fallback: ` +
            `${JSON.stringify(fallback)}) rather than blocking. The shell is filled per request, ` +
            `so every probe of every made-up slug bills a function invocation.`,
    )
  }

  return problems
}

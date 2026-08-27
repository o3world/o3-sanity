/**
 * How many detail pages a non-production build prerenders.
 *
 * Small enough that a preview build's Sanity traffic is a rounding error,
 * large enough that a broken detail route fails the build that introduced it
 * rather than the first person to click through.
 */
const PREVIEW_PRERENDER_LIMIT = 3

/**
 * How many of a type's slugs this build will prerender.
 *
 * **Only the production build prerenders the whole collection.** Every build
 * of every branch used to render all of them, and the insight detail query
 * was 57% of the project's Sanity requests in the week to 2026-08-26 —
 * 107,694 of 189,171, against 288 articles nobody had changed. A preview
 * exists to be looked at, and a page that is not prerendered is not a page
 * that is missing: `dynamicParams` is on, so it renders on first request and
 * is cached from then on, invalidated by the same webhook tag as its
 * prerendered twin. The visitor who lands on the cold one pays a query; the
 * build pays 288.
 *
 * `Infinity` rather than a slice, so the production path does no work at all.
 * `O3_PRERENDER_ALL=1` prerenders everything from any build — the escape
 * hatch for reproducing a production build locally.
 */
export function prerenderBudget(env: Record<string, string | undefined> = process.env): number {
  if (env.O3_PRERENDER_ALL === '1') return Infinity
  return env.VERCEL_ENV === 'production' ? Infinity : PREVIEW_PRERENDER_LIMIT
}

/**
 * The first `budget` slugs, in the order the dataset gave them.
 *
 * **A cap, never a zero.** Under Cache Components an empty
 * `generateStaticParams` is `EmptyGenerateStaticParamsError`, so a budget of
 * nought against a collection that has documents would fail the build rather
 * than save it a query.
 */
export function capToBudget(slugs: string[], budget: number): string[] {
  return budget >= slugs.length ? slugs : slugs.slice(0, Math.max(1, budget))
}

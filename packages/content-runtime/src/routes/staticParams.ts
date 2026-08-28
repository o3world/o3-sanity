import { sanityFetch } from '#live'

import { capToBudget, prerenderBudget } from './prerenderBudget'

/**
 * The published slugs a `generateStaticParams` prerenders from (#266).
 *
 * `'use cache'` because `sanityFetch` calls `cacheTag()` and will not run
 * outside a cached function, and `perspective: 'published'` because a build
 * has no request to read a preview cookie from.
 *
 * **No fallback for a failed read.** A build that cannot reach the dataset
 * should fail rather than ship a site with nothing prerendered. Cache
 * Components makes that the only option anyway: an empty return is
 * `EmptyGenerateStaticParamsError`, so swallowing the failure buys a build
 * error one step removed from its cause. Letting the fetch throw puts the
 * message — which names the missing token — where the failure is.
 *
 * The read itself is one query however many slugs come back; what the budget
 * decides is how many *detail* queries the build then makes.
 */
export async function publishedSlugs(query: string): Promise<string[]> {
  'use cache'
  const { data } = await sanityFetch({ query, perspective: 'published', stega: false })
  const slugs = ((data ?? []) as Array<string | null>).filter(
    (slug): slug is string => typeof slug === 'string' && slug !== '',
  )
  return capToBudget(slugs, prerenderBudget())
}

/**
 * How many items a collection index holds under a given filter, read at build
 * time so `generateStaticParams` knows how many pages it has.
 *
 * It is the entry's own query with an empty slice — `[0...0]` returns no items
 * and still counts the whole feed, so a page count costs one request and no
 * documents.
 */
export async function publishedIndexTotal(
  query: string,
  facets: Record<string, string | null>,
): Promise<number> {
  'use cache'
  const { data } = await sanityFetch({
    query,
    params: { offset: 0, end: 0, ...facets },
    perspective: 'published',
    stega: false,
  })
  const total = (data as { total?: unknown } | null)?.total
  return typeof total === 'number' ? total : 0
}

/**
 * The same list, guaranteed non-empty — `capToBudget`'s "a cap, never a zero"
 * rule (`prerenderBudget.ts`) applied to a list the dataset can empty on its
 * own: a collection with no second page, or a facet with no values yet.
 *
 * Both are real states rather than build failures, so the placeholder stands
 * in. It prerenders a path that answers 404, which is what that URL means.
 */
export function atLeastOne<T>(params: T[], placeholder: T): T[] {
  return params.length > 0 ? params : [placeholder]
}

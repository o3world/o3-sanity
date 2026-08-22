import { sanityFetch } from '#live'

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
 */
export async function publishedSlugs(query: string): Promise<string[]> {
  'use cache'
  const { data } = await sanityFetch({ query, perspective: 'published', stega: false })
  return ((data ?? []) as Array<string | null>).filter(
    (slug): slug is string => typeof slug === 'string' && slug !== '',
  )
}

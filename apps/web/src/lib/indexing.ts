/**
 * Only the promoted production deployment may be indexed. Previews and the
 * staging alias are built with `VERCEL_ENV` set to `preview`, and a local build
 * has none.
 */
export function isIndexedBuild(vercelEnv: string | undefined): boolean {
  return vercelEnv === 'production'
}

/**
 * `X-Robots-Tag` on every response of a build that must not be indexed.
 * `robots.txt` only stops crawling: a blocked URL something links to can still
 * be indexed, and the page's own robots meta is never read while crawling is
 * blocked. The header is what keeps such a URL out of the index.
 */
export function noindexHeaders(vercelEnv: string | undefined) {
  if (isIndexedBuild(vercelEnv)) return []
  return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
}

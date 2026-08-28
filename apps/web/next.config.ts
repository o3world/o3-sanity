import type { NextConfig } from 'next'
import { sanity } from 'next-sanity/live/cache-life'

import { indexRedirects } from './src/lib/indexRedirects'
import { GENERATED_REDIRECTS } from './src/lib/redirects.generated'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // next-sanity's own profile, which pins time-based revalidation to a year:
  // the publish webhook is what invalidates this site, not a clock.
  cacheComponents: true,
  experimental: {
    /*
     * The router's scroll-to-top, from the segment's own ref rather than from
     * `findDOMNode`. React 19 hoists a page's `<title>` and `<meta>` into
     * `<head>`, so the old handler starts its walk on a zero-height node in
     * there and runs out of siblings having scrolled nothing. Flagged in 16.2
     * and the default after it.
     */
    appNewScrollHandler: true,
  },
  cacheLife: { default: sanity },
  images: {
    // Sanity's image CDN does the resizing; Vercel's optimizer (billed per
    // transformation) is bypassed entirely. See the loader for the mechanics.
    loader: 'custom',
    loaderFile: './src/lib/sanity-image-loader.ts',
  },
  /**
   * Two maps, in one list.
   *
   * The collection indexes' retired query-string URLs come first — they are
   * exact, and none of them can collide with a WordPress path. Then the
   * WordPress redirect map, resolved to terminals (#24).
   *
   * Generated, never written by hand: `pnpm --filter @o3/migration redirects`
   * reads both plugins' committed export and rewrites
   * `src/lib/redirects.generated.ts`. A hand-kept list of 300 URLs stops
   * matching WordPress the first time anyone edits either one.
   *
   * All permanent — every rule in the source map is a 301, and a 302 would
   * tell search engines to keep the old URL indexed.
   */
  async redirects() {
    return [
      ...indexRedirects(),
      ...GENERATED_REDIRECTS.map(({ source, destination }) => ({
        source,
        destination,
        permanent: true,
      })),
    ]
  },
}

export default nextConfig

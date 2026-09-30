import { withBotId } from 'botid/next/config'
import type { NextConfig } from 'next'
import { sanity } from 'next-sanity/live/cache-life'

import { indexRedirects } from './src/lib/indexRedirects'
import { GENERATED_REDIRECTS } from './src/lib/redirects.generated'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // next-sanity's own profile, which pins time-based revalidation to a year:
  // the publish webhook is what invalidates this site, not a clock.
  cacheComponents: true,
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
   * WordPress redirect map, resolved to terminals (#24), in
   * `src/lib/redirects.generated.ts`.
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

/**
 * BotID's rewrites and headers, which proxy the challenge through this origin
 * so an ad-blocker cannot take the check out. It adds nothing else: the config
 * above is what Next reads.
 */
export default withBotId(nextConfig)

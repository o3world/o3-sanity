import type { NextConfig } from 'next'
import { sanity } from 'next-sanity/live/cache-life'

import { BRAND } from './brand'
import { indexRedirects } from './src/lib/indexRedirects'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // next-sanity's own profile, which pins time-based revalidation to a year:
  // the publish webhook is what invalidates this site, not a clock.
  cacheComponents: true,
  cacheLife: { default: sanity },
  experimental: {
    /*
     * The cross-page fade (#403). React's `<ViewTransition>` is behind this
     * flag; the site layout is the one place that renders one.
     */
    viewTransition: true,
  },
  images: {
    // Sanity's image CDN does the resizing; Vercel's optimizer (billed per
    // transformation) is bypassed entirely. See the loader for the mechanics.
    loader: 'custom',
    loaderFile: './src/lib/sanity-image-loader.ts',
  },
  /**
   * Which brand every module in this app resolves as (ADR 0028). `@o3/sanity`
   * reads `NEXT_PUBLIC_BRAND` to answer for the Sanity project, the dataset and
   * the collection prefixes, and an unset value means `o3` — so without this
   * line the O3XO app runs quietly against o3world.com's project and nothing
   * else notices.
   *
   * Declared here rather than in an env file because it is not configuration:
   * it is a fact about the app, it has to hold in dev and in every build, and a
   * gitignored `.env` carries neither guarantee. `src/env.ts` asserts it at
   * boot, so a bundler that ever stops inlining this fails loudly.
   */
  env: {
    NEXT_PUBLIC_BRAND: BRAND,
  },
  /**
   * The collection indexes' retired query-string URLs (#370). The brand is
   * passed explicitly: this file is what sets `NEXT_PUBLIC_BRAND`, so nothing
   * it imports can read it yet.
   */
  async redirects() {
    return indexRedirects(BRAND)
  },
}

export default nextConfig

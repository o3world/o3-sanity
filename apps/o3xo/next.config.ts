import type { NextConfig } from 'next'

import { BRAND } from './brand'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
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
}

export default nextConfig

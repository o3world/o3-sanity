import type { NextConfig } from 'next'
import { sanity } from 'next-sanity/live/cache-life'

import { GENERATED_REDIRECTS } from './src/lib/redirects.generated'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  cacheLife: { default: sanity },
  images: {
    // Sanity's image CDN does the resizing; Vercel's optimizer (billed per
    // transformation) is bypassed entirely. See the loader for the mechanics.
    loader: 'custom',
    loaderFile: './src/lib/sanity-image-loader.ts',
  },
  /**
   * The WordPress redirect map, resolved to terminals (#24).
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
    return GENERATED_REDIRECTS.map(({ source, destination }) => ({
      source,
      destination,
      permanent: true,
    }))
  },
}

export default nextConfig

/**
 * Absolute site origin for sitemap/robots/OG URLs. No trailing slash.
 *
 * A production build refuses to guess. Every canonical, og:url and sitemap
 * entry is built from this origin, and a fallback that answers wrongly does so
 * on every page at once, with nothing failing.
 */
export function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL
  if (explicit) return explicit.replace(/\/$/, '')
  if (process.env.VERCEL_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_BASE_URL must be set for a production build.')
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  // WEB_PORT is server-only (set via the repo-root .env); client bundles
  // inline it as undefined and keep the 3000 default — override
  // NEXT_PUBLIC_BASE_URL if a client caller needs the moved port.
  return `http://localhost:${process.env.WEB_PORT ?? process.env.PORT ?? '3000'}`
}

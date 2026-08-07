/** Absolute site origin for sitemap/robots/OG URLs. No trailing slash. */
export function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL
  if (explicit) return explicit.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  // WEB_PORT is server-only (set via the repo-root .env); client bundles
  // inline it as undefined and keep the 3000 default — override
  // NEXT_PUBLIC_BASE_URL if a client caller needs the moved port.
  return `http://localhost:${process.env.WEB_PORT ?? process.env.PORT ?? '3000'}`
}

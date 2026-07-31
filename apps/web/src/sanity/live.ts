import { createClient } from 'next-sanity'
import { defineLive } from 'next-sanity/live'

import { clientConfig } from '@o3/sanity/client'

/**
 * Draft-aware data fetching and live revalidation.
 *
 * - `sanityFetch`: use in server components instead of `client.fetch`.
 *   Automatically switches to the draft perspective when `draftMode()` is
 *   enabled (Presentation tool / preview links).
 * - `SanityLive`: rendered once in `(site)/layout.tsx`. Subscribes to
 *   Sanity's Live Content API and triggers revalidation when content changes.
 *
 * The client is created here (not in `@o3/sanity`) with next-sanity's
 * `createClient` so stega encoding is available for Presentation overlays;
 * the shared package stays framework-free and only exports `clientConfig`.
 *
 * `browserToken` is intentionally a SEPARATE, Viewer-only token: next-sanity
 * ships it to the browser when draft mode is enabled. `SANITY_API_READ_TOKEN`
 * has draft-read scope and must never reach the JS bundle. When the env var
 * is missing, `false` silences the dev warning and disables stand-alone
 * draft preview; Presentation draft preview still works without it.
 */
export const client = createClient({
  ...clientConfig,
  stega: { studioUrl: '/studio' },
})

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: process.env.SANITY_API_READ_TOKEN,
  browserToken: process.env.SANITY_API_BROWSER_TOKEN ?? false,
})

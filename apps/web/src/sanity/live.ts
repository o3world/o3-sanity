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
 * `browserToken` is REQUIRED for Presentation/live preview to update
 * (issue #15): in next-sanity v13 the ONLY delivery path for draft updates
 * is `SanityLive`'s Live Content API subscription, and it includes draft
 * events only when `browserToken` is a string. `<VisualEditing />`'s default
 * handler declines mutation-driven refreshes, so without this token edits in
 * Presentation never reach the frontend. next-sanity only shares the token
 * with the browser after the draft-mode preview-secret handshake, and the
 * official guidance is to reuse the Viewer read token — set
 * `SANITY_API_BROWSER_TOKEN` only if you need a narrower browser scope.
 */
export const client = createClient({
  ...clientConfig,
  stega: { studioUrl: '/studio' },
})

const readToken = process.env.SANITY_API_READ_TOKEN
const browserToken = process.env.SANITY_API_BROWSER_TOKEN ?? readToken

if (process.env.NODE_ENV === 'development' && !browserToken) {
  console.warn(
    '[sanity/live] SANITY_API_READ_TOKEN is not set: Presentation edits will NOT ' +
      'update the preview and draft content is unavailable. See issue #15.',
  )
}

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: readToken,
  browserToken: browserToken ?? false,
})

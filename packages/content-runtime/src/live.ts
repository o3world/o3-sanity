import { cookies, draftMode } from 'next/headers'
import { createClient } from 'next-sanity'
import {
  defineLive,
  resolvePerspectiveFromCookies,
  resolveVariantFromCookies,
  type LivePerspective,
} from 'next-sanity/live'

import { clientConfig } from '@o3/sanity/client'
import { readsNeedToken } from '@o3/sanity/constants'

/**
 * Draft-aware data fetching and live revalidation.
 *
 * - `sanityFetch`: use in server components instead of `client.fetch`.
 *   Automatically switches to the draft insight when `draftMode()` is
 *   enabled (Presentation tool / preview links).
 * - `SanityLive`: rendered by `(site)/layout.tsx` only when draft mode is
 *   enabled. It subscribes to Sanity's Live Content API and is what delivers
 *   draft updates to Presentation. Published visitors deliberately don't get
 *   it — each one would hold a Live connection and fire a server action per
 *   publish; the Sanity webhook → `/api/revalidate` invalidates their cache
 *   instead.
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
const readToken = process.env.SANITY_API_READ_TOKEN

/**
 * The token is on the base client, not just on draft reads.
 *
 * `production` is a public dataset, so unauthenticated reads worked and this
 * was never needed. `development` is private — and a private dataset answers
 * an unauthenticated query with an empty result rather than a 401, so the app
 * rendered an empty nav and a 404 homepage with nothing in the logs to say
 * why. Authenticating every server-side read makes `pnpm dataset <name>` work
 * whatever the dataset's ACL is.
 *
 * Server-only: `SANITY_API_READ_TOKEN` has no `NEXT_PUBLIC_` prefix, so it is
 * `undefined` in any client bundle. Every importer of this module is a server
 * component, a route handler or the sitemap. The separate `browserToken`
 * below is the one that reaches the browser, and only after next-sanity's
 * draft-mode handshake.
 */
export const client = createClient({
  ...clientConfig,
  ...(readToken ? { token: readToken } : {}),
  stega: { studioUrl: '/studio' },
})
const browserToken = process.env.SANITY_API_BROWSER_TOKEN ?? readToken

if (process.env.NODE_ENV === 'development' && !browserToken) {
  console.warn(
    '[sanity/live] SANITY_API_READ_TOKEN is not set: Presentation edits will NOT ' +
      'update the preview and draft content is unavailable. See issue #15.',
  )
}

/**
 * `strict: true` is the Cache Components contract (#266).
 *
 * Under `cacheComponents` next-sanity swaps in an implementation that calls
 * `cacheTag()` and `cacheLife()`, so `sanityFetch` runs only inside a
 * `'use cache'` function — where `draftMode()` and `cookies()` are
 * unreadable. Strict mode makes that explicit rather than silent: every fetch
 * must name its own `perspective` and `stega` (`currentReadMode` below), and
 * `<SanityLive>` must name its own `includeDrafts`. Left to its defaults that
 * last one is `false`, which is a preview that never updates and nothing in a
 * log to say why.
 */
const live = defineLive({
  client,
  serverToken: readToken,
  browserToken: browserToken ?? false,
  strict: true,
})

export const SanityLive = live.SanityLive

/**
 * A read this configuration cannot satisfy is an error, not an empty result (#100).
 *
 * A private dataset answers an anonymous query with `200 {"result": null}`, so
 * every route saw a legitimate-looking miss: `/` and `/about` turned it into
 * `notFound()`, while `/insights` and `/work` rendered an empty listing —
 * because an index query returns `{items: [], total: 0}`, which is an object
 * and therefore never falsy. Two routes 404ing and two routes lying is what a
 * missing token looks like from the outside, and nothing reaches the log.
 *
 * The check is at the fetch rather than at import: the render test layer
 * replaces this module wholesale, `generateStaticParams` and the sitemap catch
 * their own fetch failures, and a module-level throw would take down a build
 * that never needed to read anything.
 */
export const sanityFetch: typeof live.sanityFetch = (options) => {
  if (!readToken && readsNeedToken(clientConfig.dataset)) {
    throw new Error(
      `Sanity dataset "${clientConfig.dataset}" cannot be read without SANITY_API_READ_TOKEN. ` +
        `It is not public, and Content Lake answers an unauthorized read with an empty result ` +
        `rather than an error — so every page would 404 or render blank with nothing in the log. ` +
        `Run \`pnpm env:pull\` for a token, or \`pnpm dataset production\` to point this ` +
        `checkout at the public dataset.`,
    )
  }
  return live.sanityFetch(options)
}

/**
 * Which cut of the dataset a request reads, and whether Presentation's
 * overlay markers ride along with it (#266).
 *
 * Under Cache Components every `sanityFetch` runs inside a `'use cache'`
 * boundary, and `draftMode()` and `cookies()` cannot be read in there — so
 * `sanityFetch` cannot resolve these for itself. They are resolved out here
 * and handed in as arguments, which also makes them part of the cache key, so
 * a preview session's drafts can never land in the entry every other visitor
 * shares.
 */
export interface ReadMode {
  readonly perspective: LivePerspective
  /** A Sanity editing variant id, when the preview session names one. */
  readonly variant?: string
  readonly stega: boolean
}

/**
 * What an ordinary visitor gets. It is a constant because it has to be: a
 * cached render is shared by everyone who asks for the route, so nothing
 * about it may vary by request.
 */
const publishedRead: ReadMode = { perspective: 'published', stega: false }

/**
 * The read mode for the request being served. Resolve it outside every
 * cached function and pass the result in.
 *
 * `draftMode()` is safe to read while prerendering — it answers `false` and
 * marks nothing dynamic — so the published branch is what a static shell is
 * built from. `cookies()` is only reached once draft mode says a Presentation
 * session is on the other end, which never happens at build time.
 */
export async function currentReadMode(): Promise<ReadMode> {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return publishedRead

  const jar = await cookies()
  return {
    perspective: await resolvePerspectiveFromCookies({ cookies: jar }),
    variant: await resolveVariantFromCookies({ cookies: jar }),
    stega: true,
  }
}

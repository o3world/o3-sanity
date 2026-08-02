import { draftMode } from 'next/headers'
import { defineEnableDraftMode } from 'next-sanity/draft-mode'

import { enableDraftModeForStudioSession, verifyStudioToken } from '@/sanity/draftModeRoutes'
import { client } from '@/sanity/live'

/**
 * Two ways into draft mode, one URL — they differ only in the credential the
 * caller can produce.
 *
 * `GET` is Presentation's entry point (wired in sanity.config.ts as
 * `previewMode.enable`). next-sanity validates the preview-url secret with the
 * token-bearing client before enabling Next.js draft mode.
 *
 * `POST` is the preview switcher's (#60): an editor browsing the site normally
 * has no preview secret, only the Studio session sitting in same-origin
 * `localStorage`. The token comes up in the body and is checked against the
 * Sanity API for membership of this project before draft mode is enabled — the
 * client's claim on its own is never enough.
 */
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN }),
})

export async function POST(request: Request): Promise<Response> {
  return enableDraftModeForStudioSession(request, {
    draftMode,
    verifyToken: (token) => verifyStudioToken(token),
  })
}

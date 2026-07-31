import { defineEnableDraftMode } from 'next-sanity/draft-mode'

import { client } from '@/sanity/live'

/**
 * Presentation's draft-mode entry point (wired in sanity.config.ts as
 * `previewMode.enable`). next-sanity validates the preview-url secret with
 * the token-bearing client before enabling Next.js draft mode.
 */
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN }),
})

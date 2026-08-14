import { draftMode } from 'next/headers'
import { disableDraftModeAndReturn } from '@o3/editor-chrome/draft-mode'

/**
 * The way out of draft mode (#60) — the counterpart the scaffold never had.
 *
 * Deliberately unauthenticated: turning draft mode *off* only ever shows less
 * than the caller already had. `?to=` carries the page to come back to and is
 * sanitised to a same-origin path before the redirect.
 */
export async function GET(request: Request): Promise<Response> {
  return disableDraftModeAndReturn(request, { draftMode })
}

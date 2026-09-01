import { draftMode } from 'next/headers'
import { EditorToolbar } from '@o3/editor-chrome/toolbar'
import { SanityLive } from '@o3/content-runtime/live'

import { editorToolbarConfig } from '@/sanity/editorToolbar'
import { VisualEditing } from '@/sanity/VisualEditing'

/**
 * The layout's draft-session tail, and the only place the (site) shell reads
 * `draftMode()`. Under Cache Components that call is request-time data, so it
 * lives here behind the layout's `<Suspense>` rather than in the layout body —
 * awaited there it turns every route blocking the moment a draft cookie
 * exists (#409). The shell stays static; this streams in.
 */
export async function DraftTools() {
  const { isEnabled: isDraft } = await draftMode()

  return (
    <>
      {/* Draft sessions only: SanityLive is the delivery path for draft
          updates in Presentation (see live.ts). Published visitors get
          freshness from the Sanity webhook → /api/revalidate instead, so
          they hold no Live Content API connection. */}
      {isDraft ? (
        <>
          <SanityLive includeDrafts />
          <VisualEditing />
        </>
      ) : null}
      {/* Renders nothing unless the visitor holds a Studio session (#60, #99).
          `<VisualEditing />` above is what lets it tell Presentation's frame
          from an ordinary tab — see shouldShowEditorToolbar. */}
      <EditorToolbar isDraft={isDraft} config={editorToolbarConfig} />
    </>
  )
}

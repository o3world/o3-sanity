'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useIsPresentationTool } from 'next-sanity/hooks'

import { presentationHref } from '../paths'
import {
  browserTokenStorage,
  readStudioToken,
  shouldShowEditorToolbar,
  type EditorToolbarConfig,
} from './draftPreview'
import { EditorToolbarView, type EditorToolbarStatus } from './EditorToolbarView'

/**
 * The editor toolbar's behaviour (#60, #99): where it hides, and what its
 * three controls do.
 *
 * Loaded through `next/dynamic` from `EditorToolbar`, and only once a Studio
 * session looks plausible — `useIsPresentationTool` drags the visual editing
 * runtime in with it, and an anonymous visitor should pay for none of that.
 *
 * **Entering draft mode is a POST, leaving it is a link, editing is a link.**
 * Entering needs the Studio token in a body the server can verify, then
 * `router.refresh()` picks up the cookie the response set and re-renders the
 * URL in place. The other two need no credential the browser can offer — the
 * Studio does its own auth on arrival — so they are ordinary anchors that work
 * without JavaScript.
 */
export function EditorToolbarChip({
  isDraft,
  config,
}: {
  isDraft: boolean
  config: EditorToolbarConfig
}) {
  const router = useRouter()
  const pathname = usePathname()
  const isPresentationTool = useIsPresentationTool()
  const [status, setStatus] = useState<EditorToolbarStatus>('idle')

  // window.location rather than useSearchParams(): the query string is part of
  // where the editor was (?page=3 on an index), and useSearchParams() would
  // impose a Suspense boundary on every page for a value only this reads.
  const [returnTo, setReturnTo] = useState('/')
  useEffect(() => {
    setReturnTo(`${window.location.pathname}${window.location.search}`)
  }, [pathname])

  const { projectId, enablePath } = config
  const onEnableDrafts = useCallback(async () => {
    setStatus('working')

    const token = readStudioToken(browserTokenStorage(), projectId)
    if (!token) {
      setStatus('error')
      return
    }

    try {
      const response = await fetch(enablePath, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!response.ok) {
        setStatus('error')
        return
      }
    } catch {
      setStatus('error')
      return
    }

    setStatus('idle')
    router.refresh()
  }, [enablePath, projectId, router])

  if (!shouldShowEditorToolbar({ isDraft, hasStudioToken: true, isPresentationTool })) {
    return null
  }

  return (
    <EditorToolbarView
      isDraft={isDraft}
      returnTo={returnTo}
      disablePath={config.disablePath}
      // The same path both other controls use, so "Edit this page" always means
      // the page under it — query string included, which is what tells
      // Presentation an index's page 3 from its page 1.
      editHref={presentationHref({
        studioUrl: config.studioUrl,
        previewPath: returnTo,
        toolName: config.presentationToolName,
      })}
      status={status}
      onEnableDrafts={() => void onEnableDrafts()}
    />
  )
}

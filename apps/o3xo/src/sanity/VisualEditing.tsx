'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { VisualEditing as NextSanityVisualEditing } from 'next-sanity/visual-editing'
import type { HistoryRefresh } from '@sanity/visual-editing'
import { CanvasNotices, createCanvasComponents } from '@o3/editor-chrome/canvas'
import { BLOCK_KNOBS, OBJECT_KNOBS } from '@o3/sanity/knobs'
import { BLOCK_ARRAYS } from '@o3/sanity/schemas/registry'
import { BUTTON_ICONS } from '@o3/ui'

import { ICONS } from '@/icons/Icon'

/**
 * The one VisualEditing mount for the site (issue #15).
 *
 * next-sanity v13's built-in refresh handler DECLINES `source: "mutation"`
 * refreshes, assuming the Live Content API delivers draft updates. That
 * assumption only holds when `defineLive` has a `browserToken`. This wrapper
 * restores the mutation fallback: if no live-preview connection is active
 * (`livePreviewEnabled === false`), a Studio edit triggers a server
 * re-render, so Presentation keeps updating even when the token is missing
 * or revoked in an environment. With the token present, live events handle
 * updates and this handler stays out of the way.
 *
 * The returned promise throttles refreshes to one per second while typing.
 *
 * `components` is the canvas toolbar (#108, #109), and it is deliberately the
 * only thing this mount says about it: the resolver and everything it reaches
 * live in `@o3/editor-chrome/canvas`, so removing the feature is deleting one
 * prop. It is an `@alpha` API on `@sanity/visual-editing` and the one unstable
 * surface the site depends on — worth keeping to a single line.
 *
 * The three registries are what the site has to supply: the overlay package
 * knows the knob vocabulary and none of our declarations (ADR 0020), so they
 * are handed in here rather than imported over there. `OBJECT_KNOBS` is what a
 * hovered instance offers (#145) — a mark's options, declared once against the
 * component and read at every placement. `BLOCK_ARRAYS` is what the insert menu
 * offers (#112) — which arrays hold blocks and which blocks each holds, derived
 * from the same registry the schema's own `of:` is built from, so the menu and
 * the form cannot disagree about what a page accepts.
 *
 * `BUTTON_ICONS` is the fourth, and the only one that is a drawing (#151). A
 * knob whose options are icons declares `optionPreview: 'glyph'` and their
 * NAMES; the declaration cannot carry the glyph itself, because the knobs
 * directory is bundled into the Studio and the preview overlay and must not
 * pull `@o3/ui` into either. So the site — which already renders these icons on
 * the page — hands the same components to the control that draws the picker.
 * `glyphs` is one flat map keyed by option value across every knob that draws
 * one, so this app's own set joins it (#246): `feature.icon` offers eighteen
 * names, and eighteen is exactly the picker that has to show shapes rather than
 * the words `file magnifying glass`.
 *
 * `<CanvasNotices />` is a SIBLING and cannot be anything else (#124). An
 * overlay component renders only while its element is hovered, so a refused
 * mutation reported from inside the toolbar is gone the instant the editor
 * looks away from the thing that refused it. Mounted here the notice belongs to
 * the page; the toolbar feeds it through a queue in the same package. It
 * renders nothing until something fails.
 */
const canvasComponents = createCanvasComponents({
  blockKnobs: BLOCK_KNOBS,
  objectKnobs: OBJECT_KNOBS,
  blockArrays: BLOCK_ARRAYS,
  glyphs: { ...BUTTON_ICONS, ...ICONS },
})

export function VisualEditing() {
  const router = useRouter()

  const refresh = useCallback(
    (payload: HistoryRefresh): false | Promise<void> => {
      if (payload.source === 'mutation' && payload.livePreviewEnabled) {
        // A live-drafts subscription (SanityLive + browserToken) is
        // connected and will deliver this update — don't double-refresh.
        return false
      }
      router.refresh()
      return new Promise((resolve) => setTimeout(resolve, 1000))
    },
    [router],
  )

  return (
    <>
      <NextSanityVisualEditing refresh={refresh} components={canvasComponents} />
      <CanvasNotices />
    </>
  )
}

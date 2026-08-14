'use client'

import { useEffect, useRef, useState } from 'react'
import type { OverlayComponent } from '@sanity/visual-editing'
import { useDocuments, useVisualEditingEnvironment } from '@sanity/visual-editing/react'

import { CanvasToolbarView } from './CanvasToolbarView'
import { computeChipDock, dockToAnchor, findAttributedElement } from './dock'
import { initialDraftSnapshot, tryGetDocument } from './draftPatch'
import { componentName, subjectName } from './identity'
import { resolveGroqPath } from './groqPath'
import type { CanvasLevel } from './subject'

/**
 * THE CANVAS TOOLBAR (#108) — what an editor sees hovering anything inside a
 * section in the Presentation preview.
 *
 * ONE component attaches at every attributed level, because Presentation's
 * hover model is innermost-wins: a bar attached only to the band exists only
 * where the cursor sits in padding that no inner element covers. Wherever the
 * hover lands the bar renders at the same band-anchored spot, so moving around
 * inside the section never moves it — which is what lets the pointer travel
 * from the content to the chrome without the chrome disappearing en route.
 *
 * The bar docks at the band's top-RIGHT corner: the opposite corner from
 * Presentation's own element tab (top-left), so the stock chrome and ours read
 * as two groups rather than one crowded one.
 *
 * No knobs yet — #109 adds them. What is here is attachment, geometry and
 * naming, which is the part that has to be right before a control can sit on
 * it.
 */

// A type alias rather than an interface: `OverlayComponent` constrains its
// props to `Record<string, unknown>`, and only an alias gets the implicit
// index signature that satisfies it.
export type CanvasToolbarProps = {
  level?: CanvasLevel
  blockPath?: string
  itemPath?: string
  /**
   * The block sits in another block's array. Nothing reads it yet — it is the
   * argument `visibleKnobs({nested})` takes in #109, where a nested block
   * drops its band knobs because its host owns the strip. Declared rather than
   * passed silently so the contract says what crosses this seam.
   */
  nested?: boolean
}

interface InnerProps {
  level: CanvasLevel
  blockPath: string
  itemPath: string | undefined
  documentId: string
  /** The hovered element's own GROQ path — the chip's subject when no item encloses it. */
  path: string
  element: Element
  /** The hovered element's own schema title, when the comlink resolved one. */
  schemaTitle: string | undefined
  /** Popped-out Presentation window: the stock action shares the corner there. */
  dodgeStockAction: boolean
}

function CanvasToolbarInner({
  level,
  blockPath,
  itemPath,
  documentId,
  path,
  element,
  schemaTitle,
  dodgeStockAction,
}: InnerProps) {
  const { getDocument } = useDocuments()
  // Both reads are defensive for the same reason: the mutator machine may not
  // have this document yet, and both `getDocument` and `doc.get()` throw
  // rather than returning undefined. A throw here is not a broken toolbar, it
  // is a broken preview — see draftPatch.ts.
  const doc = tryGetDocument(getDocument, documentId)
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | undefined>(() =>
    doc ? initialDraftSnapshot(doc) : undefined,
  )

  // The sync getter is empty until the machine has fetched the document —
  // settle it asynchronously once, so the names are right a frame later
  // rather than never.
  useEffect(() => {
    if (snapshot || !doc) return
    let cancelled = false
    void doc.getSnapshot().then((settled) => {
      if (!cancelled && settled) setSnapshot(settled as unknown as Record<string, unknown>)
    })
    return () => {
      cancelled = true
    }
  }, [doc, snapshot])

  const typeAt = (at: string) => resolveGroqPath(snapshot, `${at}._type`)

  // The band's own name. The hovered node IS the block only at the band level,
  // so that is the one zone where the comlink title is about this block rather
  // than about a leaf inside it.
  const component = componentName({
    storedType: typeAt(blockPath),
    ...(level === 'band' ? { schemaTitle } : {}),
  })

  // The chip names the innermost keyed item, or — where none encloses the
  // cursor — the field the cursor is on. The band itself is already named by
  // the bar, so it gets no chip.
  const subjectPath = itemPath ?? (level === 'band' ? undefined : path)
  const subject = subjectPath
    ? subjectName({
        path: subjectPath,
        storedType: typeAt(subjectPath),
        // Only when the hovered node IS the subject: otherwise `field`
        // describes a leaf inside it and would name the wrong thing.
        ...(path === subjectPath ? { schemaTitle } : {}),
      })
    : undefined

  // Dock the bar at the BAND's corner, imperatively through a callback ref —
  // no setState-in-effect cascade, and the deltas are read at the moment they
  // are written.
  //
  // Re-dock on scroll (React 19 ref cleanup): the deltas are scroll-invariant
  // for the above-the-band dock, but a CLAMPED position is viewport-relative,
  // so without this a wheel scroll with the pointer parked drags the bar
  // off-screen with the band until the next mousemove re-renders it.
  const barRef = useRef<HTMLDivElement | null>(null)
  const dockBar = (el: HTMLDivElement | null) => {
    if (!el) return
    barRef.current = el
    const dock = () => dockToAnchor(el, { element, anchorPath: blockPath, dodgeStockAction })
    dock()
    const win = el.ownerDocument.defaultView
    win?.addEventListener('scroll', dock, { passive: true, capture: true })
    return () => {
      win?.removeEventListener('scroll', dock, { capture: true })
      barRef.current = null
    }
  }

  // The chip pins INSIDE the item's own top-right corner. Rendered after the
  // bar, so `barRef` is populated by the time this ref runs and the chip can
  // dodge a bar clamped on the same corner.
  //
  // No item, or an item this subtree does not attribute: the chip keeps its
  // `top-0 right-0` class position, which IS the hovered element's corner.
  const dockChip = (el: HTMLDivElement | null) => {
    if (!el || !itemPath) return
    const anchor = findAttributedElement(element, itemPath)
    if (!anchor) return
    const dock = () => {
      const pos = computeChipDock({
        anchor: anchor.getBoundingClientRect(),
        element: element.getBoundingClientRect(),
        chip: { width: el.offsetWidth, height: el.offsetHeight },
        avoid: barRef.current?.getBoundingClientRect() ?? null,
      })
      el.style.right = `${pos.right}px`
      el.style.top = `${pos.top}px`
    }
    dock()
    const win = el.ownerDocument.defaultView
    win?.addEventListener('scroll', dock, { passive: true, capture: true })
    return () => win?.removeEventListener('scroll', dock, { capture: true })
  }

  return (
    <CanvasToolbarView
      componentName={component}
      subjectName={subject}
      barRef={dockBar}
      chipRef={dockChip}
    />
  )
}

/**
 * The overlay component the resolver attaches. Everything it decides is a
 * gate; the rendering lives one level down so that the hooks below never run
 * on a page that is not inside Presentation.
 */
export const CanvasToolbar: OverlayComponent<CanvasToolbarProps> = ({
  PointerEvents,
  node,
  element,
  field,
  level = 'field',
  blockPath,
  itemPath,
}) => {
  // DRAFT EDITING ONLY. `VisualEditing` itself mounts only in draft mode, but
  // the draft cookie survives leaving Presentation — browsing the site
  // standalone with drafts on would otherwise still show the toolbar. The
  // connected environment is the honest question: is a Studio on the other end
  // of this comlink.
  const environment = useVisualEditingEnvironment()
  const inPresentation =
    environment === 'presentation-iframe' || environment === 'presentation-window'
  if (!inPresentation || !('path' in node) || !blockPath) return null

  return (
    <PointerEvents>
      <CanvasToolbarInner
        level={level}
        blockPath={blockPath}
        itemPath={itemPath}
        documentId={node.id}
        path={node.path}
        element={element}
        schemaTitle={field?.title}
        dodgeStockAction={environment === 'presentation-window'}
      />
    </PointerEvents>
  )
}

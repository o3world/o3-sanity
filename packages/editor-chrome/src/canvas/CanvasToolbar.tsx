'use client'

import { useEffect, useRef, useState } from 'react'
import type { OverlayComponent } from '@sanity/visual-editing'
import { useDocuments, useVisualEditingEnvironment } from '@sanity/visual-editing/react'
import type { BlockKnobs, ResolvedKnob } from '@o3/block-spec'

import { barKnobs, blockKnobReader } from './barKnobs'
import { CanvasToolbarView } from './CanvasToolbarView'
import { computeChipDock, dockToAnchor, findAttributedElement } from './dock'
import { commitPatch, initialDraftSnapshot, tryGetDocument } from './draftPatch'
import { componentName, subjectName } from './identity'
import { resolveGroqPath } from './groqPath'
import { knobPatch } from './knobPatch'
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
 * THE CHAIN (#109), end to end and all of it visible from here:
 *
 *     the draft snapshot  →  blockKnobReader(snapshot, blockPath)
 *                         →  barKnobs({spec, read, nested})     the controls
 *     a pick              →  knobPatch(blockPath, name, value)  the patches
 *                         →  commitPatch                        the draft
 *                         →  the preview repaints
 *
 * Everything with a rule in it — which knobs apply, what each currently reads,
 * what a pick writes — is a pure function above this file. What is left is the
 * snapshot, the commit, and the settle.
 *
 * THE KNOB SPECS ARRIVE AS A PROP. This package knows the knob VOCABULARY
 * (`@o3/block-spec`, zero dependencies) and no block's declarations: the site
 * hands its own registry in through `createCanvasComponents`. An import of
 * `@o3/sanity` here would make the shareable overlay depend on this repo's
 * schema package for a lookup the app can just as easily perform.
 */

// A type alias rather than an interface: `OverlayComponent` constrains its
// props to `Record<string, unknown>`, and only an alias gets the implicit
// index signature that satisfies it.
export type CanvasToolbarProps = {
  level?: CanvasLevel
  blockPath?: string
  itemPath?: string
  /**
   * The block sits in another block's array, so it forms no band of its own and
   * its band knobs drop — the host owns the strip. Passed straight to
   * `visibleKnobs({nested})`.
   */
  nested?: boolean
  /**
   * Every block's declared knobs, keyed by `_type` — the site's registry,
   * handed in by `createCanvasComponents`. A type absent from it has no knobs
   * DECLARED YET (ADR 0020 is a migration in progress), which is not the same
   * as having none, so the bar stays silent about it rather than saying so.
   */
  blockKnobs?: Readonly<Record<string, BlockKnobs>>
}

interface InnerProps {
  level: CanvasLevel
  blockPath: string
  itemPath: string | undefined
  nested: boolean
  blockKnobs: Readonly<Record<string, BlockKnobs>>
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
  nested,
  blockKnobs,
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

  // WHAT THE BAR OFFERS. The block names its own type, the site's registry
  // turns that into a declaration, and `barKnobs` answers the rest. Own-
  // property guard because the key comes from a document: a block stored as
  // `constructor` would otherwise resolve to something off Object.prototype.
  const blockType = typeAt(blockPath)
  const spec =
    typeof blockType === 'string' && Object.prototype.hasOwnProperty.call(blockKnobs, blockType)
      ? blockKnobs[blockType]
      : undefined
  const knobs = spec ? barKnobs({ spec, read: blockKnobReader(snapshot, blockPath), nested }) : []

  /**
   * A pick, committed to the draft.
   *
   * SETTLE AFTER, NEVER BESIDE. Dropping the snapshot re-arms the effect above,
   * which re-pulls it — and only once the mutation has landed. Re-reading it
   * synchronously beside the commit reads the draft before the write, so the
   * control snaps back to the old value and then quietly corrects itself.
   *
   * The repaint an editor sees is not this refetch: the mutator's own local
   * rebase reaches `useOptimistic` in the page's block renderer immediately,
   * which is what makes the pick land on the click rather than a second later.
   * This is only what makes the CONTROL agree with it.
   */
  const pickKnob = (resolved: ResolvedKnob, value: string) => {
    if (!doc) return
    void commitPatch(doc, knobPatch(blockPath, resolved.knob.name, value), {
      onSettle: () => setSnapshot(undefined),
      onError: (error: unknown) => {
        // A rejected patch used to arrive as an unhandled rejection while the
        // bar sat there looking like it had worked.
        console.error(`[canvas] could not set ${resolved.knob.name} on ${blockPath}`, error)
      },
    })
  }

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
      knobs={knobs}
      onPickKnob={pickKnob}
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
  nested = false,
  blockKnobs = {},
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
        nested={nested}
        blockKnobs={blockKnobs}
        documentId={node.id}
        path={node.path}
        element={element}
        schemaTitle={field?.title}
        dodgeStockAction={environment === 'presentation-window'}
      />
    </PointerEvents>
  )
}

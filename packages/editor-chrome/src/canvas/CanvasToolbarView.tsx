import { useEffect, useRef, useState, type Ref } from 'react'
import type { ResolvedKnob } from '@o3/block-spec'

import type { ItemAction } from './itemActions'
import { KnobControl } from './KnobControl'
import { KnobMenu } from './KnobMenu'
import type { OptionGlyphs } from './OptionGlyph'
import {
  CANVAS_CHROME_ATTR,
  dismissesMenu,
  type KnobMenuAction,
  type KnobMenuModel,
} from './menuModel'

/**
 * THE CANVAS TOOLBAR'S PIXELS — three surfaces, and the one piece of state that
 * belongs to pixels rather than to the document.
 *
 *   [ Hero │ COMPOSITION Orbital ▾ │ SURFACE Ink ▾ ]  ← the bar, at the band's
 *                        [ Panel ]                    ← the chip, at the item's
 *                     ┌─────────────┐                 ← the knob menu, at the
 *                     │ …everything │                   pointer, on right-click
 *                     └─────────────┘
 *
 * The bar carries `knob.bar` and the menu carries the whole roster; that split
 * is why both exist (#110). One state slot holds whichever is open, so a bar
 * dropdown and the knob menu can never be on screen together.
 *
 * Split from `CanvasToolbar` so it can be rendered from a test: this app's
 * render layer mounts components through `react-dom/server`, which runs no
 * effects and provides no Presentation context, so a component that calls
 * `useDocuments()` is unreachable from it. Everything decided is decided
 * above; everything here is props. It is the same split `EditorToolbarView`
 * already makes for the corner chip on the site.
 *
 * Both surfaces are positioned by their refs (see `dock.ts`), not by their
 * classes — the bar has no default position at all, and the chip's `top-0
 * right-0` is the overlay wrapper's own corner, which is the right answer when
 * the item it wants is not attributed.
 *
 * WHY LITERAL COLOURS AND NOT TOKENS. This is Studio chrome painted over the
 * page, not page content. A brand token here would change the overlay's colour
 * with a rebrand and — worse — camouflage it against any band that happened to
 * use the same token. Two colours because there are two things being named:
 * the component you are in, and the item you are on.
 */

/** The band's colour. Dark orange rather than a light fill: the bar names the
 *  largest box on screen, and a pale chip at that size reads as a highlight
 *  over the content rather than a label for it. */
const BAR_COLOR = '#c2410c'

/** Sanity's own focus blue — the item is what an editor points at most, so it
 *  keeps the colour every other Presentation surface already uses. */
const CHIP_COLOR = '#2276fc'

export interface CanvasToolbarViewProps {
  /** The component the band holds. Absent until something can name it. */
  componentName?: string | undefined
  /** The keyed item or field under the cursor. */
  subjectName?: string | undefined
  /** The bar-visible knobs, already gated and resolved (`barKnobs`). */
  knobs?: readonly ResolvedKnob[]
  /** Commit a pick. The view knows nothing about drafts or patches. */
  onPickKnob?: (knob: ResolvedKnob, value: string) => void
  /**
   * The right-click menu's roster (#110) — the subject's COMPLETE set, against
   * the bar's curated subset above. Absent means no menu opens at all, which is
   * what a test rendering only the bar gets.
   */
  menu?: KnobMenuModel
  /** A menu action. Today there is one, and it jumps to the Studio form. */
  onMenuAction?: (action: KnobMenuAction) => void
  /** Duplicate / Remove / Move (#111) — a mutation the row already carries. */
  onItemAction?: (action: ItemAction) => void
  barRef?: Ref<HTMLDivElement>
  chipRef?: Ref<HTMLDivElement>
  /**
   * Positions the menu panel at the pointer. Curried rather than a plain `Ref`
   * because the position is not a property of the element — it is where the
   * right-click happened, and only this component knows that.
   */
  menuDock?: (el: HTMLDivElement | null, pointer: { x: number; y: number }) => void
  /**
   * Name → drawing, for the knobs whose options describe themselves as glyphs
   * (`optionPreview: 'glyph'`). The site's own icons, handed down rather than
   * imported — this package draws Studio chrome and owns none of the page's
   * pictures.
   */
  glyphs?: OptionGlyphs
}

/**
 * WHICH SURFACE IS OPEN — one slot, so at most one menu exists at a time
 * across the bar's dropdowns and the knob menu. Two open menus on a bar this
 * narrow overlap each other, and a knob menu opened behind a dropdown is a menu
 * an editor has to dismiss twice.
 */
type OpenSurface =
  /** A bar dropdown, keyed by knob path — what is unique within a block. */
  | { kind: 'knob'; name: string }
  /** The knob menu, at the viewport point the right-click happened. */
  | { kind: 'menu'; x: number; y: number }
  | null

export function CanvasToolbarView({
  componentName,
  subjectName,
  knobs = [],
  onPickKnob,
  menu,
  onMenuAction,
  onItemAction,
  barRef,
  chipRef,
  menuDock,
  glyphs,
}: CanvasToolbarViewProps) {
  // The one thing the chrome decides for itself: it is about these pixels and
  // nothing else reads it.
  const [open, setOpen] = useState<OpenSurface>(null)

  // A mirror the window listeners can read. They are registered once, so their
  // closure never sees a later `open` — and two of them have to know whether
  // anything is open BEFORE React re-renders (Escape decides from it whether to
  // let the event through). Every write goes through `setOpenSurface`, so the
  // ref cannot drift from the state.
  const openRef = useRef<OpenSurface>(null)
  const setOpenSurface = (next: OpenSurface | ((current: OpenSurface) => OpenSurface)) => {
    const value = typeof next === 'function' ? next(openRef.current) : next
    openRef.current = value
    setOpen(value)
  }

  /**
   * PREEMPT THE STOCK CONTEXT MENU — capture phase, on the window.
   *
   * Presentation registers its own `contextmenu` handler capture-phase ON THE
   * ELEMENT, and it fires only where the hovered element's own path ends in a
   * keyed segment. Deferring to it therefore produces two menus on a panel and
   * one in band padding, which is not a rule anyone can hold. A capture-phase
   * listener on the WINDOW runs before any element listener, so preempting is
   * the only way to get one menu everywhere.
   *
   * `stopPropagation` is the load-bearing half, and not for the stock menu.
   * The controller also registers `handleBlur` on the window in the BUBBLE
   * phase, and a right-click that reaches it wipes the hover stack — which is
   * what forced the prior art's synthetic-mouseenter dance before it could jump
   * to the form. Stopping propagation at window-capture skips the window's own
   * bubble listeners, the hover survives, and the jump becomes an ordinary
   * click.
   *
   * ON THE WINDOW, BUT NOT ALWAYS-ON. A custom overlay component mounts only
   * for the HOVERED element (`ElementOverlay.tsx:594` — a non-hovered element
   * renders a bare positioned div with no children), and `element/mouseenter`
   * clears `hovered` on every other element. So this listener exists exactly
   * once, exactly while the pointer is on something attributed — which is
   * exactly when a right-click can want it. Where nothing is hovered there is
   * no listener and the browser's own menu appears, which is the right answer
   * for the site header. Anything that must survive the hover belongs beside
   * `<VisualEditing />` instead, not here.
   *
   * BAIL ON `defaultPrevented` anyway. Only one instance can be mounted, so
   * this is insurance rather than the mechanism — but `stopPropagation` does
   * not suppress a sibling listener in the same phase, and `defaultPrevented`
   * is the only thing one instance could see of another if that ever changed.
   */
  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      event.preventDefault()
      event.stopPropagation()
      setOpenSurface({ kind: 'menu', x: event.clientX, y: event.clientY })
    }
    /**
     * Escape dismisses — and, WHEN SOMETHING WAS OPEN, stops there. The
     * controller's own Escape handler empties the hover stack and blurs the
     * overlay, so letting it through would close the menu and drop the chrome
     * with it: one keystroke doing two things, only one of which was asked for.
     * With nothing open, Escape is the controller's again and deselects as it
     * always did.
     */
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !openRef.current) return
      event.stopPropagation()
      setOpenSurface(null)
    }
    // Pointerdown rather than click, because the menu has to be gone before
    // whatever was pressed reacts; and capture, so a handler that stops
    // propagation cannot strand it open.
    const onPointerDown = (event: PointerEvent) => {
      if (!openRef.current) return
      if (dismissesMenu(event.target as Element | null)) setOpenSurface(null)
    }
    window.addEventListener('contextmenu', onContextMenu, { capture: true })
    window.addEventListener('keydown', onKeyDown, { capture: true })
    window.addEventListener('pointerdown', onPointerDown, { capture: true })
    return () => {
      window.removeEventListener('contextmenu', onContextMenu, { capture: true })
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      window.removeEventListener('pointerdown', onPointerDown, { capture: true })
    }
    // Registered once for the toolbar's life: `setOpenSurface` writes through a
    // ref, so nothing here goes stale and nothing re-subscribes per render.
  }, [])

  return (
    <>
      {componentName ? (
        // `pb-1` and not a margin: the overlay drops the hover the moment the
        // pointer crosses ground that is not chrome, so the gap between the
        // bar and the band's outline has to be transparent padding INSIDE the
        // bar's own hit area. A margin here is a strip the pointer cannot
        // cross, and the bar vanishes on the way to it.
        <div
          ref={barRef}
          // Marks the whole bar — triggers and their open dropdowns alike — as
          // ground an outside-pointerdown does not count as outside. One
          // attribute on the container exempts every opener it holds.
          {...{ [CANVAS_CHROME_ATTR]: '' }}
          data-testid="canvas-toolbar"
          className="pointer-events-auto absolute pb-1"
        >
          <div
            style={{ background: BAR_COLOR }}
            className="flex items-stretch rounded-[3px] text-white shadow-sm"
          >
            <span className="max-w-56 self-center truncate whitespace-nowrap px-2 py-1 text-[11px] font-semibold">
              {componentName}
            </span>
            {knobs.map((resolved) => (
              // A hairline rather than a gap: the controls have to be
              // contiguous with each other and with the name, or the pointer
              // crosses ground that is not chrome on its way along the bar and
              // the whole overlay drops.
              <div
                key={resolved.knob.name}
                className="flex border-l border-white/25"
                data-testid="canvas-knob-slot"
              >
                <KnobControl
                  knob={resolved}
                  open={open?.kind === 'knob' && open.name === resolved.knob.name}
                  onToggle={() =>
                    setOpenSurface((current) =>
                      current?.kind === 'knob' && current.name === resolved.knob.name
                        ? null
                        : { kind: 'knob', name: resolved.knob.name },
                    )
                  }
                  onPick={(value) => {
                    setOpenSurface(null)
                    onPickKnob?.(resolved, value)
                  }}
                  glyphs={glyphs}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {subjectName ? (
        // Still inert: the label must not swallow a click on the thing it
        // names, and an item's knobs are delivered by the knob menu (#110)
        // rather than here — the bar cannot say WHICH item it would configure,
        // which is exactly why item knobs are not on it.
        <div
          ref={chipRef}
          data-testid="canvas-identity"
          style={{ background: CHIP_COLOR }}
          className="pointer-events-none absolute right-0 top-0 max-w-56 truncate whitespace-nowrap rounded-bl-[3px] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
        >
          {subjectName}
        </div>
      ) : null}
      {menu && open?.kind === 'menu' ? (
        <KnobMenu
          model={menu}
          onPick={(resolved, value) => {
            setOpenSurface(null)
            onPickKnob?.(resolved, value)
          }}
          onAction={(action) => {
            // Closed BEFORE the action runs. The jump is a real click on the
            // hovered element, and a menu still painted over that element is a
            // menu the click has to travel through.
            setOpenSurface(null)
            onMenuAction?.(action)
          }}
          onItemAction={(action) => {
            // Closed first here too, and for a sharper reason: Remove deletes
            // the element this whole overlay is anchored to. A menu left open
            // over a subject that no longer exists is a menu positioned against
            // a rect that has stopped meaning anything.
            setOpenSurface(null)
            onItemAction?.(action)
          }}
          panelRef={(el) => menuDock?.(el, { x: open.x, y: open.y })}
          glyphs={glyphs}
        />
      ) : null}
    </>
  )
}

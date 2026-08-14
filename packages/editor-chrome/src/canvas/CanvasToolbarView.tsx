import { useState, type Ref } from 'react'
import type { ResolvedKnob } from '@o3/block-spec'

import { KnobControl } from './KnobControl'

/**
 * THE CANVAS TOOLBAR'S PIXELS — two surfaces, and the one piece of state that
 * belongs to pixels rather than to the document.
 *
 *   [ Hero │ COMPOSITION Orbital ▾ │ SURFACE Ink ▾ ]  ← the bar, at the band's
 *                        [ Panel ]                    ← the chip, at the item's
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
  barRef?: Ref<HTMLDivElement>
  chipRef?: Ref<HTMLDivElement>
}

export function CanvasToolbarView({
  componentName,
  subjectName,
  knobs = [],
  onPickKnob,
  barRef,
  chipRef,
}: CanvasToolbarViewProps) {
  // WHICH MENU IS OPEN is the one thing the bar decides for itself: it is about
  // this bar's pixels and nothing else reads it, and it must be exclusive —
  // two menus open at once overlap each other on a bar this narrow. Keyed by
  // knob path because that is what is unique within a block.
  const [openKnob, setOpenKnob] = useState<string | null>(null)

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
                  open={openKnob === resolved.knob.name}
                  onToggle={() =>
                    setOpenKnob((current) =>
                      current === resolved.knob.name ? null : resolved.knob.name,
                    )
                  }
                  onPick={(value) => {
                    setOpenKnob(null)
                    onPickKnob?.(resolved, value)
                  }}
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
    </>
  )
}

import type { Ref } from 'react'

/**
 * THE CANVAS TOOLBAR'S PIXELS — two surfaces, no behaviour.
 *
 *   [ Rail panels section ]            ← the section bar, at the band's corner
 *                        [ Panel ]     ← the identity chip, at the item's
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
  barRef?: Ref<HTMLDivElement>
  chipRef?: Ref<HTMLDivElement>
}

export function CanvasToolbarView({
  componentName,
  subjectName,
  barRef,
  chipRef,
}: CanvasToolbarViewProps) {
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
          </div>
        </div>
      ) : null}
      {subjectName ? (
        // Inert for now: the label must not swallow a click on the thing it
        // names. #109 adds the item's own controls beside it, and those take
        // the pointer back one span at a time.
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

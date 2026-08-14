/**
 * WHERE A SURFACE DOCKS — the canvas toolbar's geometry, kept out of the
 * component so the math is testable and the **anchor is a parameter**.
 *
 * The overlay wrapper Presentation renders us into tracks the HOVERED
 * element's rect. A surface that wants to sit somewhere else — the section bar
 * at the band's corner, the identity chip at the item's own corner —
 * therefore expresses its position as rect DELTAS between its anchor and that
 * wrapper. Both rects come from the same page flow, so the deltas are
 * scroll-invariant and can be written imperatively from a callback ref with no
 * setState-in-effect cascade.
 *
 * Three rules here look arbitrary and are each a bug that shipped:
 *
 *   - **Padding, never margin.** The overlay drops the hover the moment the
 *     pointer crosses ground that is not chrome, so a naked strip between two
 *     pieces of chrome is a gap the pointer cannot survive. Spacing is
 *     transparent padding inside the hit area.
 *   - **Clamp inside the band** when its top edge is at or above the viewport
 *     top, or the bar rides off-screen with a tall section scrolled into.
 *   - **An `avoid` rect**, so two surfaces never share a corner — a clamped
 *     section bar sits exactly where a first-row item's chip wants to be, and
 *     paints over it.
 *
 * The DOM-touching half is deliberately thin and structurally typed: the
 * `unit` project runs in Node with no document, so anything this module needs
 * from an element is declared as an interface a test can fake.
 */

/** The members of a DOMRect this math reads — so tests need no layout engine. */
export interface RectLike {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * GROQ `sections[_key=="a"].panels[_key=="b"]` → `sections:a.panels:b`, the
 * form `createDataAttribute` writes into `data-sanity` (a `_key` filter
 * collapses to `name:key`).
 */
export function groqPathToAttr(path: string): string {
  return path.replace(/\[_key=="([^"]+)"\]/g, ':$1')
}

/**
 * The `path=` field of a `data-sanity` value, which is a `;`-separated
 * `key=value` list — `id=page;type=page;path=sections:a;base=%2Fstudio`.
 *
 * Split and compare rather than match a regex against the whole attribute:
 * an exact string comparison cannot mistake `panels:c1` for a prefix of
 * `panels:c11`, and there is no path syntax left to escape.
 */
export function attrPath(attr: string | null | undefined): string | undefined {
  if (!attr) return undefined
  for (const part of attr.split(';')) {
    if (part.startsWith('path=')) return part.slice('path='.length)
  }
  return undefined
}

/**
 * What this module needs from a DOM element, and no more. `Element` satisfies
 * it; so does a three-line object in a Node test.
 */
export interface AttributedNode<T> {
  getAttribute(name: string): string | null
  readonly parentElement: T | null
}

/**
 * The element attributed with exactly `groqPath`, from the hovered element
 * upwards. An ancestor walk suffices for both of this ticket's anchors: the
 * band encloses everything inside it, and the identity chip only ever pins to
 * the innermost item under the cursor, which is by construction a prefix of
 * the hovered element's own path.
 *
 * Null when nothing on the way up carries that path — an unattributed subtree
 * (a `layoutSection` column, #115), or a block whose header the schema does
 * not give it. Callers fall back to the hovered element's own corner.
 */
export function findAttributedElement<T extends AttributedNode<T>>(
  from: T | null,
  groqPath: string,
): T | null {
  const wanted = groqPathToAttr(groqPath)
  for (let el = from; el; el = el.parentElement) {
    if (attrPath(el.getAttribute('data-sanity')) === wanted) return el
  }
  return null
}

/** Kept clear of the viewport edge when the bar has to clamp inside the band. */
export const DOCK_VIEWPORT_MARGIN = 4

/** Gap left between the bar and the stock action when they share a corner. */
export const STOCK_ACTION_GAP = 4

export interface DockInput {
  /** The anchor's viewport rect — the band, or the hovered element itself. */
  anchor: RectLike
  /** The overlay wrapper's viewport rect (always the hovered element's). */
  element: RectLike
  /** Rendered height of the bar, which decides whether it fits above. */
  toolbarHeight: number
  /** Horizontal room to yield to a stock action in the same corner. */
  stockActionWidth?: number
  /**
   * Another surface's viewport rect this one must not sit on. Vertical-span
   * check only — bars right-align to nearly the same corner, so a horizontal
   * test would buy little and cost the bar's own width as an input.
   */
  avoid?: RectLike | null
}

/**
 * Offsets relative to the overlay wrapper. Exactly one of `top`/`bottom` is a
 * number; the other is null and its CSS side is released to `auto`.
 */
export interface DockPosition {
  right: number
  top: number | null
  bottom: number | null
}

/**
 * Above the anchor's top edge — unless that edge is at or off the viewport top
 * (a tall section scrolled into, or the first band on the page), where the bar
 * clamps INSIDE the anchor so it stays reachable. The same idea as
 * Presentation's own `[data-flipped]`, but measured against the anchor rather
 * than the hovered element.
 */
export function computeDock({
  anchor,
  element,
  toolbarHeight,
  stockActionWidth = 0,
  avoid,
}: DockInput): DockPosition {
  const right = element.right - anchor.right + stockActionWidth
  // The candidate's viewport top under each branch, for the avoid check.
  const clamped = anchor.top - toolbarHeight < DOCK_VIEWPORT_MARGIN
  const candidateTop = clamped
    ? Math.max(anchor.top, DOCK_VIEWPORT_MARGIN)
    : anchor.top - toolbarHeight
  if (avoid && candidateTop < avoid.bottom && candidateTop + toolbarHeight > avoid.top) {
    // FLUSH against the avoided surface, no margin: any gap between two pieces
    // of chrome is a strip the pointer cannot cross without losing the hover.
    // The bar's own transparent padding supplies the visual separation.
    return { right, top: avoid.bottom - element.top, bottom: null }
  }
  if (clamped) {
    return { right, top: candidateTop - element.top, bottom: null }
  }
  return { right, top: null, bottom: element.bottom - anchor.top }
}

/**
 * THE MEASURED CLAMP, in one function — used by the knob menu (which opens at
 * the pointer) and by every dropdown on the bar (which opens under its trigger).
 *
 * How far a panel has to move horizontally to sit inside the viewport. Positive
 * moves it right, negative left, zero leaves it alone.
 *
 * #109 shipped the bar's dropdowns with a FIXED right-alignment rule instead —
 * correct while the bar is docked at the band's right corner, and wrong the
 * moment the bar clamps near the left edge, where the same rule opens the menu
 * leftwards off the band. A measured clamp has no such precondition, and it is
 * three lines.
 *
 * The left edge wins when a panel is wider than the viewport: the right-edge
 * correction is applied first and then re-checked, so what survives is the edge
 * where reading starts rather than the edge where it ends.
 */
export function viewportShiftX(
  rect: { left: number; right: number },
  viewportWidth: number,
  margin: number = DOCK_VIEWPORT_MARGIN,
): number {
  let shift = 0
  if (rect.right > viewportWidth - margin) shift = viewportWidth - margin - rect.right
  if (rect.left + shift < margin) shift = margin - rect.left
  return shift
}

export interface MenuDockInput {
  /** Where the right-click happened, in viewport coordinates. */
  pointer: { x: number; y: number }
  /** The overlay wrapper's viewport rect — what the returned offsets are relative to. */
  element: RectLike
  /** The panel's own rendered size. */
  menu: { width: number; height: number }
  viewport: { width: number; height: number }
}

/**
 * WHERE THE KNOB MENU OPENS — at the pointer, flipped into the viewport.
 *
 * A context menu belongs under the cursor: that is where the eye already is,
 * and it is the one position that needs no travel to reach. What it must not do
 * is extend past the preview's edge. Options pushed outside the iframe are not
 * merely clipped — the pointer leaving the iframe drops the overlay's hover,
 * which unmounts the toolbar and takes the menu with it. So the panel FLIPS to
 * open leftwards (or upwards) rather than being clipped, and then clamps, in
 * that order: flipping first keeps the pointer on a corner of the panel, and
 * clamping alone would slide the panel out from under the cursor.
 */
export function computeMenuDock({ pointer, element, menu, viewport }: MenuDockInput): {
  left: number
  top: number
} {
  const flippedLeft =
    pointer.x + menu.width > viewport.width - DOCK_VIEWPORT_MARGIN
      ? pointer.x - menu.width
      : pointer.x
  const flippedTop =
    pointer.y + menu.height > viewport.height - DOCK_VIEWPORT_MARGIN
      ? pointer.y - menu.height
      : pointer.y
  return {
    left: Math.max(flippedLeft, DOCK_VIEWPORT_MARGIN) - element.left,
    top: Math.max(flippedTop, DOCK_VIEWPORT_MARGIN) - element.top,
  }
}

export interface ChipDockInput {
  /** The ITEM's viewport rect — the chip pins inside its top-right corner. */
  anchor: RectLike
  /** The overlay wrapper's viewport rect (the hovered element's). */
  element: RectLike
  /** The chip's own rendered size, for the overlap test. */
  chip: { width: number; height: number }
  /**
   * The section bar's viewport rect. A bar CLAMPED inside the band (band top
   * scrolled off) can sit exactly on a first-row item's corner, where it
   * paints over the chip. Overlap slides the chip FLUSH below the bar.
   */
  avoid?: RectLike | null
}

/**
 * The identity chip sits INSIDE its anchor's top-right corner — unlike the
 * bar, which docks above its anchor — using the same delta idea, relative to
 * the overlay wrapper.
 *
 * Pinning the chip to the ITEM rather than to the hovered leaf is what will
 * make its controls reachable at all once #109 puts any there: en route to the
 * corner the pointer crosses the item's inner stega'd leaves, each hover
 * re-attribution remounts the toolbar, and a chip that docks per-leaf jumps
 * away from the approaching pointer on every remount.
 */
export function computeChipDock({ anchor, element, chip, avoid }: ChipDockInput): {
  right: number
  top: number
} {
  const right = element.right - anchor.right
  const overlaps =
    avoid &&
    anchor.top < avoid.bottom &&
    anchor.top + chip.height > avoid.top &&
    anchor.right - chip.width < avoid.right &&
    anchor.right > avoid.left
  const top = overlaps ? avoid.bottom : anchor.top
  return { right, top: top - element.top }
}

/** The subset of an element's inline style this module writes. */
export interface DockStyleTarget {
  style: { right: string; left: string; top: string; bottom: string }
}

export function applyDock(el: DockStyleTarget, position: DockPosition): void {
  el.style.right = `${position.right}px`
  el.style.left = 'auto'
  if (position.top !== null) {
    el.style.top = `${position.top}px`
    el.style.bottom = 'auto'
  } else {
    el.style.bottom = `${position.bottom ?? 0}px`
    el.style.top = 'auto'
  }
}

/**
 * The stock "Open in Studio" action renders at the hovered element's top-right
 * ONLY in the popped-out Presentation window (it is hidden in the iframe). It
 * is the overlay wrapper's only `<a>`, so measuring it is a query rather than
 * a guess; when absent there is nothing to dodge.
 */
function measureStockAction(toolbar: HTMLElement): number {
  const action = toolbar.offsetParent?.querySelector('a')
  if (!action) return 0
  return Math.ceil(action.getBoundingClientRect().width) + STOCK_ACTION_GAP
}

export interface DockToAnchorOptions {
  /** The hovered element — the overlay wrapper's own rect. */
  element: Element
  /**
   * The GROQ path of the element to dock against. Omitted (or unattributed in
   * this subtree) means the hovered element itself, which is also the right
   * answer for a surface that belongs to whatever is under the cursor.
   */
  anchorPath?: string
  /** Popped-out Presentation window: the stock action shares this corner. */
  dodgeStockAction: boolean
  avoid?: RectLike | null
}

/**
 * The callback-ref body: resolve the anchor, measure, write. The stock action
 * only shares the corner when the anchor IS the hovered element — otherwise
 * the bar has already moved away from it.
 */
export function dockToAnchor(toolbar: HTMLElement, opts: DockToAnchorOptions): void {
  const anchor =
    (opts.anchorPath && findAttributedElement(opts.element, opts.anchorPath)) || opts.element
  const stockActionWidth =
    opts.dodgeStockAction && anchor === opts.element ? measureStockAction(toolbar) : 0
  applyDock(
    toolbar,
    computeDock({
      anchor: anchor.getBoundingClientRect(),
      element: opts.element.getBoundingClientRect(),
      toolbarHeight: toolbar.offsetHeight,
      stockActionWidth,
      avoid: opts.avoid,
    }),
  )
}

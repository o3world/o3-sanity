import { describe, expect, it } from 'vitest'

import {
  applyDock,
  attrPath,
  computeChipDock,
  computeDock,
  computeMenuDock,
  DOCK_VIEWPORT_MARGIN,
  findAttributedElement,
  groqPathToAttr,
  STOCK_ACTION_GAP,
  viewportShiftX,
  type DockStyleTarget,
  type RectLike,
} from './dock'

const rect = (r: Partial<RectLike>): RectLike => ({ top: 0, right: 0, bottom: 0, left: 0, ...r })

/** A panel mid-band: the wrapper tracks the PANEL, the bar docks to the band. */
const band = rect({ top: 400, right: 1200, bottom: 900, left: 0 })
const panel = rect({ top: 500, right: 700, bottom: 640, left: 400 })

describe('computeDock', () => {
  it('docks above the band, right-aligned to it', () => {
    const pos = computeDock({ anchor: band, element: panel, toolbarHeight: 24 })
    // Right: the wrapper's right edge is 500px left of the band's, so the bar
    // reaches back out to the band corner with a negative inset.
    expect(pos.right).toBe(700 - 1200)
    // Bottom: sits on the band's top edge, measured up from the wrapper's base.
    expect(pos.bottom).toBe(640 - 400)
    expect(pos.top).toBeNull()
  })

  it('clamps inside the band when its top edge is above the viewport', () => {
    const scrolled = rect({ ...band, top: -300 })
    const pos = computeDock({ anchor: scrolled, element: panel, toolbarHeight: 24 })
    // Clamped to the viewport margin rather than the band's off-screen top.
    expect(pos.top).toBe(DOCK_VIEWPORT_MARGIN - panel.top)
    expect(pos.bottom).toBeNull()
  })

  it('clamps when the band top is on-screen but too close to fit the bar above', () => {
    const nearTop = rect({ ...band, top: 10 })
    const pos = computeDock({ anchor: nearTop, element: panel, toolbarHeight: 24 })
    // 10 − 24 < 4, so it flips inside — anchored at the band's own top edge,
    // which is still below the margin.
    expect(pos.top).toBe(10 - panel.top)
    expect(pos.bottom).toBeNull()
  })

  it('stays above when there is exactly enough room', () => {
    const justEnough = rect({ ...band, top: 28 })
    const pos = computeDock({ anchor: justEnough, element: panel, toolbarHeight: 24 })
    // 28 − 24 === 4, which is not < 4 — the bar keeps its place above.
    expect(pos.bottom).toBe(panel.bottom - 28)
    expect(pos.top).toBeNull()
  })

  it('shifts left of the stock action when they share the corner', () => {
    const plain = computeDock({ anchor: band, element: panel, toolbarHeight: 24 })
    const dodged = computeDock({
      anchor: band,
      element: panel,
      toolbarHeight: 24,
      stockActionWidth: 96 + STOCK_ACTION_GAP,
    })
    expect(dodged.right).toBe(plain.right + 96 + STOCK_ACTION_GAP)
  })

  it('collapses to the element’s own corner when it IS the anchor', () => {
    const pos = computeDock({ anchor: panel, element: panel, toolbarHeight: 24 })
    expect(pos.right).toBe(0)
    expect(pos.bottom).toBe(panel.bottom - panel.top)
  })

  // Two surfaces must never share a corner. The case that produced the rule:
  // a section bar clamped inside the band (tall section scrolled into view)
  // sitting exactly where a second bar hugging the band's top wants to be.
  describe('avoid rect', () => {
    /** A block-level surface at the band top; its above-dock occupies y 76..100. */
    const header = rect({ top: 100, right: 1100, bottom: 300, left: 100 })
    /** A section bar clamped at the viewport top, overlapping that span. */
    const sectionBar = rect({ top: 4, right: 1200, bottom: 32, left: 800 })

    it('re-docks FLUSH below the avoid rect when the above-dock would overlap it', () => {
      const overlapping = rect({ ...header, top: 20, bottom: 220 })
      const pos = computeDock({
        anchor: overlapping,
        element: overlapping,
        toolbarHeight: 24,
        avoid: sectionBar,
      })
      expect(pos.top).toBe(sectionBar.bottom - overlapping.top)
      expect(pos.bottom).toBeNull()
    })

    it('keeps the normal above-dock when the avoid rect is clear of it', () => {
      const clear = computeDock({
        anchor: header,
        element: header,
        toolbarHeight: 24,
        avoid: sectionBar,
      })
      // 100 − 24 = 76, below the section bar's bottom (32): no overlap.
      expect(clear.bottom).toBe(header.bottom - header.top)
      expect(clear.top).toBeNull()
    })

    it('pushes a CLAMPED position below the avoid rect too', () => {
      const scrolled = rect({ ...header, top: -50, bottom: 150 })
      const pos = computeDock({
        anchor: scrolled,
        element: scrolled,
        toolbarHeight: 24,
        avoid: sectionBar,
      })
      expect(pos.top).toBe(sectionBar.bottom - scrolled.top)
      expect(pos.bottom).toBeNull()
    })

    it('ignores a null avoid', () => {
      const pos = computeDock({ anchor: header, element: header, toolbarHeight: 24, avoid: null })
      expect(pos.bottom).toBe(header.bottom - header.top)
    })
  })
})

describe('computeChipDock', () => {
  const chip = { width: 80, height: 18 }

  it('is zero when the anchor IS the hovered element', () => {
    const self = { top: 100, right: 500, bottom: 300, left: 200 }
    expect(computeChipDock({ anchor: self, element: self, chip })).toEqual({ right: 0, top: 0 })
  })

  it('offsets a leaf wrapper out to the enclosing item’s corner', () => {
    const item = { top: 100, right: 500, bottom: 300, left: 200 }
    const leaf = { top: 150, right: 400, bottom: 180, left: 220 }
    // right: leaf.right − item.right = −100 → the chip is pushed 100px PAST
    // the wrapper's right edge, landing on the item's; top: item.top −
    // leaf.top = −50 → 50px above the wrapper's top, landing on the item's.
    expect(computeChipDock({ anchor: item, element: leaf, chip })).toEqual({
      right: -100,
      top: -50,
    })
  })

  it('slides flush below an overlapping section bar', () => {
    const item = { top: 100, right: 500, bottom: 300, left: 200 }
    const bar = { top: 96, right: 510, bottom: 124, left: 300 }
    expect(computeChipDock({ anchor: item, element: item, chip, avoid: bar })).toEqual({
      right: 0,
      top: 24, // avoid.bottom (124) − element.top (100)
    })
  })

  it('ignores a bar that does not reach the chip', () => {
    const item = { top: 100, right: 500, bottom: 300, left: 200 }
    // Vertically clear of the chip's 18px strip…
    const above = { top: 60, right: 510, bottom: 90, left: 300 }
    // …and horizontally clear of its 80px right-aligned span.
    const farLeft = { top: 96, right: 380, bottom: 124, left: 220 }
    expect(computeChipDock({ anchor: item, element: item, chip, avoid: above })).toEqual({
      right: 0,
      top: 0,
    })
    expect(computeChipDock({ anchor: item, element: item, chip, avoid: farLeft })).toEqual({
      right: 0,
      top: 0,
    })
  })
})

describe('applyDock', () => {
  const target = () => ({ style: {} }) as unknown as DockStyleTarget

  it('releases the opposite side to auto when docking above', () => {
    const node = target()
    applyDock(node, { right: -500, top: null, bottom: 240 })
    expect(node.style).toEqual({ right: '-500px', left: 'auto', bottom: '240px', top: 'auto' })
  })

  it('releases the opposite side to auto when clamped inside', () => {
    const node = target()
    applyDock(node, { right: 0, top: -496, bottom: null })
    expect(node.style).toEqual({ right: '0px', left: 'auto', top: '-496px', bottom: 'auto' })
  })
})

describe('groqPathToAttr', () => {
  it('collapses _key filters to the name:key form createDataAttribute emits', () => {
    expect(groqPathToAttr('sections[_key=="abc"].panels[_key=="p-1"]')).toBe(
      'sections:abc.panels:p-1',
    )
    expect(groqPathToAttr('sections[_key=="abc"].heading')).toBe('sections:abc.heading')
    expect(groqPathToAttr('sections')).toBe('sections')
  })
})

describe('attrPath', () => {
  it('reads the path out of the encoded attribute', () => {
    expect(attrPath('id=page-index;type=page;path=sections:abc;base=%2Fstudio')).toBe(
      'sections:abc',
    )
  })

  it('has no answer for an absent or path-less attribute', () => {
    expect(attrPath(null)).toBeUndefined()
    expect(attrPath('')).toBeUndefined()
    expect(attrPath('id=page-index;type=page')).toBeUndefined()
  })
})

describe('findAttributedElement', () => {
  interface FakeNode {
    getAttribute(name: string): string | null
    parentElement: FakeNode | null
  }

  const node = (path: string | null, parentElement: FakeNode | null = null): FakeNode => ({
    getAttribute: (name) =>
      name === 'data-sanity' && path ? `id=page-index;type=page;path=${path};base=%2Fstudio` : null,
    parentElement,
  })

  it('walks up from a leaf to the element carrying that path', () => {
    const bandEl = node('sections:abc')
    const item = node('sections:abc.panels:p1', bandEl)
    const leaf = node(null, item)

    expect(findAttributedElement(leaf, 'sections[_key=="abc"].panels[_key=="p1"]')).toBe(item)
    expect(findAttributedElement(leaf, 'sections[_key=="abc"]')).toBe(bandEl)
  })

  it('finds the element when it IS the hovered one', () => {
    const bandEl = node('sections:abc')
    expect(findAttributedElement(bandEl, 'sections[_key=="abc"]')).toBe(bandEl)
  })

  it('matches the whole path, never a prefix of a longer one', () => {
    // The comparison is an equality, so `panels:p11` cannot answer for
    // `panels:p1` — the failure a regex over the raw attribute invites.
    const item = node('sections:abc.panels:p11')
    expect(findAttributedElement(item, 'sections[_key=="abc"].panels[_key=="p1"]')).toBeNull()
  })

  it('is null in an unattributed subtree, so the caller can fall back', () => {
    // What a layoutSection column looks like until #115: attributed nowhere.
    const leaf = node(null, node(null))
    expect(findAttributedElement(leaf, 'sections[_key=="abc"]')).toBeNull()
    expect(findAttributedElement(null, 'sections[_key=="abc"]')).toBeNull()
  })
})

describe('sliding an opened dropdown back inside the viewport', () => {
  // #109 shipped a fixed right-alignment rule and flagged it: right for a bar
  // docked at the band's right corner, wrong for a bar CLAMPED near the left
  // edge, which opens its menu leftwards off the band. This is the measurement
  // that has no such precondition.
  it('leaves a panel already inside the viewport alone', () => {
    expect(viewportShiftX({ left: 400, right: 620 }, 1200)).toBe(0)
  })

  it('pulls a panel back from the right edge by exactly the overhang', () => {
    expect(viewportShiftX({ left: 1100, right: 1260 }, 1200)).toBe(
      -(1260 - 1200 + DOCK_VIEWPORT_MARGIN),
    )
  })

  it('pushes a panel back from the left edge', () => {
    expect(viewportShiftX({ left: -30, right: 130 }, 1200)).toBe(30 + DOCK_VIEWPORT_MARGIN)
  })

  it('keeps the LEFT edge when a panel is wider than the viewport', () => {
    // Both corrections apply; the one that survives is the edge where reading
    // starts, so the first option is visible rather than the last.
    const shift = viewportShiftX({ left: 0, right: 1400 }, 1200)
    expect(0 + shift).toBe(DOCK_VIEWPORT_MARGIN)
  })
})

describe('where the knob menu opens', () => {
  const wrapper = rect({ top: 100, right: 900, bottom: 400, left: 200 })
  const viewport = { width: 1200, height: 800 }
  const menu = { width: 240, height: 300 }

  it('opens at the pointer, as offsets from the overlay wrapper', () => {
    expect(
      computeMenuDock({ pointer: { x: 500, y: 250 }, element: wrapper, menu, viewport }),
    ).toEqual({ left: 500 - 200, top: 250 - 100 })
  })

  it('flips leftwards near the right edge rather than being clipped', () => {
    // A panel pushed outside the iframe is not clipped, it is unreachable: the
    // pointer leaving the frame drops the overlay hover and closes the menu.
    const { left } = computeMenuDock({
      pointer: { x: 1150, y: 250 },
      element: wrapper,
      menu,
      viewport,
    })
    expect(left).toBe(1150 - menu.width - 200)
  })

  it('flips upwards near the bottom edge', () => {
    const { top } = computeMenuDock({
      pointer: { x: 500, y: 780 },
      element: wrapper,
      menu,
      viewport,
    })
    expect(top).toBe(780 - menu.height - 100)
  })

  it('clamps to the viewport margin when the flip would overshoot the other edge', () => {
    // A menu wider than the room on either side: flipping puts it off the LEFT,
    // so the clamp catches it. Flip first, clamp second — clamping alone would
    // slide the panel out from under the cursor.
    const wide = { width: 400, height: 300 }
    const { left } = computeMenuDock({
      pointer: { x: 300, y: 250 },
      element: wrapper,
      menu: wide,
      viewport: { width: 320, height: 800 },
    })
    expect(left).toBe(DOCK_VIEWPORT_MARGIN - 200)
  })
})

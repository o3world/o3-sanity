import { describe, expect, it } from 'vitest'

import {
  MAX_INK_LUMA,
  PARTNER_STRIP,
  darkestInk,
  normalizeLogoSvg,
  placement,
  svgSize,
} from './logoCanvas'

const wide =
  '<svg xmlns="http://www.w3.org/2000/svg" width="422" height="48" viewBox="0 0 422 48" fill="none"><path d="M0 0h1v1H0z" fill="#1B1D27"/></svg>'
const narrow =
  '<svg xmlns="http://www.w3.org/2000/svg" width="67" height="32" fill="none"><path d="M0 0h1v1H0z"/></svg>'

describe('svgSize', () => {
  it('prefers the viewBox over the width and height attributes', () => {
    const svg = '<svg width="960" height="96" viewBox="0 0 480 48"></svg>'
    expect(svgSize(svg)).toEqual({ width: 480, height: 48 })
  })

  it('falls back to width and height when there is no viewBox', () => {
    expect(svgSize(narrow)).toEqual({ width: 67, height: 32 })
  })

  it('refuses a file it cannot size rather than guessing a box', () => {
    expect(() => svgSize('<svg width="100%" height="100%"></svg>')).toThrow(/viewBox/)
    expect(() => svgSize('<html></html>')).toThrow(/not an SVG/)
  })
})

describe('placement', () => {
  it('fills the box width for a mark wider than the box', () => {
    const box = placement({ width: 422, height: 48 }, PARTNER_STRIP)
    expect(box.width).toBeCloseTo(PARTNER_STRIP.boxWidth)
    expect(box.height).toBeLessThan(PARTNER_STRIP.boxHeight)
  })

  it('caps a narrow mark at the box height rather than stretching it wide', () => {
    const box = placement({ width: 67, height: 32 }, PARTNER_STRIP)
    expect(box.height).toBeCloseTo(PARTNER_STRIP.boxHeight)
    expect(box.width).toBeLessThan(PARTNER_STRIP.boxWidth)
  })

  it('centres what it places', () => {
    const box = placement({ width: 67, height: 32 }, PARTNER_STRIP)
    expect(box.x * 2 + box.width).toBeCloseTo(PARTNER_STRIP.width)
    expect(box.y * 2 + box.height).toBeCloseTo(PARTNER_STRIP.height)
  })

  it('never scales a mark up past the box', () => {
    const box = placement({ width: 4000, height: 4000 }, PARTNER_STRIP)
    expect(box.width).toBeLessThanOrEqual(PARTNER_STRIP.boxWidth + 1e-9)
    expect(box.height).toBeLessThanOrEqual(PARTNER_STRIP.boxHeight + 1e-9)
  })
})

describe('normalizeLogoSvg', () => {
  it('gives every mark the same outer dimensions', () => {
    for (const source of [wide, narrow]) {
      expect(svgSize(normalizeLogoSvg(source))).toEqual({
        width: PARTNER_STRIP.width,
        height: PARTNER_STRIP.height,
      })
    }
  })

  it('keeps the source markup and its own coordinate system intact', () => {
    const out = normalizeLogoSvg(wide)
    expect(out).toContain('<path d="M0 0h1v1H0z" fill="#1B1D27"/>')
    expect(out).toContain('viewBox="0 0 422 48"')
    expect(out.match(/<svg\b/g)).toHaveLength(2)
    expect(out.match(/<\/svg>/g)).toHaveLength(2)
  })

  it('gives a source with no viewBox one, so nesting cannot rescale it', () => {
    expect(normalizeLogoSvg(narrow)).toContain('viewBox="0 0 67 32"')
  })

  it('is deterministic — the same bytes in, the same bytes out', () => {
    expect(normalizeLogoSvg(wide)).toBe(normalizeLogoSvg(wide))
  })

  it('drops an XML declaration ahead of the root element', () => {
    const out = normalizeLogoSvg(`<?xml version="1.0"?>\n${narrow}`)
    expect(out.startsWith('<svg xmlns=')).toBe(true)
  })
})

describe('darkestInk', () => {
  const ink = (hex: string) => `<svg><path fill="${hex}"/></svg>`

  it('reads black as 0 and white as 1', () => {
    expect(darkestInk(ink('#000000'))).toBe(0)
    expect(darkestInk(ink('#ffffff'))).toBeCloseTo(1)
  })

  it('reports the darkest of several fills, not the first', () => {
    const svg = '<svg><path fill="#EEEEEE"/><path fill="#1B1D27"/></svg>'
    expect(darkestInk(svg)).toBeLessThan(MAX_INK_LUMA)
  })

  it('separates a full-strength mark from a dimmed one', () => {
    expect(darkestInk(ink('#272A2E'))!).toBeLessThan(MAX_INK_LUMA)
    expect(darkestInk(ink('#1B1D27'))!).toBeLessThan(MAX_INK_LUMA)
    // PUMA's dimmed variant on sanity.io — the case this exists for.
    expect(darkestInk(ink('#9EA6B3'))!).toBeGreaterThan(MAX_INK_LUMA)
  })

  it('expands three-digit hex', () => {
    expect(darkestInk(ink('#000'))).toBe(0)
  })

  it('passes a file that names no colour rather than guessing', () => {
    expect(darkestInk('<svg><path fill="none"/></svg>')).toBeNull()
  })
})

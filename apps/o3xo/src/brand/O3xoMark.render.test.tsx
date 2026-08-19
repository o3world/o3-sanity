import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { O3xoMark } from './O3xoMark'

/**
 * O3XO's mark, against the component set it is read from — `O3XO` (`4212:374`,
 * Logos canvas `4212:229`).
 *
 * The boxes and fills asserted here are the kit's own node values, not this
 * file's arithmetic, which is what makes the test disagree with the component
 * when someone rebuilds the geometry from a screenshot. There is no story
 * layer for `apps/o3xo` yet, so this stands in for one.
 */
const html = (node: React.ReactElement) => renderToStaticMarkup(node)

describe('the lockup', () => {
  it('draws the horizontal lockup at the kit’s 390.85 × 120 box (`4212:373`)', () => {
    expect(html(<O3xoMark />)).toContain('viewBox="0 0 391 120"')
  })

  it('draws the stacked lockup square, as `4212:435` is', () => {
    expect(html(<O3xoMark layout="stacked" />)).toContain('viewBox="0 0 140 141"')
  })

  it('is two different drawings, not one box holding the other’s paths', () => {
    const horizontal = html(<O3xoMark />)
    const stacked = html(<O3xoMark layout="stacked" />)
    expect(stacked).not.toBe(horizontal)
    // Four paths either way — O, 3, the star X, the ring O.
    for (const drawing of [horizontal, stacked]) {
      expect(drawing.match(/<path /g) ?? []).toHaveLength(4)
    }
  })

  it('is decorative, so the link around it carries the label', () => {
    expect(html(<O3xoMark />)).toContain('aria-hidden="true"')
  })

  it('takes a height and keeps the box’s proportion', () => {
    // 391 / 120 × 64, rounded — a lockup asked for one dimension must not be
    // squeezed into a square.
    expect(html(<O3xoMark height={64} />)).toContain('height="64"')
    expect(html(<O3xoMark height={64} />)).toContain('width="208.53"')
  })
})

describe('the Color axis', () => {
  it('sets O3 in white and XO in the accent role, in `2 color` (`4212:385`)', () => {
    const two = html(<O3xoMark />)
    expect(two).toContain('fill-white')
    expect(two).toContain('fill-accent')
  })

  it('draws the whole lockup in one ink in `White` and `Black`', () => {
    const white = html(<O3xoMark color="white" />)
    expect(white).toContain('fill-white')
    expect(white).not.toContain('fill-accent')

    const black = html(<O3xoMark color="black" />)
    expect(black).toContain('#030303')
    expect(black).not.toContain('fill-accent')
    expect(black).not.toContain('fill-white')
  })
})

describe('the Background axis', () => {
  it('draws no plate by default — the lockup takes the surface it is on', () => {
    expect(html(<O3xoMark />)).not.toContain('<rect')
    expect(html(<O3xoMark layout="stacked" />)).not.toContain('<rect')
  })

  it('grows the box by the plate’s padding rather than shrinking the lockup', () => {
    // `4212:385` is 471 × 200 around the same 390.85 × 120 lockup: 40 a side.
    expect(html(<O3xoMark background />)).toContain('viewBox="0 0 471 200"')
    // `4212:413` — 200 square around the stacked mark.
    expect(html(<O3xoMark layout="stacked" background />)).toContain('viewBox="0 0 200 200"')
  })

  it('plates the light variants on the kit’s black and the dark one on its grey', () => {
    expect(html(<O3xoMark background />)).toContain('fill-[#030303]')
    expect(html(<O3xoMark color="white" background />)).toContain('fill-[#030303]')
    // `4212:395` — a Black lockup needs a light plate to sit on.
    expect(html(<O3xoMark color="black" background />)).toContain('fill-[#e5e7eb]')
  })
})

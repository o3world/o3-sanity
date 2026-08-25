import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SectionProps } from '@o3/content-runtime/blocks'

import { LogoWallSection } from './LogoWallSection'

/**
 * The band has one arrangement again, and it is not the one this file was
 * written for: the 2026-08 frame (`1864:2390`, #89) replaced the 3 × 2 wall of
 * large marks with a single centred ROW of six hairlined 280 × 280 plates,
 * deliberately wider than the page.
 *
 * What is guarded here is the part of that composition a browser cannot be
 * relied on to show an agent: the row is one row and not a grid, the plates
 * are square, the seams between them collapse to a single hairline, and the
 * strip bleeds past the gutter WITHOUT becoming a scroll region — the last one
 * being the 402 regression `home.render.test` exists to stop.
 *
 * The logos are `null`: `SanityImage` renders nothing for an absent asset, and
 * what is under test is the row, not the pictures.
 */
const CLIENTS = ['vertex', 'ironman', 'chop', 'lacolombe', 'caron', 'hireheroes'].map((id) => ({
  _id: id,
  name: id,
  logo: null,
}))

const html = renderToStaticMarkup(
  <LogoWallSection
    {...({
      eyebrow: 'Our Partners',
      heading: "Trusted by organizations shaping what's next.",
      body: 'From Fortune 500 enterprises to high-growth organizations.',
      clients: CLIENTS,
      surface: 'bone',
    } as unknown as SectionProps<'logoWallSection'>)}
  />,
)

const tiles = html.match(/<li[^>]*>/g) ?? []
/** The marks a reader is offered — the marquee's copies are all `aria-hidden`. */
const spoken = tiles.filter((tile) => !tile.includes('aria-hidden'))

describe('the partners band', () => {
  it('renders the eyebrow, the heading and the standfirst as three parts', () => {
    // The `statement` field was one node; the frame's Text frame is three,
    // stacked at gap 32. A renderer that dropped the standfirst would still
    // look plausible, which is why the count is asserted rather than eyeballed.
    expect(html).toContain('Our Partners')
    expect(html).toContain('<h2')
    expect(html).toContain('Trusted by organizations shaping what&#x27;s next.')
    expect(html).toContain('From Fortune 500 enterprises')
  })

  it('draws the heading solid, not gradient-filled', () => {
    // `1864:2393` binds the ink variable where it used to co-anchor
    // `--gradient-statement`. The token survives on the pull quote; reaching
    // for it here is the specific mistake this guards.
    expect(html).not.toContain('text-gradient')
    expect(html).toContain('text-ink')
  })

  it('sizes the heading at the h2 step and the body at the lead pair', () => {
    // 48/58 and 24/34 — `display-xl` and `lead`, not the 64px `hero` step the
    // single statement used to ride.
    expect(html).toContain('text-display-xl')
    expect(html).not.toContain('text-hero')
    expect(html).toContain('text-lead')
  })

  it('offers each client to a reader exactly once, however many copies it draws', () => {
    // The marquee lays the six marks down several times so the loop has
    // somewhere to travel; only the first copy is real. A duplicate that
    // forgot its `aria-hidden` reads the partner list out three times over.
    expect(spoken).toHaveLength(CLIENTS.length)
    expect(tiles.length).toBeGreaterThan(CLIENTS.length)
    expect(tiles.length % CLIENTS.length).toBe(0)
  })

  it('lays the tiles out as one row, not a grid', () => {
    // The wall was `grid-cols-2 lg:grid-cols-3`. Six in a row is the whole
    // point of the restructure, so a surviving grid is a failed rebuild.
    expect(html).not.toContain('grid-cols-2')
    expect(html).not.toContain('lg:grid-cols-3')
    // One clipped row at every width. The wrap that used to carry 402 is gone
    // with the marquee: a moving strip shows a phone all six marks without a
    // second composition, so there is no `lg:` switch left to make.
    expect(html).toContain('flex-nowrap')
    expect(html).not.toContain('flex-wrap')
    expect(html).not.toContain('lg:flex-nowrap')
  })

  it('gives every tile the frame’s square plate and one shared hairline', () => {
    // 280 × 280 with 64px side padding at 1440, hairlined `border-line`
    // (#D6D3CC since this band anchored the token); the smaller steps below
    // `lg` are the phone's. `-ml-px` / `-mt-px` is what collapses two adjacent
    // 1px borders into the single rule Figma's centred stroke draws — between
    // two copies of the marquee as readily as within one.
    for (const tile of tiles) {
      expect(tile).toContain('lg:size-[280px]')
      expect(tile).toContain('size-[168px]')
      expect(tile).toContain('lg:px-16')
      expect(tile).toContain('border-line')
      expect(tile).toContain('-ml-px')
      expect(tile).toContain('-mt-px')
    }
  })

  it('bleeds the strip past the gutter without making it a scroll region', () => {
    // The row is 1680 wide against a 1248 column, so it has to escape the
    // gutter and be clipped. `overflow-hidden` is the clip; an `overflow-x-*`
    // here would be a silent sideways scroll at 402 (ADR 0006).
    expect(html).toContain('-mx-gutter')
    expect(html).toContain('overflow-hidden')
    expect(html).not.toContain('overflow-x-')
    // The track takes its content width from `shrink-0`, never from `w-max`:
    // `w-max` is one of the utilities ADR 0006's 402 probe counts as a bug on
    // sight, and the clip is what makes the width safe either way.
    expect(html).not.toContain('w-max')
  })

  // The marks are desaturated too — reversed from #42, because the frame's
  // tiles carry a Figma image adjustment that renders full-colour artwork grey
  // (visible in the export of `1864:2390`, absent from the REST payload).
  // Asserted in `home.render.test`, not here: `SanityImage` renders nothing
  // for the `logo: null` fixtures above, so there is no `<img>` to check.

  it('crawls the strip, pausing under a pointer and stopping for reduced motion', () => {
    // A row clipped at both ends is a still of something travelling (Nick,
    // 2026-08-25). The two escapes are the part worth guarding: a marquee
    // nobody can pause is unreadable, and one that ignores the setting is an
    // accessibility defect rather than a taste question.
    expect(html).toContain('animate-marquee')
    expect(html).toContain('motion-reduce:animate-none')
    expect(html).toContain('hover:[animation-play-state:paused]')
    // The shift is one copy of however many were drawn — the element's, since
    // only it knows the count. Without it the keyframe holds still.
    expect(html).toMatch(/--marquee-shift:\s*-[\d.]+%/)
  })

  it('paints the warm wash rather than a flat bone', () => {
    expect(html).toContain('--gradient-surface-wash-warm')
  })
})

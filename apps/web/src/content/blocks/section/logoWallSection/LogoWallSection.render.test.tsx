import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SectionProps } from '@/content/blocks/sectionTypes'

import { LogoWallSection } from './LogoWallSection'

/**
 * The wall has one arrangement now — a 3 × 2 grid of six, standing still, at
 * size, in full colour. What this file guards is what the marquee used to
 * cost: a second pass of clones, a crawl, and a desaturating filter over every
 * mark.
 *
 * The logos are `null`: `SanityImage` renders nothing for an absent asset, and
 * what is under test is the wall, not the image.
 */
const CLIENTS = ['chop', 'ironman', 'aramark', 'amerigas', 'caron', 'lacolombe'].map((id) => ({
  _id: id,
  name: id,
  logo: null,
}))

const html = renderToStaticMarkup(
  <LogoWallSection
    {...({
      clients: CLIENTS,
      surface: 'bone',
    } as unknown as SectionProps<'logoWallSection'>)}
  />,
)

const tiles = html.match(/<li[^>]*>/g) ?? []

describe('the logo wall', () => {
  it('renders each client exactly once', () => {
    // The marquee ran two passes so `-50%` wrapped seamlessly. Nothing laps
    // now, so a second pass would just be six more logos.
    expect(tiles).toHaveLength(CLIENTS.length)
    expect(html).not.toContain('aria-hidden="true"')
  })

  it('stands still — no crawl, no pause-on-hover, nothing to bleed', () => {
    expect(html).not.toContain('animate-marquee')
    expect(html).not.toContain('animation-play-state')
    expect(html).not.toContain('overflow-hidden')
    expect(html).not.toContain('w-max')
  })

  it('lays the marks out three across, two across on a phone', () => {
    expect(html).toContain('grid-cols-2')
    expect(html).toContain('lg:grid-cols-3')
  })

  it('gives each mark room to be read — a 128px cell at lg', () => {
    // The size is the point of the wall: the marquee's tile gave a logo 68px
    // of height, and a wall of six can afford far more. The cap on the image
    // itself is asserted in `home.render.test` — these fixtures have no
    // asset, so `SanityImage` renders nothing to carry it.
    for (const tile of tiles) {
      expect(tile).toContain('h-24')
      expect(tile).toContain('lg:h-32')
    }
  })

  it('leaves the marks their own colour', () => {
    // They were `grayscale contrast-125` to make six palettes read as one
    // band; the grid does that job on geometry instead.
    expect(html).not.toContain('grayscale')
    expect(html).not.toContain('contrast-125')
  })
})

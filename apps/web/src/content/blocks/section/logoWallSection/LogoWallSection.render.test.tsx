import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SectionProps } from '@/content/blocks/sectionTypes'

import { LogoWallSection } from './LogoWallSection'

/**
 * The two arrangements this block can be in, rendered side by side.
 *
 * The homepage seed only ever exercises the marquee (`home.render.test.tsx`
 * covers it there, in the real page), so `grid` — the arrangement for a wall
 * with more logos than the frame draws — has no other reader. It is the branch
 * that must NOT pick up the lap: a wrapped grid that duplicates its tiles is
 * just a wall of twelve.
 *
 * The logos are `null`: `SanityImage` renders nothing for an absent asset, and
 * what is under test is the row, not the image.
 */
const CLIENTS = ['ironman', 'vertex', 'caron'].map((id) => ({
  _id: id,
  name: id,
  logo: null,
}))

function render(layout: 'marquee' | 'grid') {
  return renderToStaticMarkup(
    <LogoWallSection
      {...({
        clients: CLIENTS,
        layout,
        surface: 'bone',
      } as unknown as SectionProps<'logoWallSection'>)}
    />,
  )
}

const marquee = render('marquee')
const grid = render('grid')

const tilesIn = (html: string) => html.match(/<li[^>]*>/g) ?? []

describe('the logo wall as a marquee', () => {
  it('runs the tiles twice, so one copy is exactly half the track', () => {
    // `o3marquee` translates by -50%; that only wraps seamlessly if the track
    // is two identical passes.
    expect(tilesIn(marquee)).toHaveLength(CLIENTS.length * 2)
  })

  it('hides the second pass from anything that counts clients', () => {
    const clones = tilesIn(marquee).filter((tile) => tile.includes('aria-hidden="true"'))
    expect(clones).toHaveLength(CLIENTS.length)
  })

  it('keeps the second pass off the phone and out of reduced motion', () => {
    // 402 stacks the tiles (`1814:1898`) and reduced motion holds the still —
    // in both, a second pass is six more logos and nothing else.
    for (const clone of tilesIn(marquee).filter((t) => t.includes('aria-hidden="true"'))) {
      expect(clone).toContain('hidden')
      expect(clone).toContain('lg:flex')
      expect(clone).toContain('lg:motion-reduce:hidden')
    }
  })

  it('crawls only at lg, pauses under a pointer, and stops for reduced motion', () => {
    expect(marquee).toContain('lg:animate-marquee')
    expect(marquee).toContain('lg:hover:[animation-play-state:paused]')
    expect(marquee).toContain('lg:motion-reduce:animate-none')
  })

  it('spaces the row with the tile’s own margin, not the row’s gap', () => {
    // A flex gap leaves the wrap one gap short of a copy and the lap jumps.
    expect(marquee).toContain('lg:mr-12')
    expect(marquee).toContain('lg:gap-0')
  })
})

describe('the logo wall as a grid', () => {
  it('renders each client once — a wrapped wall has nothing to lap', () => {
    expect(tilesIn(grid)).toHaveLength(CLIENTS.length)
    expect(grid).not.toContain('aria-hidden="true"')
  })

  it('carries no animation at all', () => {
    expect(grid).not.toContain('animate-marquee')
    expect(grid).not.toContain('animation-play-state')
  })
})

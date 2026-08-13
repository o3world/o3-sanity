import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SectionProps } from '@/content/blocks/sectionTypes'

import { QuoteSection } from './QuoteSection'

/**
 * The pull quote's three decorations. `orbs` is the Home band (`1683:2137`),
 * `molecule` the 2026-08 case-study band (`2250:1525`, #97), `none` the opt
 * out — and the quote itself must read identically under all three.
 */
function render(decoration: string | null) {
  return renderToStaticMarkup(
    <QuoteSection
      {...({
        quote: 'Simply the best. Better than all the rest.',
        attribution: 'Business Leader, Global Health Brand',
        decoration,
        surface: 'bone',
      } as unknown as SectionProps<'quoteSection'>)}
    />,
  )
}

describe('the quote band’s molecule decoration', () => {
  const html = render('molecule')

  it('renders the mark, and not the spheres', () => {
    expect(html).toContain('viewBox="0 0 699 699"')
    expect(html).toContain('lg:w-[699px]')
    expect(html).toContain('opacity-10')
    // OrbitalSphere's own markup — the two are alternatives, never both.
    expect(html).not.toContain('lg:w-[1155px]')
  })

  it('hangs the mark off the band’s right edge and lets the band clip it', () => {
    // 699 wide at x 944 in a 1440 frame — 203px past the edge.
    expect(html).toContain('lg:right-[-203px]')
    expect(html).toContain('overflow-hidden')
    expect(html).not.toContain('overflow-x-')
  })

  it('leaves the copy exactly where the other decorations put it', () => {
    // A decoration must not move the quote. Same column, same gradient fill
    // (`2250:1527` is #030303 → 40%, which is --gradient-statement).
    expect(html).toContain('max-w-content')
    expect(html).toContain('text-gradient')
    expect(html).toContain('text-quote')
    expect(html).toContain('Simply the best.')
    expect(html).toContain('Business Leader, Global Health Brand')
  })

  it('is not announced to a reader', () => {
    expect(html).toContain('aria-hidden="true"')
  })
})

describe('the quote band’s other decorations', () => {
  it('still draws the two spheres on `orbs`', () => {
    const html = render('orbs')
    expect(html).toContain('lg:w-[1155px]')
    expect(html).toContain('lg:w-[1304px]')
    expect(html).not.toContain('viewBox="0 0 699 699"')
  })

  it('draws neither on `none`', () => {
    const html = render('none')
    expect(html).not.toContain('lg:w-[1155px]')
    expect(html).not.toContain('viewBox="0 0 699 699"')
    expect(html).toContain('Simply the best.')
  })
})

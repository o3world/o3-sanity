import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SectionProps } from '@o3/content-runtime/blocks'

import { QuoteSection } from './QuoteSection'

/**
 * The pull quote's three decorations. `molecule` is what the `Quote` set draws
 * (`2748:4672`, instanced on Home at `2748:4767` / `2748:4804`), `orbs` the
 * pre-redesign band, `none` the opt out — and the quote itself must read
 * identically under all three.
 */
function render(decoration: string | null, surface = 'bone') {
  return renderToStaticMarkup(
    <QuoteSection
      {...({
        quote: 'Simply the best. Better than all the rest.',
        attribution: 'Business Leader, Global Health Brand',
        decoration,
        surface,
      } as unknown as SectionProps<'quoteSection'>)}
    />,
  )
}

describe('the quote band’s molecule decoration', () => {
  const html = render('molecule')

  it('renders the mark, and not the spheres', () => {
    expect(html).toContain('viewBox="0 0 699 699"')
    expect(html).toContain('w-[776px]')
    expect(html).toContain('opacity-10')
    // OrbitalSphere's own markup — the two are alternatives, never both.
    expect(html).not.toContain('lg:w-[1155px]')
  })

  it('hangs the mark off the band’s bottom-left corner and lets the band clip it', () => {
    // 776 wide, 128 past the left edge and 374 below the band at 1440
    // (`2748:4767`); further out at 402, where the band is shorter.
    expect(html).toContain('lg:left-[-128px]')
    expect(html).toContain('lg:bottom-[-374px]')
    expect(html).toContain('overflow-hidden')
    expect(html).not.toContain('overflow-x-')
  })

  it('is the one decoration this band keeps at 402', () => {
    // `2748:4804` hangs the same 776px glyph off the corner and lets the
    // gutter clip it. The spheres are `lg:` — they would fill the band.
    expect(html).toContain('left-[-167px]')
    expect(html).not.toContain('hidden lg:block')
  })

  it('leaves the copy exactly where the other decorations put it', () => {
    // A decoration must not move the quote. Same column, same solid `text-fg`
    // fill — the set's #232323 (`2748:4839`), not the retired gradient.
    expect(html).toContain('max-w-content')
    expect(html).not.toContain('text-gradient')
    expect(html).toContain('text-fg')
    expect(html).toContain('text-quote')
    expect(html).toContain('Simply the best.')
    expect(html).toContain('Business Leader, Global Health Brand')
  })

  it('centres the column the way the set does, and opens the gap at 1440', () => {
    // `2748:4839` / `2748:4840` are both centred; the column gap is 24 at 402
    // (`2748:4689`) and 48 at 1440 (`2748:4838`).
    expect(html).toContain('text-center')
    expect(html).toMatch(/gap-6[^"]*lg:gap-12/)
  })

  it('sets the attribution as the eyebrow the set draws', () => {
    // 18/24 bold uppercase at 0.1em in fg-muted #76746F (`2748:4840`),
    // 16/20 at 402 (`2748:4717`) — not a 36px line at half-strength ink.
    expect(html).toMatch(/eyebrow-lg[^"]*text-fg-muted/)
    expect(html).not.toContain('text-display-lg')
    expect(html).not.toContain('max-w-article')
  })

  it('is not announced to a reader', () => {
    expect(html).toContain('aria-hidden="true"')
  })

  it('follows the band’s surface rather than a colour spelled once', () => {
    // The glyph is ink on bone and white on ink. A fixed colour here draws an
    // invisible decoration the moment an editor turns the surface knob.
    expect(html).toContain('text-ink')
    // `text-white` alone would prove nothing — the ink surface class carries
    // it. The absence of `text-ink` is what says the glyph moved with the band.
    expect(render('molecule', 'ink')).not.toContain('text-ink')
  })
})

/**
 * The eyebrow is a slot, not a string this band prints. O3 binds the renderer
 * with the slot empty — no O3 frame labels a quote — so a band that has stored
 * an eyebrow still draws nothing here.
 */
describe('the quote band’s eyebrow', () => {
  it('prints nothing of the stored label when no app fills the slot', () => {
    const html = renderToStaticMarkup(
      <QuoteSection
        {...({
          eyebrow: 'Trusted by leading organizations',
          quote: 'Simply the best. Better than all the rest.',
          decoration: 'none',
          surface: 'bone',
        } as unknown as SectionProps<'quoteSection'>)}
      />,
    )
    expect(html).not.toContain('Trusted by leading organizations')
  })

  it('draws what the app puts there, above the quote and on its column', () => {
    const html = renderToStaticMarkup(
      <QuoteSection
        {...({
          quote: 'Simply the best. Better than all the rest.',
          decoration: 'none',
          surface: 'bone',
        } as unknown as SectionProps<'quoteSection'>)}
        eyebrowSlot={<p>Trusted by leading organizations</p>}
      />,
    )
    expect(html.indexOf('Trusted by leading organizations')).toBeLessThan(
      html.indexOf('Simply the best.'),
    )
    expect(html).toMatch(/max-w-content[^"]*mb-8/)
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

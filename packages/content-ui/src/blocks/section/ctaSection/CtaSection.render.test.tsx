import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SectionProps } from '@o3/content-runtime/blocks'

import { CtaSection } from './CtaSection'

/**
 * WHICH GENERATION THE CLOSING BAND DRAWS (#163).
 *
 * The canonical `CTA` component (`2124:72`, set `2177:1354`) hangs one
 * decoration — the molecule, 775.9 square at 15%, centred — and no bleed
 * strip. `orbs` is the pre-redesign band (`1680:2132`), which is a sphere and
 * a 172px ink fade *together*: the strip exists to dissolve the sphere's lower
 * limb into the footer. So the strip follows the sphere, and the two other
 * decorations close on the component's clean edge.
 *
 * `decoration` unset draws the molecule too, so the fallback and the knob's
 * initial value say the same thing.
 */
function render(decoration: string | null | undefined) {
  return renderToStaticMarkup(
    <CtaSection
      {...({
        heading: 'Let’s get started on your next big thing.',
        body: 'We partner with businesses like yours to build experiences that matter.',
        button: { _type: 'button', label: 'Get in touch', href: '/contact', target: null },
        decoration,
        surface: 'ink',
      } as unknown as SectionProps<'ctaSection'>)}
    />,
  )
}

/** OrbitalSphere's own viewBox, which nothing else in this band draws. */
const SPHERE = 'viewBox="0 0 1000 1000"'
/** MoleculeMark's. */
const MOLECULE = 'viewBox="0 0 699 699"'
const FADE_STRIP = '--gradient-ink-fade'

describe('the CTA band’s molecule decoration', () => {
  const html = render('molecule')

  it('renders the mark, and not the sphere', () => {
    expect(html).toContain(MOLECULE)
    expect(html).toContain('opacity-15')
    expect(html).not.toContain(SPHERE)
  })

  it('centres the mark on the band and lifts it clear of the top edge', () => {
    // `2114:1195` hangs 775.9 square at x 332.05, y -63.95 on the set's
    // 1440 × 648 band, centred on it rather than rising out of the top.
    // Width  775.9 / 1440         = 53.9%.
    // Centre 332.05 + 387.95      = 720.0, the middle of 1440.
    // Rise   -63.95 / 775.9       = 8.24% of the mark's OWN height, which is
    //                               what a percentage translate resolves
    //                               against — not the band's.
    expect(html).toContain('w-[54%]')
    expect(html).toContain('left-1/2')
    expect(html).toContain('-translate-x-1/2')
    expect(html).toContain('-translate-y-[8.24%]')
  })

  it('closes on the component’s own edge, with no bleed strip', () => {
    expect(html).not.toContain(FADE_STRIP)
  })

  it('leaves the copy exactly where the other decorations put it', () => {
    expect(html).toContain('text-cta')
    expect(html).toContain('max-w-[600px]')
    expect(html).toContain('Let’s get started on your next big thing.')
    expect(html).toContain('Get in touch')
  })

  /**
   * `1680:2087` — a 600 column holding a 524 body box, gapped 18 inside and
   * 20 above the button. The two gaps are why the copy is its own column: a
   * flat one would space the button like a third line of copy.
   */
  it('measures the copy column the way the band it is drawn from does', () => {
    expect(html).toContain('max-w-[524px]')
    expect(html).toContain('max-w-[600px] flex-col items-center gap-5')
    expect(html).toContain('flex flex-col items-center gap-[18px]')
  })
})

describe('the CTA band’s other decorations', () => {
  it('draws the molecule when nothing is set, as the knob’s initial value does', () => {
    const html = render(undefined)
    expect(html).toContain(MOLECULE)
    expect(html).not.toContain(SPHERE)
    expect(html).not.toContain(FADE_STRIP)
  })

  /** The sphere and its fade are one composition — `1680:2132` holds both. */
  it('draws the sphere and its bleed strip on `orbs`', () => {
    const html = render('orbs')
    expect(html).toContain(SPHERE)
    expect(html).toContain(FADE_STRIP)
    // `1928:6596` is 172 tall, the last 18 of it past the band's floor.
    expect(html).toContain('h-[172px]')
    expect(html).not.toContain(MOLECULE)
  })

  it('draws neither, and no strip, on `none`', () => {
    const html = render('none')
    expect(html).not.toContain(SPHERE)
    expect(html).not.toContain(MOLECULE)
    expect(html).not.toContain(FADE_STRIP)
    expect(html).toContain('Let’s get started on your next big thing.')
  })
})

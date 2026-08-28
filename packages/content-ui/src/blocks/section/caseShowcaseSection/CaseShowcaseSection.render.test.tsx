import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SectionProps } from '@o3/content-runtime/blocks'

import { CaseShowcaseSection } from './CaseShowcaseSection'

/**
 * The band is ONE ink band, and that is what a browser cannot be relied on to
 * tell an agent: `data-surface` is invisible, and a wash left behind the cards
 * would read as "nearly black" in a screenshot.
 *
 * The card is a stub. `caseStudy` is app-first, so the shared package has no
 * card to draw; what is under test is the band around it.
 */
function StubCard({ title }: { title: string }) {
  return <article>{title}</article>
}

const html = renderToStaticMarkup(
  <CaseShowcaseSection
    {...({
      heading: 'Our work',
      button: null,
      caseStudies: [{ _id: 'caseStudy-one', title: 'One' }],
    } as unknown as SectionProps<'caseShowcaseSection'>)}
    cardComponents={{ caseStudy: StubCard }}
  />,
)

describe('the case showcase band', () => {
  it('paints one ink band, and declares the surface it paints', () => {
    expect(html).toContain('bg-black')
    expect(html).toContain('data-surface="ink"')
    expect(html).toContain('text-white')
  })

  it('carries no light wash behind either half', () => {
    expect(html).not.toContain('--gradient-surface-wash')
  })

  it('is one band and not two: 64px top and bottom, 64 between its rows', () => {
    expect(html).toContain('py-16')
    expect(html).toContain('gap-16')
    expect(html).not.toContain('band-sm')
  })

  it('keeps the card stack at gap 24 / 48 (ADR 0006)', () => {
    expect(html).toContain('gap-6 lg:gap-12')
  })

  it('pins each card under the chrome from the desktop breakpoint up, on an opaque wrapper', () => {
    expect(html).toContain('bg-black lg:sticky lg:top-[calc(var(--spacing-nav-offset)+96px)]')
  })

  it('leaves the cards in normal flow below it — nothing pins at 402', () => {
    expect(html).not.toContain('"sticky')
    expect(html).not.toContain(' sticky ')
  })
})

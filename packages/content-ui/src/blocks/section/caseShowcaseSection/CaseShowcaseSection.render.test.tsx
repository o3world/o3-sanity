import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SectionProps } from '@o3/content-runtime/blocks'

import { CaseShowcaseSection } from './CaseShowcaseSection'

const html = renderToStaticMarkup(
  <CaseShowcaseSection
    {...({
      heading: 'Our work',
      button: null,
      caseStudies: [{ _id: 'caseStudy-one', title: 'One' }],
    } as unknown as SectionProps<'caseShowcaseSection'>)}
  />,
)

describe('the case showcase band', () => {
  it('paints the light showcase around opaque case cards', () => {
    expect(html).toContain('bg-bone-soft')
    expect(html).toContain('data-surface="bone"')
  })

  it('carries no light wash behind either half', () => {
    expect(html).not.toContain('--gradient-surface-wash')
  })

  it('uses 64px mobile and 128px desktop padding', () => {
    expect(html).toContain('py-16')
    expect(html).toContain('lg:py-32')
    expect(html).toContain('gap-16')
    expect(html).not.toContain('band-sm')
  })

  it('keeps the card stack at the current 48px gap', () => {
    expect(html).toContain('gap-12')
  })

  it('pins each card under the chrome from the desktop breakpoint up, on an opaque wrapper', () => {
    expect(html).toContain('bg-black lg:sticky lg:top-[calc(var(--spacing-nav-pinned)+96px)]')
  })

  it('leaves the cards in normal flow below it — nothing pins at 402', () => {
    expect(html).not.toContain('"sticky')
    expect(html).not.toContain(' sticky ')
  })
})

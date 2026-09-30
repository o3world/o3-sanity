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
  it('declares the bone surface around opaque case cards', () => {
    expect(html).toContain('data-surface="bone"')
  })

  it('carries no light wash behind either half', () => {
    expect(html).not.toContain('--gradient-surface-wash')
  })

  it('uses 64px mobile padding and a 64px gap under the heading row', () => {
    expect(html).toContain('py-16')
    expect(html).toContain('gap-16')
  })

  it('keeps the card stack at the current 48px gap', () => {
    expect(html).toContain('gap-12')
  })

  it('pins each card on a rounded opaque wrapper without clipping its shadow', () => {
    expect(html).toContain(
      'rounded-case-card bg-black lg:sticky lg:top-[calc(var(--spacing-nav-pinned)+96px)]',
    )
  })

  it('leaves the cards in normal flow below it — nothing pins at 402', () => {
    expect(html).not.toContain('"sticky')
    expect(html).not.toContain(' sticky ')
  })
})

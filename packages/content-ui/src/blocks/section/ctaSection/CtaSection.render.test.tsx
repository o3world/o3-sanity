import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { CtaSection } from './CtaSection'

describe('the current gradient CTA', () => {
  it.each(['orbs', 'molecule', 'none', undefined])(
    'does not revive a stored %s decoration',
    (decoration) => {
      const markup = renderToStaticMarkup(
        <CtaSection
          {...({ heading: 'A current CTA', decoration } as unknown as SectionProps<'ctaSection'>)}
        />,
      )
      expect(markup).toContain('cta-band')
      expect(markup).not.toContain('data-orbital')
      expect(markup).not.toContain('<svg')
      expect(markup).not.toContain('cta-lag')
    },
  )
  it('preserves the author’s heading, body and destination', () => {
    const markup = renderToStaticMarkup(
      <CtaSection
        heading={'First line.\nSecond line.'}
        body="The authored message."
        button={{ _type: 'button', label: 'Contact', href: '/contact', target: null }}
      />,
    )
    expect(markup).toContain('First line.\nSecond line.')
    expect(markup).toContain('The authored message.')
    expect(markup).toContain('href="/contact"')
  })
})

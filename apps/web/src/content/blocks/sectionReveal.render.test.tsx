import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { SanityBlock } from '@o3/sanity/types'

import { BlockRenderer } from './BlockRenderer'

/**
 * THE SCROLL ENTRANCE, AT THE SEAM.
 *
 * Every band fades up as it enters the viewport, and the wiring for it is one
 * wrapper the dispatch seam is handed rather than a line in sixteen renderers.
 * What the server can be asked about is the state it ships: which bands start
 * transparent, which do not, and whether the wrapper is still the element the
 * jump link and the band attribution land on.
 *
 * The observer itself is `Reveal`'s and is exercised in its story — a server
 * render never runs the effect, which is exactly why the pre-shown state is
 * what this file pins.
 */
const page = (blocks: unknown[]) =>
  renderToStaticMarkup(<BlockRenderer blocks={blocks as SanityBlock[]} />)

const band = (key: string, anchor?: string) => ({
  _key: key,
  _type: 'quoteSection',
  surface: 'bone',
  quote: `The band called ${key}.`,
  ...(anchor ? { anchor } : {}),
})

const hero = {
  _key: 'hero',
  _type: 'heroSection',
  headlineLines: ['The opener.'],
  decoration: 'none',
}

/** The tag carrying a given id, so two attributes can be asserted as one element. */
const tagWithId = (html: string, id: string) =>
  html.match(new RegExp(`<div[^>]*\\bid="${id}"[^>]*>`))?.[0] ?? ''

describe('a section band', () => {
  it('ships transparent and offset, ready for the observer to show it', () => {
    const html = page([band('a')])

    expect(html).toContain('data-reveal')
    expect(html).toContain('translate-y-6')
    expect(html).toContain('opacity-0')
  })

  it('transitions the property the utility writes, not `transform`', () => {
    // Tailwind v4 compiles `translate-y-*` to `translate`; a transition naming
    // `transform` reaches nothing and the band would jump rather than rise.
    expect(page([band('a')])).toContain('transition-[opacity,translate]')
  })

  it('keeps the jump target and the entrance on one element', () => {
    const tag = tagWithId(page([band('a', 'how-we-work')]), 'how-we-work')

    expect(tag).toContain('data-reveal')
    expect(tag).toContain('scroll-mt-20')
  })
})

describe('the hero', () => {
  it('is painted by the server, entrance and all', () => {
    // Its h1 is the LCP element and it plays its own masked-line entrance, so
    // a wrapper that hid it until hydration would cost the measurement and
    // duplicate the animation.
    const html = page([hero])

    expect(html).not.toContain('data-reveal')
    expect(html).not.toContain('opacity-0')
  })

  it('does not take the entrance away from the bands under it', () => {
    const html = page([hero, band('a')])

    expect(html.match(/data-reveal/g)).toHaveLength(1)
  })
})

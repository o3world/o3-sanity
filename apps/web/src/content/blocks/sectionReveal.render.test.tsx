import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { SanityBlock } from '@o3/sanity/types'

import { BlockRenderer } from './BlockRenderer'

/**
 * THE SCROLL ENTRANCE, AT THE SEAM.
 *
 * Every band fades up as it enters the viewport, and the wiring for it is one
 * wrapper the dispatch seam is handed rather than a line in sixteen renderers.
 * What the server can be asked about is the state it ships: every band painted
 * — `Reveal` hides one only after hydration, and only below the viewport, so
 * the first screen never blanks or shifts while the bundle loads — and the
 * wrapper still the element the jump link and the band attribution land on.
 *
 * The observer itself is `Reveal`'s and is exercised in its story — a server
 * render never runs the effect, which is exactly why the shipped state is
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
  it('ships painted, with the entrance left to the client', () => {
    const html = page([band('a')])

    expect(html).toContain('data-reveal')
    expect(html).not.toContain('translate-y-6')
    expect(html).not.toContain('opacity-0')
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

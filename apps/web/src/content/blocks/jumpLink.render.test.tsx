import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { SanityBlock } from '@o3/sanity/types'

import { BlockRenderer } from './BlockRenderer'

/**
 * THE JUMP LINK, END TO END (#149) — an editor names a band, points a button at
 * the name, and a reader lands on the band.
 *
 * The two halves are authored in two different places and are only true
 * together, which is why they are asserted against one rendered page rather
 * than one component: the button writes `#` + what it stores, the band writes
 * what it stores as an `id`, and a difference of one character between them is
 * a link that silently goes nowhere.
 *
 * The `id` lands on the dispatch seam's own wrapper, not inside a block. Five
 * of the sixteen bands build their own `<section>` rather than use the shell,
 * so a target routed through the shell would work on eleven and miss five.
 */
const page = (blocks: unknown[]) =>
  renderToStaticMarkup(<BlockRenderer blocks={blocks as SanityBlock[]} />)

const jumpRow = (...anchors: string[]) => ({
  _key: 'row',
  _type: 'layoutSection',
  surface: 'white',
  columns: 1,
  items: [
    {
      _key: 'group',
      _type: 'buttonGroup',
      alignment: 'center',
      buttons: anchors.map((anchor, index) => ({
        _key: `b${index}`,
        _type: 'button',
        label: anchor,
        anchor,
        target: null,
      })),
    },
  ],
})

const band = (key: string, anchor?: string) => ({
  _key: key,
  _type: 'quoteSection',
  surface: 'bone',
  quote: `The band called ${key}.`,
  ...(anchor ? { anchor } : {}),
})

describe('a quick-jump row', () => {
  it('links to the names the bands below it were given', () => {
    const html = page([jumpRow('how-we-work', 'the-team'), band('a', 'how-we-work'), band('b')])

    expect(html).toContain('href="#how-we-work"')
    expect(html).toContain('id="how-we-work"')
    // The band with no anchor gets no id, so nothing on the page answers to a
    // name nobody typed.
    expect(html).not.toContain('id="b"')
  })

  it('offsets the target so it does not arrive under the pinned bar', () => {
    const html = page([band('a', 'how-we-work')])
    expect(html).toContain('scroll-mt-20')
    expect(html).toContain('lg:scroll-mt-[calc(var(--spacing-nav-offset)+96px)]')
  })

  it('gives a repeated name to the first band only', () => {
    // Which is where the browser would have sent the reader anyway; the page
    // stays valid HTML on the way there.
    const html = page([band('a', 'pricing'), band('b', 'pricing')])
    expect(html.match(/id="pricing"/g)).toHaveLength(1)
    expect(html.indexOf('id="pricing"')).toBeLessThan(html.indexOf('The band called b.'))
  })

  it('renders each jump link as an anchor element, not a control', () => {
    const html = page([jumpRow('how-we-work')])
    expect(html).toContain('<a')
    expect(html).not.toContain('<button')
  })
})

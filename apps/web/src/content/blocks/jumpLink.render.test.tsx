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
    expect(html).toContain('lg:scroll-mt-[calc(var(--spacing-nav-pinned)+96px)]')
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

const railBand = (key: string, anchor?: string) => ({
  _key: key,
  _type: 'railPanelsSection',
  surface: 'white',
  layout: 'rail',
  rail: 'label',
  heading: 'The platforms we go deep on',
  ...(anchor ? { anchor } : {}),
  panels: [
    { _key: 'plat-sanity', railLabel: 'Sanity', heading: 'Sanity', anchor: 'sanity' },
    { _key: '7721a22e1c0a', railLabel: 'Vercel', heading: 'Vercel', anchor: 'vercel' },
  ],
})

describe("a rail band's tabs", () => {
  it('link to the panel under the band name joined to the panel name', () => {
    const html = page([railBand('platforms', 'tech-platforms')])

    for (const name of ['tech-platforms-sanity', 'tech-platforms-vercel']) {
      expect(html).toContain(`href="#${name}"`)
      expect(html).toContain(`id="${name}"`)
    }
    expect(html).not.toContain('rail-panel-')
  })

  it('keep a duplicated band off the first band’s names', () => {
    // A band duplicated in the Studio carries its anchor and its panels'
    // anchors with it; only the first band gets to answer to them. The second
    // falls back to its section key, which only a document's `loc` supplies.
    const html = renderToStaticMarkup(
      <BlockRenderer
        documentId="home"
        documentType="page"
        blocks={
          [
            railBand('platforms', 'tech-platforms'),
            railBand('platforms-copy', 'tech-platforms'),
          ] as SanityBlock[]
        }
      />,
    )

    expect(html.match(/id="tech-platforms-sanity"/g)).toHaveLength(1)
    expect(html).toContain('id="rail-panel-platforms-copy-sanity"')
  })

  it('leave a band its anchor when a joined name lands on it', () => {
    const html = page([
      railBand('platforms', 'tech-platforms'),
      band('later', 'tech-platforms-sanity'),
    ])

    expect(html.match(/id="tech-platforms-sanity"/g)).toHaveLength(1)
    expect(html).toContain('href="#rail-panel-platforms-plat-sanity"')
  })
})

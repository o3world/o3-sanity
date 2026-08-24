import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Pager } from './Pager'

const href = (page: number) => (page <= 1 ? '/insights' : `/insights?page=${page}`)

/** The visible run of the row, in order — numbers, ellipses and the two ends. */
function labels(html: string): string[] {
  return [...html.matchAll(/>([^<>]+)</g)].map(([, text]) => text ?? '').filter(Boolean)
}

describe('Pager', () => {
  it('offers every page as its own link when they all fit', () => {
    const html = renderToStaticMarkup(<Pager page={1} totalPages={4} href={href} />)

    expect(labels(html)).toEqual(['1', '2', '3', '4', 'Next'])
    expect(html).toContain('href="/insights"')
    expect(html).toContain('href="/insights?page=2"')
    expect(html).toContain('href="/insights?page=3"')
    expect(html).toContain('href="/insights?page=4"')
  })

  it('draws the state the kit draws — the near pages, an ellipsis, the last', () => {
    // `4404:1821` is a snapshot of page 1 of 6: `1 2 … 6 Next`.
    const html = renderToStaticMarkup(<Pager page={1} totalPages={6} href={href} />)
    expect(labels(html)).toEqual(['1', '2', '…', '6', 'Next'])
  })

  it('keeps an ellipsis on both sides in the middle of a long collection', () => {
    const html = renderToStaticMarkup(<Pager page={5} totalPages={10} href={href} />)
    expect(labels(html)).toEqual(['Previous', '1', '…', '4', '5', '6', '…', '10', 'Next'])
  })

  it('spells a one-page gap out rather than hiding one number behind an ellipsis', () => {
    // Page 3 is the whole of the gap between 2 and 4, and `…` is wider than
    // the number it would stand for.
    const html = renderToStaticMarkup(<Pager page={1} totalPages={4} href={href} />)
    expect(labels(html)).not.toContain('…')
  })

  it('says which page you are on rather than leaving it to the fill', () => {
    const html = renderToStaticMarkup(<Pager page={2} totalPages={4} href={href} />)
    // Attribute order is Next's, so the assertion is on the one element that
    // carries both rather than on the string between them.
    const current = html.match(/<a[^>]*aria-current="page"[^>]*>/)?.[0] ?? ''
    expect(current).toContain('href="/insights?page=2"')
    expect([...html.matchAll(/aria-current="page"/g)]).toHaveLength(1)
  })

  it('gives every number a name a screen reader can read out', () => {
    const html = renderToStaticMarkup(<Pager page={2} totalPages={4} href={href} />)
    expect(html).toContain('aria-label="Page 1"')
    expect(html).toContain('aria-label="Page 4"')
  })

  it('marks the two ends up as prev/next for a crawler', () => {
    const html = renderToStaticMarkup(<Pager page={2} totalPages={4} href={href} />)
    expect(html).toContain('rel="prev"')
    expect(html).toContain('rel="next"')
  })

  it('drops Previous on the first page and Next on the last', () => {
    const first = renderToStaticMarkup(<Pager page={1} totalPages={4} href={href} />)
    expect(labels(first)).toContain('Next')
    expect(labels(first)).not.toContain('Previous')

    const last = renderToStaticMarkup(<Pager page={4} totalPages={4} href={href} />)
    expect(labels(last)).toContain('Previous')
    expect(labels(last)).not.toContain('Next')
  })

  it('renders nothing at all for a collection that fits on one page', () => {
    expect(renderToStaticMarkup(<Pager page={1} totalPages={1} href={href} />)).toBe('')
    expect(renderToStaticMarkup(<Pager page={1} totalPages={0} href={href} />)).toBe('')
  })
})

import { describe, expect, it } from 'vitest'

import { buildDocumentMetadata, siteNameOf } from './seo'

const settings = { title: 'O3' }

describe('siteNameOf', () => {
  it('is the Site Settings title, falling back to O3', () => {
    expect(siteNameOf({ title: ' Acme ' })).toBe('Acme')
    expect(siteNameOf({ title: '' })).toBe('O3')
    expect(siteNameOf(null)).toBe('O3')
  })
})

describe('buildDocumentMetadata titles', () => {
  it('leaves an ordinary title for the layout template to suffix', () => {
    const metadata = buildDocumentMetadata({ doc: { title: 'About', path: '/about' }, settings })
    expect(metadata.title).toBe('About')
    expect(metadata.openGraph?.title).toBe('About | O3')
  })

  it('never suffixes a title that already is the site name', () => {
    const metadata = buildDocumentMetadata({ doc: { title: 'O3', path: '/' }, settings })
    expect(metadata.title).toEqual({ absolute: 'O3' })
    expect(metadata.openGraph?.title).toBe('O3')
    expect(metadata.twitter?.title).toBe('O3')
  })
})

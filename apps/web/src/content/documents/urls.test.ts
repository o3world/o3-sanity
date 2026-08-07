import { describe, expect, it } from 'vitest'

import { hrefForDoc } from './urls'

/**
 * ADR 0001's flat URL space. These are the links every card, cta and sitemap
 * entry is built from, so a regression here is a site-wide broken-link event
 * rather than a single bad page.
 */
describe('hrefForDoc', () => {
  it('prefixes collection types', () => {
    expect(hrefForDoc({ _type: 'insight', slug: 'a-post' })).toBe('/insights/a-post')
    expect(hrefForDoc({ _type: 'caseStudy', slug: 'a-case' })).toBe('/work/a-case')
  })

  // Pages carry their own prefix in the slug, so they are NOT prefixed again.
  it('serves page slugs from the root, multi-segment included', () => {
    expect(hrefForDoc({ _type: 'page', slug: 'about' })).toBe('/about')
    expect(hrefForDoc({ _type: 'page', slug: 'services/ux-audit' })).toBe('/services/ux-audit')
  })

  it('maps the "index" page to the homepage rather than /index', () => {
    expect(hrefForDoc({ _type: 'page', slug: 'index' })).toBe('/')
    expect(hrefForDoc({ _type: 'page', slug: '' })).toBe('/')
  })

  it('falls back to the homepage for a missing slug or unroutable type', () => {
    expect(hrefForDoc({ _type: 'page', slug: null })).toBe('/')
    expect(hrefForDoc({ _type: 'person', slug: 'someone' })).toBe('/')
  })
})

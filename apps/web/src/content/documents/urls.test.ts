import { describe, expect, it } from 'vitest'

import { hrefForDoc, previewPathForDoc } from './urls'

/**
 * ADR 0001's flat URL space. These are the links every card, button and sitemap
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

/**
 * The Studio-side reading of the same table (#99). It feeds the "Open in
 * Presentation" action, which has to tell "this page" from "no page yet" —
 * a distinction `hrefForDoc` deliberately does not make.
 */
describe('previewPathForDoc', () => {
  it('reads the slug object Studio holds, not the projected string', () => {
    expect(previewPathForDoc({ _type: 'insight', slug: { current: 'a-post' } })).toBe(
      '/insights/a-post',
    )
    expect(previewPathForDoc({ _type: 'caseStudy', slug: { current: 'a-case' } })).toBe(
      '/work/a-case',
    )
  })

  it('serves the homepage for the "index" page', () => {
    expect(previewPathForDoc({ _type: 'page', slug: { current: 'index' } })).toBe('/')
  })

  it('keeps a multi-segment page slug whole', () => {
    expect(previewPathForDoc({ _type: 'page', slug: { current: 'ventures/rec-philly' } })).toBe(
      '/ventures/rec-philly',
    )
  })

  it('is null for a document with no slug yet — there is no page to open', () => {
    expect(previewPathForDoc({ _type: 'page', slug: null })).toBeNull()
    expect(previewPathForDoc({ _type: 'page' })).toBeNull()
    expect(previewPathForDoc({ _type: 'page', slug: { current: '' } })).toBeNull()
    expect(previewPathForDoc({ _type: 'insight', slug: {} })).toBeNull()
  })
})

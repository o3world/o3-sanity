import { describe, expect, it } from 'vitest'

import { missingDescription } from './seo'

describe('missingDescription', () => {
  it('passes a written description', () => {
    expect(missingDescription('What we do, in a sentence.', { _type: 'page' })).toBe(true)
  })

  it('warns when a page has none, since it would show the site default', () => {
    expect(missingDescription(undefined, { _type: 'page' })).toMatch(/site-wide default/)
    expect(missingDescription('   ', { _type: 'page' })).toMatch(/site-wide default/)
  })

  it('passes a document whose own summary stands in for one', () => {
    expect(missingDescription(undefined, { _type: 'insight', excerpt: 'A summary.' })).toBe(true)
    expect(
      missingDescription(undefined, { _type: 'caseStudy', narrativeHeadline: 'A headline.' }),
    ).toBe(true)
  })

  it('warns when that summary is empty too', () => {
    expect(missingDescription(undefined, { _type: 'insight', excerpt: '' })).toMatch(
      /site-wide default/,
    )
  })
})

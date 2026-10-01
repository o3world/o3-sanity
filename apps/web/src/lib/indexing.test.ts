import { describe, expect, it } from 'vitest'

import { isIndexedBuild, noindexHeaders } from './indexing'

describe('isIndexedBuild', () => {
  it('indexes only the production build', () => {
    expect(isIndexedBuild('production')).toBe(true)
    expect(isIndexedBuild('preview')).toBe(false)
    expect(isIndexedBuild('development')).toBe(false)
    expect(isIndexedBuild(undefined)).toBe(false)
  })
})

describe('noindexHeaders', () => {
  it('sends no robots header from production', () => {
    expect(noindexHeaders('production')).toEqual([])
  })

  it.each(['preview', undefined])('tells crawlers not to index any %s response', (env) => {
    expect(noindexHeaders(env)).toEqual([
      { source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ])
  })
})

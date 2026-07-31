import { describe, expect, it } from 'vitest'

import { PATH_EXCEPTIONS, checkPathParity, wpPath } from './paths'

describe('wpPath', () => {
  it('reduces a WordPress canonical to a host-free path', () => {
    expect(wpPath('https://www.o3world.com/perspectives/a-post/')).toBe('/perspectives/a-post')
  })

  it('keeps multi-segment paths intact', () => {
    expect(wpPath('https://www.o3world.com/services/ux-audit/')).toBe('/services/ux-audit')
  })

  it('reduces the front page to /', () => {
    expect(wpPath('https://www.o3world.com/')).toBe('/')
  })

  it('returns null for anything that is not a URL', () => {
    expect(wpPath('')).toBeNull()
    expect(wpPath('not a url')).toBeNull()
  })
})

describe('checkPathParity', () => {
  it('passes when the new path matches, trailing slash aside', () => {
    expect(checkPathParity('https://www.o3world.com/work/acme/', '/work/acme')).toBeNull()
  })

  it('fails when the path would move', () => {
    const issue = checkPathParity('https://www.o3world.com/work/acme/', '/case-studies/acme')
    expect(issue?.element).toBe('path parity')
    expect(issue?.detail).toContain('/work/acme')
    expect(issue?.detail).toContain('/case-studies/acme')
  })

  it('fails loud rather than passing when there is no canonical to compare', () => {
    expect(checkPathParity('', '/work/acme')?.element).toBe('path parity')
  })

  it('has no unexplained exceptions — every entry carries a reason for #24', () => {
    for (const e of PATH_EXCEPTIONS) {
      expect(e.from.startsWith('/'), e.from).toBe(true)
      expect(e.to.startsWith('/'), e.to).toBe(true)
      expect(e.reason.length, `${e.from} has no reason`).toBeGreaterThan(0)
    }
  })
})

import { describe, expect, it } from 'vitest'

import { cachePath, stubFor } from './assets'
import { freezeSvg } from './freeze'

describe('cachePath', () => {
  it('separates two transforms of one asset', () => {
    // The trap it exists for: a Sanity CDN URL names the asset in the path and
    // the size in the query, so keying on the path alone would serve the
    // homepage's 456px logo to the page that asked for 1200px.
    const asset = 'https://cdn.sanity.io/images/p/d/abc-1200x297.png'
    expect(cachePath('/assets', `${asset}?w=456`)).not.toBe(cachePath('/assets', `${asset}?w=1200`))
  })

  it('is stable, because that is the whole point of a cache', () => {
    const url = 'https://cdn.sanity.io/images/p/d/abc-1200x297.png?w=456'
    expect(cachePath('/assets', url)).toBe(cachePath('/assets', url))
  })
})

describe('stubFor', () => {
  it('gives a third-party player an empty document rather than a player', () => {
    expect(stubFor('document').body).not.toContain('script')
    expect(stubFor('script').body).toBe('')
  })
})

describe('freezeSvg', () => {
  const svg = '<svg><style>.a { animation: pulse 3s infinite }</style><g class="a"/></svg>'

  it('appends the freeze after the asset’s own styles', () => {
    const frozen = freezeSvg(svg)
    expect(frozen.indexOf('animation-iteration-count')).toBeGreaterThan(frozen.indexOf('pulse'))
    expect(frozen.endsWith('</svg>')).toBe(true)
  })

  it('leaves something that is not an SVG alone', () => {
    expect(freezeSvg('not markup')).toBe('not markup')
  })
})

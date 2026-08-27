import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { SanityBlock } from '@o3/sanity/types'

import { BlockRenderer } from './BlockRenderer'

/**
 * The scroll entrance is a property of the seam, so it is a property of both
 * brands — and a wrapper passed at four call sites is exactly the thing that
 * can be wired in one app and forgotten in the other. This app's own dispatch
 * path is what this file renders.
 */
const page = (blocks: unknown[]) =>
  renderToStaticMarkup(<BlockRenderer blocks={blocks as SanityBlock[]} />)

const band = {
  _key: 'a',
  _type: 'quoteSection',
  surface: 'bone',
  quote: 'The band.',
}

const hero = {
  _key: 'hero',
  _type: 'heroSection',
  headlineLines: ['The opener.'],
  decoration: 'none',
}

describe('O3XO’s bands', () => {
  it('ship transparent, ready for the observer to show them', () => {
    const html = page([band])

    expect(html).toContain('data-reveal')
    expect(html).toContain('translate-y-6')
  })

  it('leave the hero painted by the server', () => {
    expect(page([hero])).not.toContain('data-reveal')
  })
})

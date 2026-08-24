import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { BLOCK_REGISTRY } from './registry'

/**
 * THE BINDING, which is where an app says what it draws (ADR 0028).
 *
 * The band's icon map is O3XO's and arrives through this app's binding, not
 * through the document — so a band rendered by the registry either carries the
 * set or it does not, and nothing in the shared package can tell you which.
 * The same shape as the hero's brand mark, checked the same way.
 */
const FeatureGrid = BLOCK_REGISTRY.featureGridSection

const html = (icon?: string) =>
  renderToStaticMarkup(
    <FeatureGrid
      heading="What it enables"
      layout="stack"
      surface="white"
      features={[{ _key: 'a', _type: 'feature', heading: 'One source', icon }]}
    />,
  )

describe('a feature grid on o3xo', () => {
  it('draws the kit’s glyph for a feature that names one', () => {
    // `sparkle`'s own path, from the kit's `Phosphor Icons` set — asserted as
    // geometry rather than as a class, because a class survives the drawing
    // being wrong.
    expect(html('sparkle')).toContain('<path d="M18.5231 12.0994')
  })

  it('leaves the dotted mark standing when no feature names an icon', () => {
    expect(html()).toContain('<canvas')
    expect(html()).not.toContain('<svg')
  })
})

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SectionProps } from '@o3/content-runtime/blocks'

import { FeatureGridSection } from './FeatureGridSection'

/**
 * A feature may store an `icon` (#246), and the site has no icon set, so the
 * stored name must not change what the band draws. The compositions
 * themselves are covered by the stories.
 */
const band = (features: unknown[]) =>
  renderToStaticMarkup(
    <FeatureGridSection
      {...({
        heading: 'What it enables',
        layout: 'stack',
        features,
        surface: 'white',
      } as unknown as SectionProps<'featureGridSection'>)}
    />,
  )

const WITH_ICON = [{ _key: 'a', heading: 'One source', icon: 'sparkle' }]
const WITHOUT = [{ _key: 'a', heading: 'One source' }]

describe('a feature that names an icon', () => {
  it('renders exactly as one carrying none', () => {
    expect(band(WITH_ICON)).toBe(band(WITHOUT))
  })

  it('keeps the mark beside the copy', () => {
    // The orb is a `<canvas>`.
    expect(band(WITH_ICON)).toContain('<canvas')
  })
})

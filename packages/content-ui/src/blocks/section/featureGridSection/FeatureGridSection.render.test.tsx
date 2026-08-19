import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SectionProps } from '@o3/content-runtime/blocks'

import { FeatureGridSection } from './FeatureGridSection'

/**
 * THE ICON SLOT, from both sides of it (#246).
 *
 * A feature may name a glyph, and the drawing lives in the app rather than in
 * this package: the eighteen are the O3XO kit's, and one of the two brands
 * rendering this component has no icon set at all (ADR 0028). So the band takes
 * the map as a prop, the way the hero takes its brand mark, and what is worth
 * asserting is the pair of answers that follows — the glyph stands where the
 * mark would have, and a band handed no map renders exactly what it rendered
 * before the field existed.
 *
 * The compositions themselves are covered by the stories.
 */
const Sparkle = () => <svg data-testid="glyph" viewBox="0 0 24 24" />

const ICONS = { sparkle: Sparkle }

const band = (features: unknown[], icons?: Record<string, typeof Sparkle>) =>
  renderToStaticMarkup(
    <FeatureGridSection
      {...({
        heading: 'What it enables',
        layout: 'stack',
        features,
        surface: 'white',
        icons,
      } as unknown as SectionProps<'featureGridSection'>)}
    />,
  )

const WITH_ICON = [{ _key: 'a', heading: 'One source', icon: 'sparkle' }]
const WITHOUT = [{ _key: 'a', heading: 'One source' }]

describe('a feature that names an icon', () => {
  it('draws the glyph the app’s map resolves that name to', () => {
    expect(band(WITH_ICON, ICONS)).toContain('data-testid="glyph"')
  })

  it('puts it where the mark would have stood, rather than beside it', () => {
    const withIcon = band(WITH_ICON, ICONS)
    const withMark = band(WITHOUT, ICONS)
    // The orb is a `<canvas>`; one position, one occupant, so a band with
    // icons is not a band with two marks per row.
    expect(withMark).toContain('<canvas')
    expect(withIcon).not.toContain('<canvas')
  })

  it('is dropped, not drawn empty, when the map has never heard of the name', () => {
    const html = band([{ _key: 'a', heading: 'One source', icon: 'gear' }], ICONS)
    expect(html).not.toContain('data-testid="glyph"')
    // The mark comes back: an unresolvable name is an absent icon.
    expect(html).toContain('<canvas')
  })
})

describe('a brand with no icon set', () => {
  it('renders a feature carrying an icon exactly as one carrying none', () => {
    expect(band(WITH_ICON)).toBe(band(WITHOUT))
  })

  it('draws no glyph, whatever the document holds', () => {
    expect(band(WITH_ICON)).not.toContain('data-testid="glyph"')
  })
})

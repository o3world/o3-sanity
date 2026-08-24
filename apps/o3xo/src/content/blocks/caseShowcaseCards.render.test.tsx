import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { aCaseStudyCard } from '@o3/render-kit/fixtures'

import { BLOCK_REGISTRY } from './registry'

/**
 * The case-study card this brand's showcase band draws, through this app's
 * registry.
 *
 * The kit's `Case Study Cards` set (`4404:3072`) is a white plate with the
 * photograph in its own band across the top; O3's card composites the copy
 * over the photograph behind a scrim. Both are reachable from the same block,
 * so what has to hold is that the band and the `/case-studies` index draw the
 * same one.
 */
const CaseShowcase = BLOCK_REGISTRY.caseShowcaseSection

const html = renderToStaticMarkup(
  <CaseShowcase
    heading="Selected work"
    caseStudies={[
      aCaseStudyCard({
        _id: 'caseStudy-one',
        title: 'One',
        slug: 'one',
        narrativeHeadline: 'The deeper problem we found.',
      }),
    ]}
  />,
)

describe('the case showcase band on o3xo', () => {
  it('draws the kit card: a white plate with the photograph in its own band', () => {
    expect(html).toContain('aspect-[7/5]')
    expect(html).toContain('bg-white')
  })

  it('draws no scrim card — the composition O3 uses and the kit does not', () => {
    expect(html).not.toContain('gradient-card-scrim')
    expect(html).not.toContain('View our work')
  })

  it('still draws the band’s own heading and cards', () => {
    expect(html).toContain('Selected work')
    expect(html).toContain('The deeper problem we found.')
  })
})

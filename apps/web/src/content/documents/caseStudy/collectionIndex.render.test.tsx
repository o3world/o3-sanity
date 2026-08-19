import { describe, expect, it } from 'vitest'

import { buildIndexRoute } from '@o3/content-runtime/routes'
import {
  aCaseStudiesPage,
  aCaseStudyCard,
  renderRoute,
  unprefixedHorizontalScrollUtilities,
  variantsOf,
} from '@/test'

import { caseStudyIndex } from './collectionIndex'

/**
 * The /work index — the frames `1634:1167` (1440) and `1906:851` (402).
 *
 * #43 shipped with "mobile not yet checked" against its own acceptance
 * criteria, so the 402 assertions below are the ones that were missing, not
 * decoration: the frame stacks the cards 24px apart (`1925:5733`) where the
 * desktop grid uses 64 (`1634:1186`).
 */
const route = buildIndexRoute(caseStudyIndex)

const cards = [
  aCaseStudyCard({
    _id: 'caseStudy-seed-one',
    title: 'One',
    slug: 'one',
    narrativeHeadline: 'A workforce of 260,000 and no shared way to talk to customers.',
  }),
  aCaseStudyCard({ _id: 'caseStudy-seed-two', title: 'Two', slug: 'two' }),
]

const { html } = await renderRoute(route, { data: aCaseStudiesPage(cards, 2) })

describe('the /work index', () => {
  it('renders the hero copy the route owns', async () => {
    expect(html).toContain('The work, framed around the second problem.')
    expect(html).toContain('We lead with the deeper problem we found')
  })

  it('renders a card per case study, linked to its detail route', () => {
    expect(html).toContain('A workforce of 260,000')
    expect(html).toContain('href="/work/one"')
    expect(html).toContain('href="/work/two"')
  })

  it('uses the entry’s static metadata', async () => {
    const { metadata } = await renderRoute(route, { data: aCaseStudiesPage() })
    expect(metadata.title).toBe('Work')
  })

  describe('at 402 (ADR 0006)', () => {
    it('has no horizontally-scrolling band', () => {
      expect(unprefixedHorizontalScrollUtilities(html)).toEqual([])
    })

    it('holds the card gap at 24 until lg', () => {
      // `1925:5733` is gap 24; `1634:1186` is gap 64. The desktop value must
      // never be the unprefixed one.
      expect(variantsOf(html, 'gap-16')).toEqual(['lg:gap-16'])
      expect(variantsOf(html, 'gap-6')).toContain('gap-6')
    })

    it('lets the card grow past the frame’s 362 square rather than clipping', () => {
      // Both frames give a fixed card height; a real narrative headline is
      // five lines where the frame's demo is two, so the height is a floor.
      expect(html).toContain('min-h-[362px]')
      expect(html).toContain('lg:min-h-[556px]')
    })

    it('scrims the card top-to-bottom, keeping the 90° gradient for lg', () => {
      // `1925:5734` washes the photograph vertically — the copy spans the
      // stacked card, so there is no clear side to keep legible. The
      // left-to-right scrim only makes sense on the 1248-wide card.
      expect(html).toContain('bg-(image:--gradient-card-scrim-stacked)')
      expect(html).toContain('lg:bg-(image:--gradient-card-scrim)')
    })

    it('never lays the scrim down as an opaque plate over the photograph', () => {
      // The regression this replaced: the frame's literal values (alpha 1 out
      // to 26% across, a flat 0.6 down) crush real hero photography to
      // black-and-white. Both tokens are washes now — see `drift`.
      expect(html).not.toContain('bg-[rgba(3,3,3,0.6)]')
    })
  })
})

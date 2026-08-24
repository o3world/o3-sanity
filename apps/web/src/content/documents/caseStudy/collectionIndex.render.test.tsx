import { describe, expect, it } from 'vitest'

import { buildIndexRoute } from '@o3/content-runtime/routes'
import {
  aCaseStudiesPage,
  aCaseStudyCard,
  declaredSizes,
  preloadedImageTags,
  imageTags,
  renderRoute,
  unprefixedHorizontalScrollUtilities,
  variantsOf,
} from '@/test'

import { caseStudyIndex } from './collectionIndex'

/**
 * The /work index — the frame `1634:1167` at 1440. At 402 the card values below
 * come from `2975:8428`, the redesigned mobile frame; the manifest still tracks
 * `1906:851` for this route, which #303 settles when it reads the redesign.
 *
 * #43 shipped with "mobile not yet checked" against its own acceptance
 * criteria, so the 402 assertions below are the ones that were missing, not
 * decoration.
 *
 * The card is the `Case Study Card` set (`2089:4169`), instanced three times
 * here (`2107:1094`–`1096`) and once per breakpoint, so the stack gap is 48 at
 * both widths — `2975:8428` at 402 (#302).
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

  /**
   * The first card's photograph is 1248 × 550 in the first screen — the
   * route's LCP element (#268). It is preloaded and the rest of the stack is
   * not: a second preload only takes bandwidth from the first.
   */
  it('preloads the first card’s photograph and nothing else', async () => {
    const illustrated = [0, 1, 2].map((i) =>
      aCaseStudyCard({
        _id: `caseStudy-${i}`,
        slug: `case-${i}`,
        title: `Case ${i}`,
        heroMedia: {
          image: {
            _type: 'image',
            asset: { _type: 'reference', _ref: `image-${String(i).repeat(40)}-2400x1350-jpg` },
          },
          alt: `Photograph ${i}`,
        },
      } as never),
    )
    const { html: withPhotos } = await renderRoute(route, {
      data: aCaseStudiesPage(illustrated, 3),
    })

    // The card's picture is decorative (`alt=""` — the client logo beside it
    // carries the name), so document order is what identifies it.
    expect(preloadedImageTags(withPhotos)).toEqual([imageTags(withPhotos)[0]])
    expect(declaredSizes(withPhotos)).toEqual(Array(3).fill('(min-width: 1440px) 1248px, 90vw'))
  })

  it('pads the card 64 all round at lg', () => {
    // `2089:4169` pads uniformly; the 402 card keeps its own 32.
    expect(html).toContain('lg:p-16')
    expect(variantsOf(html, 'pb-[88px]')).toEqual([])
  })

  describe('at 402 (ADR 0006)', () => {
    it('has no horizontally-scrolling band', () => {
      expect(unprefixedHorizontalScrollUtilities(html)).toEqual([])
    })

    it('stacks the cards 48 apart at both widths', () => {
      // One value now, not a pair: `2107:1094`–`1096` sit 48 apart and so do
      // the mobile instances (`2975:8428`). A breakpoint variant here would be
      // a divergence the frames no longer draw.
      expect(variantsOf(html, 'gap-12')).toContain('gap-12')
      expect(variantsOf(html, 'gap-16')).toEqual([])
    })

    it('lets the card grow past the set’s 550 rather than clipping', () => {
      // The set fixes the card at 550 tall; a real narrative headline is five
      // lines where the demo is three, so the height is a floor. The /work
      // index's own first instance is already 592 for that reason.
      expect(html).toContain('min-h-[550px]')
      expect(variantsOf(html, 'min-h-[362px]')).toEqual([])
    })

    it('scrims the card top-to-bottom, keeping the 90° gradient for lg', () => {
      // `2975:8428` washes the photograph vertically — the copy spans the
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

  it('says where you are by marking the page you are on', async () => {
    // The pager is numbered (#241), so "where you are" is `aria-current` on
    // one of the four numbers rather than a sentence beside two arrows.
    const paged = await renderRoute(route, {
      data: aCaseStudiesPage(cards, 30),
      searchParams: { page: '2' },
    })

    const current = paged.html.match(/<a[^>]*aria-current="page"[^>]*>/)?.[0] ?? ''
    expect(current).toContain('href="/work?page=2"')
    expect([...paged.html.matchAll(/aria-current="page"/g)]).toHaveLength(1)
  })
})

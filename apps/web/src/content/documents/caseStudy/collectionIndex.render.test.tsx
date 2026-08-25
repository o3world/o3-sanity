import { describe, expect, it } from 'vitest'

import { COLLECTION_INDEX_QUERY } from '@o3/sanity/queries'

import { buildIndexRoute } from '@o3/content-runtime/routes'
import {
  aCaseStudiesPage,
  aCaseStudyCard,
  aCollectionIndex,
  aCtaBand,
  aSeededCollectionIndex,
  declaredSizes,
  preloadedImageTags,
  imageTags,
  renderRoute,
  unprefixedHorizontalScrollUtilities,
  variantsOf,
  withIndexChrome,
} from '@/test'

import { caseStudyIndex } from './collectionIndex'

/**
 * The /work index — the frame `1634:1167` at 1440 and `1906:851` at 402. The
 * card values below come from `2975:8428`, the 402 frame's own card stack.
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

const { html } = await renderRoute(route, {
  // The SEEDED chrome (#348), so the hero and closer assertions below are
  // about what the loaded dataset renders rather than about a fixture.
  data: withIndexChrome(aCaseStudiesPage(cards, 2), aSeededCollectionIndex('work')),
})

describe('the /work index', () => {
  it('renders the hero copy, now the document’s', async () => {
    // `2101:861` and `2107:1086` carry the same three strings (#303).
    // Authored since #348: the seed's `heroSection` in `sectionsAbove`.
    expect(html).toContain('Our work')
    expect(html).toContain('Strategy, Design and Technology working together.')
    expect(html).toContain('Not the deliverable.')
  })

  /**
   * The closer both frames draw (`2975:8738`, `2975:8751`) — the seed's
   * `ctaSection` since #348, which is what "/work has no document to seed one
   * on" stopped being true. Its raster is a capture of the sphere over a
   * native fade strip, so it is `orbs` rather than a photograph, and the
   * button leaves the page it closes.
   */
  it('closes on the shared CTA band', () => {
    expect(html).toContain('Let’s get started on your next big thing.')
    expect(html).toContain('We partner with businesses like yours')
    expect(html).toContain('href="/contact"')
    expect(html).toContain('--gradient-ink-fade')
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

  it('pads the card 64 all round at lg and 24 at the sides below it', () => {
    // `2089:4169` pads 64 uniformly; the 402 instances (`2975:8429`–`8431`)
    // override the sides to 24 and leave 64 top and bottom.
    expect(html).toContain('py-16')
    expect(html).toContain('px-6')
    expect(html).toContain('lg:px-16')
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

/**
 * THE AUTHORED BANDS (#348) — /work's half of what #347 built for /insights.
 *
 * The point of doing this second rather than folding it into #347 is the last
 * assertion in this block: /work has no facet, so it is the index that finds
 * out whether the route contract was shaped around Insights.
 */
describe('work index authored bands', () => {
  const feed = () => aCaseStudiesPage(cards, 2)
  const chrome = (overrides = {}) =>
    aCollectionIndex({ _id: 'collectionIndex-caseStudy', collection: 'caseStudy', ...overrides })

  it('renders a band from sectionsAbove above the first card', async () => {
    const { html: out } = await renderRoute(route, {
      data: withIndexChrome(feed(), chrome({ sectionsAbove: [aCtaBand('Above the feed')] })),
    })

    expect(out.indexOf('Above the feed')).toBeLessThan(out.indexOf('href="/work/one"'))
  })

  it('renders a band from sectionsBelow after the last card', async () => {
    const { html: out } = await renderRoute(route, {
      data: withIndexChrome(feed(), chrome({ sectionsBelow: [aCtaBand('Below the feed')] })),
    })

    expect(out.indexOf('href="/work/two"')).toBeLessThan(out.indexOf('Below the feed'))
  })

  it('renders the feed with no chrome document at all', async () => {
    const { html: out } = await renderRoute(route, { data: withIndexChrome(feed(), null) })

    expect(out).toContain('href="/work/one"')
    expect(out).toContain('href="/work/two"')
  })

  it('carries no hardcoded hero or closing copy of its own', async () => {
    const { html: out } = await renderRoute(route, { data: withIndexChrome(feed(), null) })

    expect(out).not.toContain('Strategy, Design and Technology working together.')
    expect(out).not.toContain('Let’s get started on your next big thing.')
  })

  it('reads the chrome document for the caseStudy collection', async () => {
    const { calls } = await renderRoute(route, {
      data: withIndexChrome(feed(), chrome()),
    })

    const read = calls.find((call) => call.query === COLLECTION_INDEX_QUERY)
    expect(read?.params).toMatchObject({ collection: 'caseStudy' })
    expect(read?.tags).toEqual(['sanity:collectionIndex'])
  })

  /**
   * /work declares no facets. The route builder must still hand the renderer
   * a `facets` object and a chrome document — a contract that only worked
   * where a facet existed would be one shaped around /insights.
   */
  it('paginates and reads its chrome with no facet declared at all', async () => {
    const { calls } = await renderRoute(route, {
      data: withIndexChrome(aCaseStudiesPage(cards, 20), chrome()),
      searchParams: { page: '2' },
    })

    const feedRead = calls.find(
      (call) => call.query !== COLLECTION_INDEX_QUERY && 'offset' in (call.params ?? {}),
    )
    // Nine per page, not twelve — the cards are full-width bands.
    expect(feedRead?.params).toMatchObject({ offset: 9, end: 18 })
    expect(calls.some((call) => call.query === COLLECTION_INDEX_QUERY)).toBe(true)
  })
})

/**
 * THE INDEX'S OWN SEO (#349). The same three tiers /insights has, on the route
 * with no facet — so the canonical assertion here is about pagination alone.
 */
describe('work index metadata', () => {
  const feed = () => aCaseStudiesPage(cards, 2)
  const chrome = (overrides = {}) =>
    aCollectionIndex({ _id: 'collectionIndex-caseStudy', collection: 'caseStudy', ...overrides })

  it('lets the document’s seo beat the entry’s static title', async () => {
    const { metadata } = await renderRoute(route, {
      data: withIndexChrome(feed(), chrome({ seo: { title: 'The work' } })),
    })

    expect(metadata.title).toBe('The work')
  })

  it('falls back to the entry’s static seo where the document overrides nothing', async () => {
    const { metadata } = await renderRoute(route, {
      data: withIndexChrome(feed(), chrome()),
    })

    expect(metadata.title).toBe('Work')
  })

  it('keeps the canonical on the unpaginated index for a paginated request', async () => {
    const { metadata } = await renderRoute(route, {
      data: withIndexChrome(aCaseStudiesPage(cards, 20), chrome()),
      searchParams: { page: '2' },
    })

    expect(String(metadata.alternates?.canonical)).toContain('/work')
    expect(String(metadata.alternates?.canonical)).not.toContain('page=')
  })

  it('ignores a canonical typed onto the document', async () => {
    const { metadata } = await renderRoute(route, {
      data: withIndexChrome(
        feed(),
        chrome({ seo: { canonical: 'https://example.com/elsewhere' } }),
      ),
    })

    expect(String(metadata.alternates?.canonical)).not.toContain('example.com')
  })

  /**
   * The seed's own SEO, carried from the origin site's /work archive page —
   * so the migrated description is what ships rather than a placeholder.
   */
  it('carries the seeded description from the origin site', async () => {
    const { metadata } = await renderRoute(route, {
      data: withIndexChrome(feed(), aSeededCollectionIndex('work')),
    })

    expect(metadata.description).toContain('case studies showcasing unique projects')
  })
})

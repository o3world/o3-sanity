import { describe, expect, it } from 'vitest'

import { COLLECTION_INDEX_QUERY, INSIGHTS_PAGE_QUERY } from '@o3/sanity/queries'

import { buildIndexRoute } from '@o3/content-runtime/routes'
import {
  aCollectionIndex,
  aCtaBand,
  anInsight,
  anInsightsPage,
  classTokens,
  declaredSizes,
  preloadedImageTags,
  expectNotFound,
  renderRoute,
  unprefixedHorizontalScrollUtilities,
  aSeededCollectionIndex,
  variantsOf,
  withIndexChrome,
  type FetchCall,
} from '@/test'

import { insightIndex } from './collectionIndex'

/**
 * The paginated, filterable /insights index.
 *
 * Two things on this route are real logic rather than layout: the page and
 * the category are PATH segments (#370), so a page past the end is a 404
 * rather than a clamp, and a category segment must reach the query as a GROQ
 * param and come back to the view as the chip that looks selected. Both are
 * pinned here, along with the composition the canonical frame (`2336:4310`,
 * #61) settles.
 */
const route = buildIndexRoute(insightIndex)

/**
 * Just the feed fetches. Every route also fetches Site Settings for the SEO
 * defaults tier (#26), and pagination assertions are about the feed.
 */
function feedCalls(calls: readonly FetchCall[]): readonly FetchCall[] {
  return calls.filter((call) => call.query === INSIGHTS_PAGE_QUERY)
}

function manyInsights(count: number) {
  return Array.from({ length: count }, (_, i) =>
    anInsight({
      _id: `insight-${i}`,
      title: `Insight ${i}`,
      slug: `insight-${i}`,
    }),
  )
}

const CATEGORIES = [
  { title: 'AI', slug: 'artificial-intelligence-ai' },
  { title: 'Design', slug: 'design' },
]

describe('insights collection index route', () => {
  it('renders the items on the first page', async () => {
    const { html } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(3), 3),
    })

    expect(html).toContain('Insight 0')
    expect(html).toContain('Insight 2')
  })

  it('defaults to page 1 when no page param is given', async () => {
    const { calls } = await renderRoute(route, { data: anInsightsPage(manyInsights(3), 3) })
    expect(feedCalls(calls)[0]?.params).toMatchObject({ offset: 0, end: 12 })
  })

  it('slices the feed by the requested page', async () => {
    const { calls } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(12), 40),
      params: { page: '2' },
    })
    expect(feedCalls(calls)[0]?.params).toMatchObject({ offset: 12, end: 24 })
  })

  /**
   * A path is a claim that a page exists, so `/insights/page/99` is wrong.
   * Answering it with the last page would give that page a second address.
   */
  it('404s a page past the end rather than clamping to the last one', async () => {
    const calls = await expectNotFound(route, {
      data: anInsightsPage(manyInsights(12), 20),
      params: { page: '99' },
    })

    // 20 items at 12/page = 2 pages. One read, and no refetch behind it.
    expect(feedCalls(calls)).toHaveLength(1)
  })

  it('404s a page segment that is not a page at all', async () => {
    await expectNotFound(route, {
      data: anInsightsPage(manyInsights(3), 3),
      params: { page: 'not-a-number' },
    })
  })

  it('404s `page/1`, which is the bare index under a second URL', async () => {
    await expectNotFound(route, {
      data: anInsightsPage(manyInsights(3), 3),
      params: { page: '1' },
    })
  })

  it('uses the entry’s static metadata', async () => {
    const { metadata } = await renderRoute(route, { data: anInsightsPage() })
    expect(metadata.title).toBe('Insights')
  })

  /**
   * The route's LCP element is the first card's picture — the grid opens in the
   * first screen under the hero (#268). One image is preloaded and the rest
   * wait: a second preload only takes bandwidth from the first.
   */
  it('preloads the first card’s picture and nothing else', async () => {
    const illustrated = [0, 1, 2].map((i) =>
      anInsight({
        _id: `insight-${i}`,
        slug: `insight-${i}`,
        title: `Insight ${i}`,
        cardMedia: {
          image: {
            _type: 'image',
            asset: { _type: 'reference', _ref: `image-${String(i).repeat(40)}-1200x800-jpg` },
          },
          alt: `Picture ${i}`,
        },
      } as never),
    )
    const { html } = await renderRoute(route, { data: anInsightsPage(illustrated, 3) })

    const preloaded = preloadedImageTags(html)
    expect(preloaded).toHaveLength(1)
    expect(preloaded[0]).toContain('alt="Picture 0"')
    // …and every card declares the three-up slot rather than the viewport.
    expect(declaredSizes(html)).toEqual(
      Array(3).fill(
        '(min-width: 1878px) 555px, (min-width: 1440px) calc(33.333vw - 71.333px), (min-width: 1024px) calc(29.801vw - 20.465px), (min-width: 640px) 395px, 90vw',
      ),
    )
  })

  it('links each card at its own detail URL', async () => {
    const { html } = await renderRoute(route, { data: anInsightsPage(manyInsights(3), 3) })
    expect(html).toContain('href="/insights/insight-0"')
  })

  /**
   * The card draws no byline in either state — the frame (`2337:4493`) gives
   * it a meta line and a title and nothing else. Worth pinning now that a
   * byline is optional (#32 item 1.1): the card is the one surface where
   * "authorless" must be indistinguishable from "authored", and the projection
   * hands it an `author` it deliberately ignores.
   */
  it('draws no author on a card, with or without one', async () => {
    const authored = anInsight({
      _id: 'p-authored',
      slug: 'authored',
      title: 'Authored',
      author: { name: 'Christine Sheller', title: 'Chief Experience Officer', headshot: null },
    })
    const anonymous = anInsight({
      _id: 'p-anonymous',
      slug: 'anonymous',
      title: 'Anonymous',
      author: null,
    })
    const { html } = await renderRoute(route, {
      data: anInsightsPage([authored, anonymous], 2),
    })

    expect(html).toContain('Authored')
    expect(html).toContain('Anonymous')
    expect(html).not.toContain('Christine Sheller')
  })
})

/**
 * The category filter (#61) — the question `2337:4486` answered and #49 left
 * open. It is a URL parameter resolved on the server, so every assertion here
 * is about the request and the markup, and none is about client state.
 */
describe('insights index category filter', () => {
  it('passes no category to the query on the unfiltered index', async () => {
    const { calls } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(3), 3, CATEGORIES),
    })
    expect(feedCalls(calls)[0]?.params).toMatchObject({ category: null })
  })

  it('hands the requested category to the query as a GROQ param', async () => {
    const { calls } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(3), 3, CATEGORIES),
      params: { category: 'design' },
    })
    expect(feedCalls(calls)[0]?.params).toMatchObject({ category: 'design' })
  })

  it('draws one chip per category, plus All', async () => {
    const { html } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(3), 3, CATEGORIES),
    })

    expect(html).toContain('href="/insights#feed"')
    expect(html).toContain('href="/insights/category/artificial-intelligence-ai#feed"')
    expect(html).toContain('href="/insights/category/design#feed"')
    expect(html).toContain('>All<')
    expect(html).toContain('>Design<')
  })

  it('marks the active chip — and only it — as current', async () => {
    const { html } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(3), 3, CATEGORIES),
      params: { category: 'design' },
    })
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    // The selected chip is Theme=Black (`2337:4542`): ink fill, white label.
    expect(html).toMatch(/aria-current="page"[^>]*href="\/insights\/category\/design#feed"/)
  })

  it('marks All as current when nothing is filtered', async () => {
    const { html } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(3), 3, CATEGORIES),
    })
    expect(html).toMatch(/aria-current="page"[^>]*href="\/insights#feed"/)
  })

  it('keeps the filter on every pager link', async () => {
    const { html } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(12), 40, CATEGORIES),
      params: { category: 'design', page: '2' },
    })

    expect(html).toContain('href="/insights/category/design#feed"')
    expect(html).toContain('href="/insights/category/design/page/3#feed"')
  })

  /** A chip is a fresh cut of the collection; page 4 of the old one is not in it. */
  it('drops the page when a chip is followed', async () => {
    const { html } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(12), 40, CATEGORIES),
      params: { category: 'design', page: '2' },
    })
    expect(html).toContain('href="/insights/category/artificial-intelligence-ai#feed"')
    expect(html).not.toContain('/category/artificial-intelligence-ai/page/')
  })

  it('counts a filtered page against the filtered total, not the collection', async () => {
    const calls = await expectNotFound(route, {
      data: anInsightsPage(manyInsights(2), 2, CATEGORIES),
      params: { category: 'design', page: '9' },
    })

    // Two matches is one page, so page 9 of this cut does not exist — and the
    // read that established that carried the filter.
    expect(feedCalls(calls)[0]?.params).toMatchObject({ category: 'design' })
  })

  /**
   * The chips only offer categories that have articles, so a cut with nothing
   * in it is a category the collection does not have. Serving 200s there hands
   * a crawler an unbounded space of URLs — the thing paths were moved into the
   * route key to stop.
   */
  it('404s a category the collection has nothing under', async () => {
    await expectNotFound(route, {
      data: anInsightsPage([], 0, CATEGORIES),
      params: { category: 'nothing-here' },
    })
  })

  it('still draws the empty state for a collection with no articles at all', async () => {
    const { html } = await renderRoute(route, { data: anInsightsPage([], 0, CATEGORIES) })
    expect(html).toContain('No insights under that filter')
  })

  it('draws no bar at all when nothing is categorised', async () => {
    const { html } = await renderRoute(route, { data: anInsightsPage(manyInsights(3), 3, []) })
    expect(html).not.toContain('aria-label="Filter by category"')
  })
})

/**
 * The composition, read off `2336:4310`. Every value below is on the frame and
 * the node is named beside it, so the next person can check it rather than
 * trust it — the same job the borrowed-values block did while this route was
 * provisional (#49).
 */
const page = await renderRoute(route, {
  // The SEEDED chrome, not an invented one: these assertions are about what
  // the loaded dataset renders, so a seed that drifts from the frame fails
  // here rather than in a browser nobody opened.
  data: withIndexChrome(
    anInsightsPage(manyInsights(12), 40, CATEGORIES),
    aSeededCollectionIndex('insights'),
  ),
  params: { page: '2' },
})

describe('insights index composition', () => {
  it('opens on the Interior Hero, in the frame’s own words', () => {
    // `2336:4477` — the headline and eyebrow the frame writes. The standfirst
    // beside them is the Interior Hero set's lorem default ("Not the
    // deliverable…"), so the seed's own line stays.
    //
    // Authored since #347: the words are the seed's `heroSection`, drawn
    // through the block at `variant: 'band'` — which is the same
    // `CollectionHero` this route used to call directly, so the frame is
    // unmoved and only the source of the copy changed.
    expect(page.html).toContain('Learn about what drives our experiences.')
    expect(page.html).toContain('Looking for some firsthand knowledge from our world?')
    expect(page.html).toContain('Insights')
    expect(page.html).not.toContain('Not the deliverable')
  })

  it('paints the hero ink rather than the Work band’s warm black', () => {
    // The 2026-08 `Interior Hero` component (`2101:828`) is #0A0A0B; the older
    // Work/Live band is #0F100B and stays that way until its frame is redrawn.
    const tokens = classTokens(page.html)
    expect(tokens).toContain('bg-ink')
    expect(tokens).not.toContain('bg-ink-warm')
  })

  it('lays the cards on a bone band at the frame’s 128px rhythm', () => {
    // `2337:4485`: fill #F1F0EC, padding 128px 96px.
    const tokens = classTokens(page.html)
    expect(tokens).toContain('bg-bone')
    expect(tokens).toContain('py-band-md')
  })

  it('fills the 1248 column with three of the frame’s own cards', () => {
    // 3 × 395 + 2 × 32 = 1249 = --container-section. gap-x-8 is the 32.
    const tokens = classTokens(page.html)
    expect(tokens).toContain('max-w-section')
    expect(tokens).toContain('gap-x-8')
    expect(tokens).toContain('lg:grid-cols-3')
  })

  it('stacks to one column below lg — the two frames, nothing between', () => {
    // ADR 0006: composition switches at `lg`. A `md:grid-cols-2` would be a
    // third composition no frame draws.
    const tokens = classTokens(page.html)
    expect(tokens).toContain('grid-cols-1')
    expect(tokens.filter((t) => t.startsWith('md:grid-cols'))).toEqual([])
  })

  it('opens the rows to 64px at both widths', () => {
    // `2337:4492` wraps its rows 64px apart at 1440 and `2975:8663` stacks
    // them 64 apart at 402, so the row gap is flat.
    expect(variantsOf(page.html, 'gap-y-16')).toEqual(['gap-y-16'])
    expect(variantsOf(page.html, 'gap-y-12')).toEqual([])
  })

  it('closes on the shared CTA band, pointed at the work', () => {
    // `2975:8806` — the band's copy is the component's own, its button is the
    // frame's: "View our work", not the route's old "Get in touch".
    // Authored since #347: the seed's `ctaSection` in `sectionsBelow`.
    expect(page.html).toContain('Let’s get started on your next big thing.')
    expect(page.html).toContain('View our work')
    expect(page.html).toContain('href="/work"')
  })

  /**
   * The closer is the sphere, not the molecule. Both closer frames
   * (`2975:8788` at 1440, `2975:8801` at 402) are a full-bleed raster
   * `imageRef 51458151e760cc2e868b5f9aa7f2e939609a9a6c` over a native
   * `--gradient-ink-fade` strip (`2975:8795` / `2975:8807`) — the same
   * construction #317 ruled on, and the same imageRef Home's own orbs band
   * carries. So it is Home's band pasted, and the route draws `orbs`.
   */
  it('closes on the sphere band Home originated', () => {
    expect(page.html).toContain('--gradient-ink-fade')
    expect(page.html).not.toContain('w-[54%]')
  })

  it('scrolls the chip row on a phone and nothing else', () => {
    // `2975:8656` is one unwrapped row 10px apart, running past the frame's
    // right edge — the only scroll region the 402 frame draws. The card grid
    // stacks, so `snap-x` never appears.
    expect(unprefixedHorizontalScrollUtilities(page.html)).toEqual(['overflow-x-auto'])

    // Scoped to the bar: the pager's own row wraps unconditionally.
    const bar = page.html.match(/<nav aria-label="Filter by category"[^>]*>/)?.[0] ?? ''
    expect(classTokens(bar)).toContain('overflow-x-auto')
    expect(classTokens(bar)).toContain('lg:flex-wrap')
    expect(classTokens(bar)).not.toContain('flex-wrap')
  })
})

describe('insights index pager', () => {
  it('offers every page of the collection by number, not just the two neighbours', () => {
    // `page` above is this exact state: page 2 of 4 (#241).
    expect(page.html).toContain('href="/insights#feed"')
    expect(page.html).toContain('href="/insights/page/2#feed"')
    expect(page.html).toContain('href="/insights/page/3#feed"')
    expect(page.html).toContain('href="/insights/page/4#feed"')

    // Scoped to the pager: the selected filter chip carries `aria-current`
    // too, and it is a different "current" — the cut on screen, not the page.
    const pager = page.html.slice(page.html.indexOf('aria-label="Pagination"'))
    const current = pager.match(/<a[^>]*aria-current="page"[^>]*>/)?.[0] ?? ''
    expect(current).toContain('href="/insights/page/2#feed"')
  })

  it('drops Previous on the first page and Next on the last', async () => {
    const first = await renderRoute(route, { data: anInsightsPage(manyInsights(12), 40) })
    expect(first.html).toContain('Next')
    expect(first.html).not.toContain('Previous')

    const last = await renderRoute(route, {
      data: anInsightsPage(manyInsights(4), 40),
      params: { page: '4' },
    })
    expect(last.html).toContain('Previous')
    expect(last.html).not.toContain('>Next')
  })

  it('renders no pager at all when the collection fits on one page', async () => {
    const { html } = await renderRoute(route, { data: anInsightsPage(manyInsights(3), 3) })
    expect(html).not.toContain('aria-label="Pagination"')
  })

  it('marks the two links up as prev/next for a crawler', () => {
    expect(page.html).toContain('rel="prev"')
    expect(page.html).toContain('rel="next"')
  })
})

/**
 * THE AUTHORED BANDS (#347) — the half of this page an editor owns.
 *
 * The feed stays the route's: a page is one path per document, so a
 * paginated listing cannot be a block someone drops twice. Everything around
 * it is a `collectionIndex` document, and these assertions are about where its
 * bands land and what happens when it is not there.
 */
describe('insights index authored bands', () => {
  const feed = () => anInsightsPage(manyInsights(3), 3)

  it('renders a band from sectionsAbove above the first card', async () => {
    const { html } = await renderRoute(route, {
      data: withIndexChrome(
        feed(),
        aCollectionIndex({ sectionsAbove: [aCtaBand('Above the feed')] }),
      ),
    })

    expect(html).toContain('Above the feed')
    expect(html.indexOf('Above the feed')).toBeLessThan(html.indexOf('Insight 0'))
  })

  it('renders a band from sectionsBelow after the last card', async () => {
    const { html } = await renderRoute(route, {
      data: withIndexChrome(
        feed(),
        aCollectionIndex({ sectionsBelow: [aCtaBand('Below the feed')] }),
      ),
    })

    expect(html).toContain('Below the feed')
    expect(html.indexOf('Insight 2')).toBeLessThan(html.indexOf('Below the feed'))
  })

  it('draws the bands in the order the array holds them', async () => {
    const { html } = await renderRoute(route, {
      data: withIndexChrome(
        feed(),
        aCollectionIndex({
          sectionsAbove: [aCtaBand('First band', 'b1'), aCtaBand('Second band', 'b2')],
        }),
      ),
    })

    expect(html.indexOf('First band')).toBeLessThan(html.indexOf('Second band'))
  })

  /**
   * The one behaviour that must not regress. An unseeded dataset, or a preview
   * environment nobody has authored yet, is a plain listing — not a 404 and
   * not a blank page.
   */
  it('renders the feed with no chrome document at all', async () => {
    const { html } = await renderRoute(route, { data: withIndexChrome(feed(), null) })

    expect(html).toContain('Insight 0')
    expect(html).toContain('Insight 2')
  })

  it('reads the chrome document for this collection, tagged so a publish reaches it', async () => {
    const { calls } = await renderRoute(route, {
      data: withIndexChrome(feed(), aCollectionIndex()),
    })

    const read = calls.find((call) => call.query === COLLECTION_INDEX_QUERY)
    expect(read?.params).toMatchObject({ collection: 'insight' })
    expect(read?.tags).toContain('sanity:collectionIndex')
    // And NOTHING narrower. The webhook builds a per-document tag from
    // `slug.current`; this document has no slug, so a per-document tag here
    // would be one nothing can ever revalidate.
    expect(read?.tags).toEqual(['sanity:collectionIndex'])
  })

  /**
   * The copy that used to be hardcoded here is the document's now. Pinned as
   * an absence rather than a presence: the failure this catches is a fallback
   * quietly surviving in the view, which no positive assertion would see.
   */
  it('carries no hardcoded hero or closing copy of its own', async () => {
    const { html } = await renderRoute(route, { data: withIndexChrome(feed(), null) })

    expect(html).not.toContain('Learn about what drives our experiences.')
    expect(html).not.toContain('Let’s get started on your next big thing.')
  })
})

/**
 * THE INDEX'S OWN SEO (#349) — the two highest-traffic landing pages stop
 * being stuck with a developer's first guess.
 *
 * Three tiers: the document's `seo` overrides win, the entry's static SEO is
 * the fallback, Site Settings is the floor. The canonical is in none of them —
 * it is the ROUTE's, which is what keeps a paginated or filtered URL from
 * being indexed as a document of its own.
 */
describe('insights index metadata', () => {
  const feed = () => anInsightsPage(manyInsights(3), 3)

  it('lets the document’s seo beat the entry’s static title and description', async () => {
    const { metadata } = await renderRoute(route, {
      data: withIndexChrome(
        feed(),
        aCollectionIndex({
          seo: { title: 'Insights from O3', description: 'What the editor wrote.' },
        } as never),
      ),
    })

    expect(metadata.title).toBe('Insights from O3')
    expect(metadata.description).toBe('What the editor wrote.')
  })

  it('falls back to the entry’s static seo where the document overrides nothing', async () => {
    const { metadata } = await renderRoute(route, {
      data: withIndexChrome(feed(), aCollectionIndex()),
    })

    expect(metadata.title).toBe('Insights')
  })

  it('still emits the static seo when there is no document at all', async () => {
    const { metadata } = await renderRoute(route, { data: withIndexChrome(feed(), null) })
    expect(metadata.title).toBe('Insights')
  })

  it('keeps the canonical on the unpaginated index for a paginated request', async () => {
    const { metadata } = await renderRoute(route, {
      // A collection long enough for the page to exist: this test is about
      // the tag on a page that does, not about the 404 above.
      data: withIndexChrome(anInsightsPage(manyInsights(12), 40), aCollectionIndex()),
      params: { page: '2' },
    })

    expect(metadata.alternates?.canonical).toContain('/insights')
    expect(String(metadata.alternates?.canonical)).not.toContain('/page/')
  })

  it('keeps the canonical on the unfiltered index for a filtered request', async () => {
    const { metadata } = await renderRoute(route, {
      data: withIndexChrome(feed(), aCollectionIndex()),
      params: { category: 'design' },
    })

    expect(String(metadata.alternates?.canonical)).not.toContain('category=')
  })

  /**
   * The seed's own SEO, carried from the origin site's /perspectives archive
   * page with the one word ADR 0017 retired swapped for the one that replaced
   * it — the collection is Insights now, so the title cannot advertise
   * Perspectives.
   */
  it('carries the seeded title from the origin site, in the current vocabulary', async () => {
    const { metadata } = await renderRoute(route, {
      data: withIndexChrome(feed(), aSeededCollectionIndex('insights')),
    })

    expect(metadata.title).toBe('Insights from O3 on Digital Experiences')
    expect(metadata.description).toContain('influencing today’s industry landscape')
    expect(String(metadata.title)).not.toContain('Perspectives')
  })

  /**
   * The one override an index does NOT honour. A collection index's URL is the
   * route's, and the route canonicalizes every paginated and filtered page
   * back to it — an editor-typed canonical would break that rule for the whole
   * collection at once, so the field is ignored here rather than obeyed.
   */
  it('ignores a canonical typed onto the document', async () => {
    const { metadata } = await renderRoute(route, {
      data: withIndexChrome(
        feed(),
        aCollectionIndex({ seo: { canonical: 'https://example.com/elsewhere' } } as never),
      ),
    })

    expect(String(metadata.alternates?.canonical)).not.toContain('example.com')
    expect(String(metadata.alternates?.canonical)).toContain('/insights')
  })
})

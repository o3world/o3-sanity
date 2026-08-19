import { describe, expect, it } from 'vitest'

import { buildDetailRoute } from '@o3/content-runtime/routes'
import {
  anInsight,
  expectNotFound,
  paragraph,
  renderRoute,
  siteSettings,
  withSettings,
} from '@/test'

import { insight } from './entry'

/**
 * The insight detail route, end to end minus the network: the shim fetches,
 * the registry resolves the View through `next/dynamic`, the View renders, and
 * `generateMetadata` produces the tags.
 *
 * The composition is O3's and is asserted in apps/web (`2252:3554`); what is
 * this app's own is the wiring — that the route dispatches at all under this
 * brand, and that every URL it emits is built from `brandConfig()` rather than
 * from a literal a copied file brought with it.
 */
const route = buildDetailRoute(insight)

function render(data: unknown, slug = 'an-insight') {
  return renderRoute(route, {
    data: withSettings(data, siteSettings({ title: 'O3XO' })),
    params: { slug },
  })
}

describe('the insight detail route', () => {
  it('displays the fields a reader came for', async () => {
    const { html } = await render(
      anInsight({
        title: 'What a second brand costs',
        excerpt: 'Two sites, one set of blocks.',
        author: { name: 'Brian Crumley', title: 'Partner', headshot: null },
        categories: [{ title: 'Strategy', slug: 'strategy' }],
        body: [paragraph('The opening paragraph of the article.')],
      }),
    )

    expect(html).toContain('What a second brand costs')
    expect(html).toContain('Two sites, one set of blocks.')
    expect(html).toContain('Brian Crumley')
    expect(html).toContain('Strategy')
    expect(html).toContain('The opening paragraph of the article.')
  })

  /**
   * The registry loads every View through `next/dynamic`, which resolves to
   * nothing outside a Next build — so a broken registry binding is a blank
   * page rather than an error (see the stub in `@o3/render-kit`). One h1 is
   * the cheapest proof the View actually ran.
   */
  it('renders the title as the page’s only h1', async () => {
    const { html } = await render(anInsight({ title: 'Only One' }))
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })

  /**
   * The byline reads "6 min read" where O3's reads "Jun 2026 · 6 min read".
   * o3xo.ai publishes no date, so a migrated insight's `publishedAt` is
   * synthetic and orders the collection only (#218) — printing it would date an
   * article the site never dated.
   */
  it('bylines the article by reading time alone, with no date', async () => {
    const { html } = await render(anInsight({ readingMinutes: 6 }))
    expect(html).toContain('6 min read')
    expect(html).not.toContain('May 2026')
  })

  it('points the article’s way back at this brand’s index', async () => {
    const { html } = await render(anInsight())
    expect(html).toContain('href="/insights"')
  })

  it('canonicalises at this brand’s prefix', async () => {
    const { metadata } = await render(anInsight({ slug: 'a-second-brand' }), 'a-second-brand')
    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/insights/a-second-brand')
  })

  /**
   * Two o3xo.ai slugs carry a curly apostrophe, and the corpus stores the
   * character itself — the site serves it and path parity requires it (#217).
   * A browser sends the segment percent-encoded, so the route has to ask for the
   * slug the way the corpus holds it; asking for `pact%E2%80%99s` matched
   * nothing and 404'd both articles.
   */
  it('looks a curly-apostrophe slug up the way the corpus stores it', async () => {
    const slug = 'mike-gadsby-on-pact’s-digital-phorum-podcast'
    const { calls } = await render(
      anInsight({ slug, title: 'On PACT’s Digital Phorum' }),
      encodeURIComponent(slug),
    )
    expect(calls[0]?.params).toMatchObject({ slug })
  })

  it('404s when nothing matches the slug', async () => {
    await expectNotFound(route, {
      data: withSettings(null, siteSettings({ title: 'O3XO' })),
      params: { slug: 'nope' },
    })
  })
})

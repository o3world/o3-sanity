import { describe, expect, it } from 'vitest'

import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { buildDetailRoute } from '@/lib/content-routes/build'
import {
  aMigratedPerspective,
  aPerspective,
  expectNotFound,
  migratedPerspectiveSlugs,
  paragraph,
  renderRoute,
  siteSettings,
  withSettings,
} from '@/test'

import { perspective } from './entry'

/**
 * Valid Sanity asset ids — `@sanity/image-url` rejects anything else. The
 * CDN URL it builds contains the bare id, not the `image-…-WxH-ext` ref, so
 * assertions match on `*_ID`.
 */
const OG_ID = '1111111111111111111111111111111111111111'
const FALLBACK_ID = '2222222222222222222222222222222222222222'
const OG_IMAGE = `image-${OG_ID}-1200x630-png`
const FALLBACK_IMAGE = `image-${FALLBACK_ID}-1600x900-jpg`

/**
 * The perspective detail route, end to end minus the network: the route shim
 * fetches, dispatches on `_type`, renders the view, and produces metadata.
 */
const route = buildDetailRoute(perspective)

function render(data: unknown, slug = 'a-perspective') {
  return renderRoute(route, { data, params: { slug } })
}

describe('perspective detail route', () => {
  it('displays the fields a reader came for', async () => {
    const { html } = await render(
      aPerspective({
        title: 'Headless CMS vs traditional CMS',
        excerpt: 'What marketing teams actually gain.',
        author: { name: 'Brian Crumley', title: 'Partner' },
        categories: [{ title: 'Strategy', slug: 'strategy' }],
        body: [paragraph('The opening paragraph of the article.')],
      }),
    )

    expect(html).toContain('Headless CMS vs traditional CMS')
    expect(html).toContain('What marketing teams actually gain.')
    expect(html).toContain('Brian Crumley')
    expect(html).toContain('Strategy')
    expect(html).toContain('The opening paragraph of the article.')
  })

  it('renders the title as the page’s only h1', async () => {
    const { html } = await render(aPerspective({ title: 'Only One' }))
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })

  it('shows the computed read time rather than a stored field', async () => {
    const longBody = Array.from({ length: 20 }, (_, i) =>
      paragraph(`${'word '.repeat(50)}`, `k${i.toString().padStart(4, '0')}`),
    )
    const { html } = await render(aPerspective({ body: longBody }))
    // 20 blocks x 50 words = 1000 words, at the 200wpm the helper uses.
    expect(html).toContain('5 min read')
  })

  it('omits the figure entirely when there is no featured image', async () => {
    const { html } = await render(aPerspective({ featuredImage: null }))
    expect(html).not.toContain('<figure')
  })

  it('404s when no document matches the slug', async () => {
    await expectNotFound(route, { data: null, params: { slug: 'does-not-exist' } })
  })

  /**
   * The SEO discipline every content ticket inherits (#26). These assertions
   * are about the shared chain in `@/lib/seo`, pinned through a real route:
   * a routable type that emits half the tag set fails here.
   */
  describe('metadata', () => {
    function renderWithSettings(doc: unknown, settings?: SITE_SETTINGS_QUERY_RESULT) {
      return renderRoute(route, {
        data: withSettings(doc, settings ?? siteSettings()),
        params: { slug: 'a-perspective' },
      })
    }

    it('falls back to the document title and excerpt', async () => {
      const { metadata } = await renderWithSettings(
        aPerspective({ title: 'Fallback Title', excerpt: 'Fallback description.' }),
      )
      expect(metadata.title).toBe('Fallback Title')
      expect(metadata.description).toBe('Fallback description.')
    })

    it('prefers the migrated Yoast values when present', async () => {
      const { metadata } = await renderWithSettings(
        aPerspective({
          title: 'Document Title',
          excerpt: 'Document excerpt.',
          seo: { _type: 'seo', title: 'Yoast Title', description: 'Yoast description.' },
        }),
      )
      expect(metadata.title).toBe('Yoast Title')
      expect(metadata.description).toBe('Yoast description.')
    })

    it('falls back to the Site Settings description when neither the doc nor its seo has one', async () => {
      const { metadata } = await renderWithSettings(
        aPerspective({ excerpt: null as never, seo: null }),
        siteSettings({
          defaultSeo: { _type: 'seo', description: 'The house description.' } as never,
        }),
      )
      expect(metadata.description).toBe('The house description.')
    })

    it('emits a self-referential canonical at the document’s own path', async () => {
      const { metadata } = await renderWithSettings(aPerspective({ slug: 'a-perspective' }))
      expect(metadata.alternates?.canonical).toBe(
        'http://localhost:3000/perspectives/a-perspective',
      )
    })

    it('lets a document point its canonical somewhere else', async () => {
      const { metadata } = await renderWithSettings(
        aPerspective({ seo: { _type: 'seo', canonical: 'https://example.com/original' } }),
      )
      expect(metadata.alternates?.canonical).toBe('https://example.com/original')
    })

    it('is indexable and followable by default', async () => {
      const { metadata } = await renderWithSettings(aPerspective())
      expect(metadata.robots).toMatchObject({ index: true, follow: true })
    })

    it('honours the migrated noIndex and noFollow flags', async () => {
      const { metadata } = await renderWithSettings(
        aPerspective({ seo: { _type: 'seo', noIndex: true, noFollow: true } }),
      )
      expect(metadata.robots).toMatchObject({ index: false, follow: false })
    })

    it('emits OpenGraph and Twitter tags, site name included in the social title', async () => {
      const { metadata } = await renderWithSettings(
        aPerspective({ title: 'Social Title', excerpt: 'Social description.' }),
      )
      // The root layout's `%s | O3` template never reaches a scraper, so
      // og:title has to carry the site name itself.
      expect(metadata.openGraph?.title).toBe('Social Title | O3')
      expect(metadata.openGraph?.description).toBe('Social description.')
      expect(metadata.openGraph).toMatchObject({
        url: 'http://localhost:3000/perspectives/a-perspective',
        siteName: 'O3',
      })
      expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' })
    })

    it('shares as an article, with its publication date', async () => {
      const { metadata } = await renderWithSettings(
        aPerspective({ publishedAt: '2026-05-04T13:20:00Z' }),
      )
      expect(metadata.openGraph).toMatchObject({
        type: 'article',
        publishedTime: '2026-05-04T13:20:00Z',
      })
    })

    it('prefers the seo ogImage over the featured image for the social card', async () => {
      const asset = (ref: string) => ({
        _type: 'image' as const,
        asset: { _type: 'reference' as const, _ref: ref },
      })
      const { metadata } = await renderWithSettings(
        aPerspective({
          featuredImage: { _type: 'figure', image: asset(FALLBACK_IMAGE), alt: 'x' } as never,
          seo: { _type: 'seo', ogImage: asset(OG_IMAGE) } as never,
        }),
      )
      const images = JSON.stringify(metadata.openGraph?.images)
      expect(images).toContain(OG_ID)
      expect(images).not.toContain(FALLBACK_ID)
    })

    it('falls back to the document’s featured image when seo has no ogImage', async () => {
      const { metadata } = await renderWithSettings(
        aPerspective({
          featuredImage: {
            _type: 'figure',
            image: { _type: 'image', asset: { _type: 'reference', _ref: FALLBACK_IMAGE } },
            alt: 'x',
          } as never,
          seo: null,
        }),
      )
      expect(JSON.stringify(metadata.openGraph?.images)).toContain(FALLBACK_ID)
    })

    // stega characters are invisible in the browser but corrupt <title> and
    // OG tags if they leak — hence stega:false on the metadata fetch.
    it('fetches metadata with stega encoding off', async () => {
      const { calls } = await render(aPerspective())
      const metadataFetch = calls.find((call) => call.stega === false)
      expect(metadataFetch, 'no stega-free fetch was made for metadata').toBeDefined()
    })

    // The two sides of the revalidation contract must agree; this pins the
    // reader half against the scheme in cacheTags.ts.
    it('tags the fetch per document so /api/revalidate can invalidate one post', async () => {
      const { calls } = await render(aPerspective(), 'a-perspective')
      expect(calls[0]?.tags).toContain('sanity:perspective:a-perspective')
      expect(calls[0]?.tags).toContain('sanity:perspective')
    })
  })
})

/**
 * The migration → render bridge. Real converted WordPress documents, rendered
 * through the real route. A mapper that starts emitting something the renderer
 * cannot display fails here, not in Studio.
 */
describe('migrated content renders', () => {
  const slugs = migratedPerspectiveSlugs()

  it('has migrated documents to render', () => {
    expect(slugs.length).toBeGreaterThan(0)
  })

  it.each(slugs)('renders the migrated perspective %s', async (slug) => {
    const doc = aMigratedPerspective(slug)
    const { html } = await renderRoute(route, { data: doc, params: { slug } })

    expect(html).toContain(doc.title as string)
    // A body that converted to blocks the renderer ignores would leave an
    // article with a header and nothing under it.
    expect(html).toMatch(/<p[\s>]/)
  })
})

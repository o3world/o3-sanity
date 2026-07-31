import { describe, expect, it } from 'vitest'

import { buildDetailRoute } from '@/lib/content-routes/build'
import {
  aMigratedPerspective,
  aPerspective,
  expectNotFound,
  migratedPerspectiveSlugs,
  paragraph,
  renderRoute,
} from '@/test'

import { perspective } from './entry'

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

  describe('metadata', () => {
    it('falls back to the document title and excerpt', async () => {
      const { metadata } = await render(
        aPerspective({ title: 'Fallback Title', excerpt: 'Fallback description.' }),
      )
      expect(metadata.title).toBe('Fallback Title')
      expect(metadata.description).toBe('Fallback description.')
    })

    it('prefers the migrated Yoast values when present', async () => {
      const { metadata } = await render(
        aPerspective({
          title: 'Document Title',
          excerpt: 'Document excerpt.',
          seo: { _type: 'seo', title: 'Yoast Title', description: 'Yoast description.' },
        }),
      )
      expect(metadata.title).toBe('Yoast Title')
      expect(metadata.description).toBe('Yoast description.')
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

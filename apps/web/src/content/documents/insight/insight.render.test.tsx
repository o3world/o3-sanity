import { describe, expect, it } from 'vitest'

import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { buildDetailRoute } from '@/lib/content-routes/build'
import {
  aMigratedInsight,
  anInsight,
  expectNotFound,
  migratedInsightSlugs,
  paragraph,
  renderRoute,
  siteSettings,
  withSettings,
} from '@/test'

import { insight } from './entry'

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
 * The insight detail route, end to end minus the network: the route shim
 * fetches, dispatches on `_type`, renders the view, and produces metadata.
 */
const route = buildDetailRoute(insight)

function render(data: unknown, slug = 'an-insight') {
  return renderRoute(route, { data, params: { slug } })
}

describe('insight detail route', () => {
  it('displays the fields a reader came for', async () => {
    const { html } = await render(
      anInsight({
        title: 'Headless CMS vs traditional CMS',
        excerpt: 'What marketing teams actually gain.',
        author: { name: 'Brian Crumley', title: 'Partner', headshot: null },
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
    const { html } = await render(anInsight({ title: 'Only One' }))
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })

  /**
   * Reading time is computed in the GROQ projection, never stored and never
   * recomputed here (#45) — so the byline has to show the number the query
   * handed it. A view that fell back to its own word count would ignore this
   * one and print something else.
   */
  it('shows the read time the projection computed', async () => {
    const { html } = await render(
      anInsight({
        readingMinutes: 6,
        publishedAt: '2026-06-04T13:20:00Z',
        body: [paragraph('Three words here.')],
      }),
    )
    expect(html).toContain('6 min read')
    expect(html).toContain('Jun 2026')
  })

  /** The byline's monogram disc — what an author with no headshot gets. */
  it('falls back to the author’s initial when there is no headshot', async () => {
    const { html } = await render(
      anInsight({
        author: { name: 'Jay Forbes', title: 'Director of Engineering', headshot: null },
      }),
    )
    expect(html).toContain('Jay Forbes, Director of Engineering')
    expect(html).toContain('>J<')
  })

  /**
   * Most of the archive is authorless (#32 item 1.1): WordPress only ever
   * showed a byline where an editor set the ACF author, so 239 of the 272
   * migrated documents have none and `post_author` no longer stands in. The
   * hero keeps its second line — date and read time — and draws no disc,
   * which is what o3world.com draws for those posts today.
   */
  it('renders date and read time alone when there is no author', async () => {
    const { html } = await render(
      anInsight({
        author: null,
        readingMinutes: 4,
        publishedAt: '2026-06-04T13:20:00Z',
      }),
    )
    expect(html).toContain('Jun 2026 · 4 min read')
    expect(html).not.toContain('Brian Crumley')
    // The monogram disc is the author's initial; with no name there is no disc.
    expect(html).not.toContain('size-[42px]')
  })

  // No Site Settings needed: the collection's name in the UI is its type name
  // (ADR 0017), not a label an editor has to keep in step with it.
  it('links back to the collection', async () => {
    const { html } = await renderRoute(route, {
      data: withSettings(anInsight(), siteSettings()),
      params: { slug: 'an-insight' },
    })
    expect(html).toContain('href="/insights"')
    expect(html).toContain('All Insights')
  })

  it('closes on the "Keep reading." band, category-matched first', async () => {
    const { html } = await render(
      anInsight({
        related: [{ ...anInsight({ _id: 'p-1', title: 'The related one' }) } as never],
        latest: [{ ...anInsight({ _id: 'p-2', title: 'The fallback one' }) } as never],
      }),
    )
    expect(html).toContain('Keep reading.')
    expect(html).toContain('The related one')
    expect(html).not.toContain('The fallback one')
  })

  it('falls back to the latest feed when nothing shares a category', async () => {
    const { html } = await render(
      anInsight({
        related: [],
        latest: [{ ...anInsight({ _id: 'p-2', title: 'The fallback one' }) } as never],
      }),
    )
    expect(html).toContain('The fallback one')
  })

  it('drops the "Keep reading." band entirely when there is nothing to read next', async () => {
    const { html } = await render(anInsight({ related: [], latest: [] }))
    expect(html).not.toContain('Keep reading.')
  })

  it('omits the figure entirely when there is no featured image', async () => {
    const { html } = await render(anInsight({ featuredImage: null }))
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
        params: { slug: 'an-insight' },
      })
    }

    it('falls back to the document title and excerpt', async () => {
      const { metadata } = await renderWithSettings(
        anInsight({ title: 'Fallback Title', excerpt: 'Fallback description.' }),
      )
      expect(metadata.title).toBe('Fallback Title')
      expect(metadata.description).toBe('Fallback description.')
    })

    it('prefers the migrated Yoast values when present', async () => {
      const { metadata } = await renderWithSettings(
        anInsight({
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
        anInsight({ excerpt: null as never, seo: null }),
        siteSettings({
          defaultSeo: { _type: 'seo', description: 'The house description.' } as never,
        }),
      )
      expect(metadata.description).toBe('The house description.')
    })

    it('emits a self-referential canonical at the document’s own path', async () => {
      const { metadata } = await renderWithSettings(anInsight({ slug: 'an-insight' }))
      expect(metadata.alternates?.canonical).toBe('http://localhost:3000/insights/an-insight')
    })

    it('lets a document point its canonical somewhere else', async () => {
      const { metadata } = await renderWithSettings(
        anInsight({ seo: { _type: 'seo', canonical: 'https://example.com/original' } }),
      )
      expect(metadata.alternates?.canonical).toBe('https://example.com/original')
    })

    it('is indexable and followable by default', async () => {
      const { metadata } = await renderWithSettings(anInsight())
      expect(metadata.robots).toMatchObject({ index: true, follow: true })
    })

    it('honours the migrated noIndex and noFollow flags', async () => {
      const { metadata } = await renderWithSettings(
        anInsight({ seo: { _type: 'seo', noIndex: true, noFollow: true } }),
      )
      expect(metadata.robots).toMatchObject({ index: false, follow: false })
    })

    it('emits OpenGraph and Twitter tags, site name included in the social title', async () => {
      const { metadata } = await renderWithSettings(
        anInsight({ title: 'Social Title', excerpt: 'Social description.' }),
      )
      // The root layout's `%s | O3` template never reaches a scraper, so
      // og:title has to carry the site name itself.
      expect(metadata.openGraph?.title).toBe('Social Title | O3')
      expect(metadata.openGraph?.description).toBe('Social description.')
      expect(metadata.openGraph).toMatchObject({
        url: 'http://localhost:3000/insights/an-insight',
        siteName: 'O3',
      })
      expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' })
    })

    it('shares as an article, with its publication date', async () => {
      const { metadata } = await renderWithSettings(
        anInsight({ publishedAt: '2026-05-04T13:20:00Z' }),
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
        anInsight({
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
        anInsight({
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
      const { calls } = await render(anInsight())
      const metadataFetch = calls.find((call) => call.stega === false)
      expect(metadataFetch, 'no stega-free fetch was made for metadata').toBeDefined()
    })

    // The two sides of the revalidation contract must agree; this pins the
    // reader half against the scheme in cacheTags.ts.
    it('tags the fetch per document so /api/revalidate can invalidate one post', async () => {
      const { calls } = await render(anInsight(), 'an-insight')
      expect(calls[0]?.tags).toContain('sanity:insight:an-insight')
      expect(calls[0]?.tags).toContain('sanity:insight')
    })
  })
})

/**
 * The text a reader actually sees: tags dropped, entities decoded, whitespace
 * collapsed. Comparing against raw HTML is too brittle for real content — a
 * link or a `<br />` splits a sentence across tags, and `&` arrives as
 * `&amp;` — and none of that is a rendering failure.
 */
function visibleText(html: string): string {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const collapse = (text: string) => text.replace(/\s+/g, ' ').trim()

/**
 * The migration → render bridge. Real converted WordPress documents, rendered
 * through the real route. A mapper that starts emitting something the renderer
 * cannot display fails here, not in Studio.
 */
describe('migrated content renders', () => {
  const slugs = migratedInsightSlugs()

  it('has migrated documents to render', () => {
    expect(slugs.length).toBeGreaterThan(0)
  })

  /**
   * The five oldest and five newest posts, checked in more detail than the
   * sweep below (#17). The ends of the archive are where conversion breaks:
   * the 2015 posts came through three WordPress editors and two themes, the
   * 2026 ones use the current ACF module set. Anything that survives both
   * probably survives the middle.
   */
  describe('the ends of the archive render in full', () => {
    const byDate = slugs
      .map((slug) => aMigratedInsight(slug))
      .sort((a, b) => String(a.publishedAt).localeCompare(String(b.publishedAt)))
    const ends = [...byDate.slice(0, 5), ...byDate.slice(-5)]

    it.each(ends.map((doc) => [doc.slug as string, doc] as const))(
      '%s keeps its text, headings, links and images',
      async (slug, doc) => {
        const { html } = await renderRoute(route, { data: doc, params: { slug } })

        // Every span's words reach the page — a body that converted to blocks
        // the renderer ignores would leave a header and nothing under it.
        // Asserted per span, not per block: marks (links, bold) split a
        // block's text across tags, so only a span is contiguous in the HTML.
        const paragraphs = (doc.body ?? []).filter((b) => b._type === 'block')
        expect(paragraphs.length).toBeGreaterThan(0)
        const spans = paragraphs
          .flatMap((block) => block.children ?? [])
          .map((child) => ('text' in child ? (child.text ?? '').trim() : ''))
          .filter((text) => text.length > 40)
        expect(spans.length, 'no substantial text to check').toBeGreaterThan(0)
        const rendered = visibleText(html)
        for (const text of spans) expect(rendered).toContain(collapse(text).slice(0, 40))

        // Structure the source had must still be there.
        const styles = new Set(paragraphs.map((b) => b.style))
        if (styles.has('h2')) expect(html).toMatch(/<h2[\s>]/)
        if (styles.has('h3')) expect(html).toMatch(/<h3[\s>]/)
        const hasLink = paragraphs.some((b) => (b.markDefs ?? []).length > 0)
        if (hasLink) expect(html).toMatch(/<a [^>]*href=/)
        const images = (doc.body ?? []).filter((b) => b._type === 'figure')
        if (images.length > 0) expect(html.match(/<img\b/g) ?? []).toHaveLength(images.length + 1)
      },
    )
  })

  /**
   * The two byline states, on real documents (#32 item 1.1). The rule the
   * owner set is live-site fidelity: o3world.com shows a byline only where an
   * editor set the ACF author, so the converted corpus does the same — 33 of
   * the 272 carry one, and `post_author` reaches nothing a reader sees.
   */
  it('shows the ACF byline the live site shows', async () => {
    const slug = '1682-the-making-of-the-brand'
    const doc = aMigratedInsight(slug)
    expect(doc.author?.name).toBe('Simone Dehel')
    const { html } = await renderRoute(route, { data: doc, params: { slug } })
    expect(html).toContain('Simone Dehel, Senior Experience Designer')
  })

  it('shows no byline on a post the live site attributes to nobody', async () => {
    const slug = 'decoding-headless-vs-traditional-cms'
    const doc = aMigratedInsight(slug)
    expect(doc.author).toBeNull()
    const { html } = await renderRoute(route, { data: doc, params: { slug } })
    // Brian Crumley is `post_author` here; on the live page he appears only in
    // Yoast's machine meta, which this site derives from nothing.
    expect(html).not.toContain('Brian Crumley')
    expect(html).not.toContain('size-[42px]')
  })

  it.each(slugs)('renders the migrated insight %s', async (slug) => {
    const doc = aMigratedInsight(slug)
    const { html } = await renderRoute(route, { data: doc, params: { slug } })

    expect(visibleText(html)).toContain(collapse(doc.title as string))
    // A body that converted to blocks the renderer ignores would leave an
    // article with a header and nothing under it.
    expect(html).toMatch(/<p[\s>]/)
  })
})

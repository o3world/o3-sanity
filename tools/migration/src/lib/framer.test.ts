import { describe, expect, it } from 'vitest'

import { assetUrl, insightSlugsInSitemap, parseInsight } from './framer'

/**
 * The O3XO source. o3xo.ai is a Framer site, so there is no CMS to query and
 * no `get_fields()` to call — the extract reads the HTML the site serves, which
 * makes the parse itself the fail-loud surface.
 *
 * The fixture below is the shape o3xo.ai actually serves, cut down to the
 * elements the parse depends on: the two `data-framer-name` regions, the hero's
 * RichTextContainers in their authored order (eyebrow, title, deck — the title
 * repeated once per breakpoint, exactly as Framer emits it), and the head.
 */
const PAGE = `<!DOCTYPE html><html><head>
<title>A real headline | O3XO</title>
<meta name="description" content="The search-result sentence, which is not the deck.">
<meta property="og:image" content="https://framerusercontent.com/images/abc123.png?width=2160&amp;height=2160">
<link rel="canonical" href="https://www.o3xo.ai/insights/a-real-headline">
<script type="application/ld+json">{"@type":"Organization","name":"O3XO"}</script>
</head><body>
<div data-framer-name="Hero">
  <div data-framer-component-type="RichTextContainer"><h1 class="framer-text">Strategy</h1></div>
  <div class="ssr-variant hidden-x"><div data-framer-component-type="RichTextContainer"><h1 class="framer-text">A real headline</h1></div></div>
  <div class="ssr-variant hidden-y"><div data-framer-component-type="RichTextContainer"><h1 class="framer-text">A real headline</h1></div></div>
  <div data-framer-component-type="RichTextContainer"><h3 class="framer-text">The deck the page shows under the headline.</h3></div>
  <div><img src="https://framerusercontent.com/images/abc123.png?scale-down-to=512&amp;width=2160&amp;height=2160" alt="Close-up of an analog gauge"></div>
  <div><img src="https://framerusercontent.com/images/abc123.png?width=2160&amp;height=2160" alt="Close-up of an analog gauge"></div>
</div>
<div data-framer-name="Content">
  <div data-framer-component-type="RichTextContainer"><p class="framer-text">First paragraph.</p><h3 class="framer-text">A subhead</h3><p class="framer-text"><strong>Bold lead</strong> and <a href="https://example.com/report">a source</a>.</p></div>
  <div data-framer-component-type="RichTextContainer"><p class="framer-text">Share</p></div>
  <div data-framer-component-type="RichTextContainer"><p class="framer-text">Related articles</p></div>
</div>
<div data-framer-ssr-released-at="2026-08-17T13:04:12.195Z" data-x="&quot;collectionItemId&quot;:&quot;KkV56cgmc&quot;"></div>
</body></html>`

describe('parseInsight', () => {
  const insight = parseInsight(PAGE, 'a-real-headline')

  it('takes the headline from the hero, not the browser title', () => {
    expect(insight.title).toBe('A real headline')
    expect(insight.titleRendered).toBe('A real headline | O3XO')
  })

  it('reads the eyebrow above the headline as the category', () => {
    expect(insight.category).toBe('Strategy')
  })

  /**
   * The deck and the meta description are different sentences on this site, and
   * they mean different things: the deck is copy a reader sees under the
   * headline (`excerpt`), the description is the search-result line (`seo`).
   * Collapsing them would put SEO copy on the page.
   */
  it('keeps the deck and the meta description apart', () => {
    expect(insight.deck).toBe('The deck the page shows under the headline.')
    expect(insight.seo.descriptionOverride).toBe(
      'The search-result sentence, which is not the deck.',
    )
  })

  it('takes the hero image once, at full size, with its alt text', () => {
    expect(insight.heroImage).toEqual({
      url: 'https://framerusercontent.com/images/abc123.png',
      alt: 'Close-up of an analog gauge',
    })
  })

  // The share widget and the related-article cards are RichTextContainers in
  // the same region; the body is the first one.
  it('takes the article body and stops before the share and related bands', () => {
    expect(insight.bodyHtml).toContain('First paragraph.')
    expect(insight.bodyHtml).toContain('<h3')
    expect(insight.bodyHtml).not.toContain('Share')
    expect(insight.bodyHtml).not.toContain('Related articles')
  })

  it('records the path the site serves and the canonical it declares', () => {
    expect(insight.path).toBe('/insights/a-real-headline')
    expect(insight.seo.canonicalRendered).toBe('https://www.o3xo.ai/insights/a-real-headline')
  })

  // The CMS record's own id. It is the only stable handle the site exposes for
  // an item — a slug is editable — so it travels as provenance.
  it('records the Framer collection item id', () => {
    expect(insight.collectionItemId).toBe('KkV56cgmc')
  })

  /**
   * o3xo.ai publishes no date. Not hidden, not in the head, not in a feed, not
   * in the sitemap — the design binds no date field at all. The parse says so
   * rather than substituting the page's build timestamp, which is what
   * `data-framer-ssr-released-at` is and would read as a 2026 publish date on
   * every one of the 41 articles.
   */
  it('reports no published date, because the source has none', () => {
    expect(insight).not.toHaveProperty('publishedAt')
    expect(JSON.stringify(insight)).not.toContain('2026-08-17')
  })

  it('fails loud when a region the parse depends on is not there', () => {
    expect(() => parseInsight('<html><body><p>hi</p></body></html>', 'x')).toThrow(
      /data-framer-name="Hero"/,
    )
  })
})

describe('assetUrl', () => {
  // Framer serves every resize off one path with query parameters, so the query
  // is a rendering instruction rather than part of the asset's identity — and
  // `assets.json` is keyed by that identity. Keeping it would upload the same
  // picture once per srcset entry.
  it('drops the resize query, so one picture is one asset', () => {
    expect(
      assetUrl('https://framerusercontent.com/images/abc.png?scale-down-to=512&width=2160'),
    ).toBe('https://framerusercontent.com/images/abc.png')
  })
})

describe('insightSlugsInSitemap', () => {
  it('lists the insight slugs in the order the site publishes them', () => {
    const xml = `<urlset>
      <url><loc>https://www.o3xo.ai/</loc></url>
      <url><loc>https://www.o3xo.ai/insights</loc></url>
      <url><loc>https://www.o3xo.ai/insights/newest-first</loc></url>
      <url><loc>https://www.o3xo.ai/insights/then-this-one</loc></url>
      <url><loc>https://www.o3xo.ai/case-studies/</loc></url>
    </urlset>`
    expect(insightSlugsInSitemap(xml)).toEqual(['newest-first', 'then-this-one'])
  })

  // Two of the 41 carry a curly apostrophe in the slug, which the sitemap
  // percent-encodes; decoding is what makes the extract filename match the URL.
  it('decodes a percent-encoded slug', () => {
    const xml = `<urlset><url><loc>https://www.o3xo.ai/insights/mike-gadsby-on-pact%E2%80%99s-podcast</loc></url></urlset>`
    expect(insightSlugsInSitemap(xml)).toEqual(['mike-gadsby-on-pact’s-podcast'])
  })
})

import { describe, expect, it } from 'vitest'

import type { FramerInsightRecord } from './framer'
import { mapFramerCategory, mapFramerInsight } from './framer'

const RECORD: FramerInsightRecord = {
  _meta: { type: 'insight' },
  slug: 'human-in-the-loop-ai-workflows',
  path: '/insights/human-in-the-loop-ai-workflows',
  collectionItemId: 'KkV56cgmc',
  title: 'What "human in the loop" actually means in practice',
  titleRendered: 'What "human in the loop" actually means in practice | O3XO',
  category: 'Strategy',
  deck: 'A perspective on what human in the loop actually means inside enterprise AI workflows.',
  heroImage: {
    url: 'https://framerusercontent.com/images/abc123.png',
    alt: 'Close-up of analog performance gauge meter',
  },
  bodyHtml:
    '<p>The fear about AI and jobs usually gets framed as a replacement story.</p>' +
    '<h3>HITL is a maturity strategy</h3>' +
    '<p><strong>That is backwards</strong> from what we see.</p>',
  seo: {
    canonicalRendered: 'https://www.o3xo.ai/insights/human-in-the-loop-ai-workflows',
    descriptionOverride: 'Human in the loop is a design decision, not a safety net.',
    ogImage: 'https://framerusercontent.com/images/abc123.png?width=2160',
  },
}

const OPTIONS = { insightPrefix: '/insights' }

function mapped(record: FramerInsightRecord = RECORD) {
  const result = mapFramerInsight(record, OPTIONS)
  if (!result.ok) throw new Error(`did not map: ${JSON.stringify(result.issues)}`)
  return result
}

describe('mapFramerInsight', () => {
  const { doc, notes } = mapped()

  /**
   * `<type>-<source>-<key>`, the same contract WordPress documents use — the
   * source token names the system the document came from, and the key is the
   * only stable thing the Framer site exposes per item.
   */
  it('gives the document a deterministic id naming its source', () => {
    expect(doc._id).toBe('insight-framer-human-in-the-loop-ai-workflows')
  })

  // Sanity ids allow `[a-zA-Z0-9._-]`, and two of the 41 slugs carry a curly
  // apostrophe. The URL keeps it (path parity); the id cannot.
  it('makes an id out of a slug that has characters an id may not hold', () => {
    const { doc: quirky } = mapped({
      ...RECORD,
      slug: 'mike-gadsby-on-pact’s-podcast',
      path: '/insights/mike-gadsby-on-pact’s-podcast',
      seo: {
        ...RECORD.seo,
        canonicalRendered: 'https://www.o3xo.ai/insights/mike-gadsby-on-pact’s-podcast',
      },
    })
    expect(quirky._id).toBe('insight-framer-mike-gadsby-on-pact-s-podcast')
    expect(quirky.slug.current).toBe('mike-gadsby-on-pact’s-podcast')
  })

  it('traces the document back to the Framer collection item', () => {
    expect(doc.migration.sourceId).toBe('framer:insight:KkV56cgmc')
  })

  it('is born unlocked, like everything the pipeline writes', () => {
    expect(doc.migration.locked).toBe(false)
  })

  it('takes the hero deck as the excerpt and the meta description as SEO', () => {
    expect(doc.excerpt).toBe(RECORD.deck)
    expect(doc.seo?.description).toBe('Human in the loop is a design decision, not a safety net.')
  })

  /**
   * The site's `<title>` is the headline plus ` | O3XO`, which is what the
   * app's own title template already composes — so there is no override to
   * store. Storing one would ship `Foo | O3XO | O3XO`.
   */
  it('stores no SEO title, because the source never overrode one', () => {
    expect(doc.seo?.title).toBeUndefined()
  })

  // A self-referential canonical pointing back at o3xo.ai would tell Google the
  // new page is a duplicate of the Framer one.
  it('never carries a canonical pointing at the Framer host', () => {
    expect(JSON.stringify(doc.seo ?? {})).not.toContain('o3xo.ai')
  })

  it('converts the body to portable text, keeping headings and bold', () => {
    const styles = doc.body.map((block) => block.style)
    expect(styles).toContain('normal')
    expect(styles).toContain('h3')
    expect(JSON.stringify(doc.body)).toContain('strong')
  })

  it('gives every body block a key that is stable across runs', () => {
    const keys = doc.body.map((block) => block._key)
    expect(keys).toEqual(mapped().doc.body.map((block) => block._key))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('carries the hero image as a source marker for the loader to upload', () => {
    expect(doc.featuredImage).toEqual({
      _type: 'figure',
      image: { _type: 'image', _srcUrl: 'https://framerusercontent.com/images/abc123.png' },
      alt: 'Close-up of analog performance gauge meter',
    })
  })

  it('references the category document the eyebrow names', () => {
    expect(doc.categories).toEqual([
      { _type: 'reference', _ref: 'category-framer-strategy', _key: 'cat-strategy' },
    ])
  })

  /**
   * The finding this tracer exists to surface: **o3xo.ai publishes no date.**
   * Not on the article, not in the head, not in a feed, not in the sitemap. So
   * the document carries no `publishedAt` and says why — rather than taking the
   * page's build timestamp, which would stamp all 41 articles with this week.
   */
  it('omits publishedAt and marks the document provisional for it', () => {
    expect(doc.publishedAt).toBeUndefined()
    expect(doc.migration.provisional).toBe(true)
    expect(doc.migration.provisionalNote).toMatch(/publishedAt/)
  })

  it('notes the missing date on every run, so it is not discovered at launch', () => {
    expect(notes?.map((note) => note.element)).toContain('publishedAt')
  })

  /**
   * Path parity, the same gate WordPress documents pass (#26): the document has
   * to be served at the path o3xo.ai serves it at today, or the run stops.
   */
  it('stops the run when the new path would not be the path the site serves', () => {
    const moved = mapFramerInsight({ ...RECORD, slug: 'renamed-on-the-way-through' }, OPTIONS)
    expect(moved.ok).toBe(false)
    if (moved.ok) return
    expect(JSON.stringify(moved.issues)).toContain('path parity')
  })

  it('refuses a record with no body, rather than committing an empty document', () => {
    const empty = mapFramerInsight({ ...RECORD, bodyHtml: '' }, OPTIONS)
    expect(empty.ok).toBe(false)
  })

  it('refuses a record with no deck, because excerpt has no second source here', () => {
    const empty = mapFramerInsight({ ...RECORD, deck: '   ' }, OPTIONS)
    expect(empty.ok).toBe(false)
  })
})

describe('mapFramerCategory', () => {
  it('turns the eyebrow into a category document with a deterministic id', () => {
    const category = mapFramerCategory('Strategy')
    expect(category).toEqual({
      _id: 'category-framer-strategy',
      _type: 'category',
      title: 'Strategy',
      slug: { _type: 'slug', current: 'strategy' },
      migration: { locked: false, sourceId: 'framer:category:strategy' },
    })
  })

  // The site's taxonomy is authored as free text in the design, so two words
  // is a legal value and the slug has to survive it.
  it('slugs a multi-word eyebrow', () => {
    expect(mapFramerCategory('AI & Data').slug.current).toBe('ai-data')
  })
})

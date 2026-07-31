import { describe, expect, it } from 'vitest'

import { mapPerspective, type WpPerspective } from './perspective'

/**
 * A minimal, valid WP post. Every test starts here and overrides only the
 * field it is about, so a test reads as "this one thing differs".
 */
function wpPost(overrides: Partial<WpPerspective> = {}): WpPerspective {
  return {
    _meta: {
      type: 'perspective',
      source: 'o3-world.live',
      extractedAt: '2026-07-31T20:07:34.550Z',
    },
    wpId: 101,
    slug: 'a-post',
    title: 'A Post',
    dateGmt: '2026-05-04 13:20:00',
    authorId: 16,
    categoryIds: [86],
    excerpt: 'Short summary.',
    yoast: {},
    fields: {
      flexible_post_content: [{ acf_fc_layout: 'text', text_editor: '<p>Hello world.</p>' }],
    },
    ...overrides,
  }
}

/** Narrow to the success arm, failing with the reported issues if it isn't. */
function expectOk(result: ReturnType<typeof mapPerspective>) {
  if (!result.ok) {
    throw new Error(`expected a document, got issues: ${JSON.stringify(result.issues)}`)
  }
  return result.doc
}

describe('mapPerspective', () => {
  it('maps a WP post onto the perspective document shape', () => {
    const doc = expectOk(mapPerspective(wpPost()))

    expect(doc._id).toBe('perspective-wp-101')
    expect(doc._type).toBe('perspective')
    expect(doc.title).toBe('A Post')
    expect(doc.slug).toEqual({ _type: 'slug', current: 'a-post' })
    expect(doc.excerpt).toBe('Short summary.')
    expect(doc.author).toEqual({ _type: 'reference', _ref: 'person-wp-16' })
    expect(doc.categories).toEqual([{ _type: 'reference', _ref: 'category-wp-86', _key: 'cat-86' }])
    expect(doc.migration).toEqual({
      locked: false,
      sourceId: 'wp:post:101',
      extractedAt: '2026-07-31T20:07:34.550Z',
    })
  })

  it('converts the WP GMT date to an ISO instant', () => {
    const doc = expectOk(mapPerspective(wpPost({ dateGmt: '2026-05-04 13:20:00' })))
    expect(doc.publishedAt).toBe('2026-05-04T13:20:00Z')
  })

  it('prefers the ACF header description over the WP excerpt', () => {
    const doc = expectOk(
      mapPerspective(
        wpPost({
          excerpt: 'the wp excerpt',
          fields: {
            header: { description: '  the acf description  ' },
            flexible_post_content: [{ acf_fc_layout: 'text', text_editor: '<p>Body.</p>' }],
          },
        }),
      ),
    )
    expect(doc.excerpt).toBe('the acf description')
  })

  it('strips the WP thumbnail suffix from the featured image so the full asset migrates', () => {
    const doc = expectOk(
      mapPerspective(
        wpPost({ featuredImage: { url: 'https://o3.com/up/photo-768x432.jpg', alt: 'A photo' } }),
      ),
    )
    expect(doc.featuredImage).toEqual({
      _type: 'figure',
      image: { _type: 'image', _wpSrc: 'https://o3.com/up/photo.jpg' },
      alt: 'A photo',
    })
  })

  it('falls back to the post title when the featured image has no alt text', () => {
    const doc = expectOk(
      mapPerspective(wpPost({ featuredImage: { url: 'https://o3.com/up/p.jpg', alt: '' } })),
    )
    expect((doc.featuredImage as { alt: string }).alt).toBe('A Post')
  })

  it('omits seo entirely when Yoast had nothing (rather than writing an empty object)', () => {
    const doc = expectOk(mapPerspective(wpPost({ yoast: {} })))
    expect('seo' in doc).toBe(false)
  })

  it('carries the Yoast title and description onto seo', () => {
    const doc = expectOk(
      mapPerspective(wpPost({ yoast: { title: 'SEO title', description: 'SEO description' } })),
    )
    expect(doc.seo).toEqual({ title: 'SEO title', description: 'SEO description' })
  })

  // Determinism is what makes "wipe and rebuild reproduces the dataset"
  // (ADR 0003) true, and it is why re-running convert does not churn every
  // _key in the committed JSON. See docs/adr/0004.
  it('is deterministic — the same post converts to byte-identical JSON every run', () => {
    const first = expectOk(mapPerspective(wpPost()))
    const second = expectOk(mapPerspective(wpPost()))
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('gives every body block a key, unique within the document', () => {
    const doc = expectOk(
      mapPerspective(
        wpPost({
          fields: {
            flexible_post_content: [
              { acf_fc_layout: 'text', text_editor: '<p>One.</p><p>Two.</p>' },
              { acf_fc_layout: 'text', text_editor: '<p>Three.</p>' },
            ],
          },
        }),
      ),
    )
    const keys = doc.body.map((block) => block._key as string)
    expect(keys.every(Boolean)).toBe(true)
    expect(new Set(keys).size).toBe(keys.length)
  })

  describe('fails loud rather than dropping content (ADR 0002)', () => {
    it('reports an ACF module layout it has no mapper for', () => {
      const result = mapPerspective(
        wpPost({
          fields: {
            flexible_post_content: [
              { acf_fc_layout: 'text', text_editor: '<p>Kept.</p>' },
              { acf_fc_layout: 'video_hero' },
            ],
          },
        }),
      )

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.issues).toContainEqual({
        element: 'acf module',
        detail: 'unmapped layout "video_hero"',
      })
    })

    it('reports a post with no excerpt anywhere', () => {
      const result = mapPerspective(
        wpPost({
          excerpt: '',
          fields: {
            flexible_post_content: [{ acf_fc_layout: 'text', text_editor: '<p>Body.</p>' }],
          },
        }),
      )

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.issues.map((i) => i.element)).toContain('excerpt')
    })

    it('reports a post whose modules produced no body', () => {
      const result = mapPerspective(wpPost({ fields: { flexible_post_content: [] } }))

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.issues.map((i) => i.element)).toContain('body')
    })

    it('reports an unexpanded shortcode instead of migrating the raw text', () => {
      const result = mapPerspective(
        wpPost({
          fields: {
            flexible_post_content: [
              { acf_fc_layout: 'text', text_editor: '<p>[contact_form id="4"]</p>' },
            ],
          },
        }),
      )

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.issues.map((i) => i.element)).toContain('shortcode')
    })

    it('writes nothing at all for a failed post — no partial document', () => {
      const result = mapPerspective(
        wpPost({ fields: { flexible_post_content: [{ acf_fc_layout: 'unknown_thing' }] } }),
      )
      expect(result.ok).toBe(false)
      expect(result).not.toHaveProperty('doc')
    })
  })
})

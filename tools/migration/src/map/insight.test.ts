import { describe, expect, it } from 'vitest'

import type { WpSeo, WpSiteSeo } from '../lib/yoast'
import { buildPersonDirectory } from './person'
import { insightDoc, mapInsight, type WpPerspective } from './insight'

const SITE: WpSiteSeo = {
  siteName: 'O3',
  siteUrl: 'https://www.o3world.com',
  separator: '|',
  description: '',
  ogDefaultImage: 'https://www.o3world.com/up/O3.png',
  twitterSite: 'o3world',
  twitterCardType: 'summary_large_image',
}

/** Yoast facts for a post that overrode nothing — the common case (#26). */
function wpSeo(overrides: Partial<WpSeo> = {}): WpSeo {
  return {
    titleOverride: '',
    titleRendered: 'A Post | O3',
    descriptionOverride: '',
    descriptionRendered: 'Short summary.',
    canonicalOverride: '',
    canonicalRendered: 'https://www.o3world.com/insights/a-post/',
    noIndex: false,
    noFollow: false,
    ogImage: null,
    twitterImageOverride: '',
    ...overrides,
  }
}

/**
 * A minimal, valid WP post. Every test starts here and overrides only the
 * field it is about, so a test reads as "this one thing differs".
 */
function wpPost(overrides: Partial<WpPerspective> = {}): WpPerspective {
  return {
    _meta: { type: 'insight' },
    wpId: 101,
    slug: 'a-post',
    title: 'A Post',
    dateGmt: '2026-05-04 13:20:00',
    authorId: 16,
    categoryIds: [86],
    excerpt: 'Short summary.',
    seo: wpSeo(),
    fields: {
      flexible_post_content: [{ acf_fc_layout: 'text', text_editor: '<p>Hello world.</p>' }],
    },
    ...overrides,
  }
}

/** WP user 16 writes; team post 9147 is the ACF byline where a post sets one. */
const PEOPLE = buildPersonDirectory(
  [
    {
      _meta: { type: 'person' },
      wpId: 16,
      slug: 'briano3',
      name: 'Brian Crumley',
      email: 'brian@o3world.com',
    },
  ],
  [
    {
      wpId: 9147,
      slug: 'brady-halligan',
      name: 'Brady Halligan',
      jobTitle: 'Senior Strategist',
      email: 'brady@o3world.com',
      photo: 'https://o3.com/up/brady.jpg',
    },
  ],
)

const map = (post: WpPerspective) => mapInsight(post, SITE, PEOPLE)

/** Narrow to the success arm, failing with the reported issues if it isn't. */
function expectOk(result: ReturnType<typeof mapInsight>) {
  if (!result.ok) {
    throw new Error(`expected a document, got issues: ${JSON.stringify(result.issues)}`)
  }
  return result.doc
}

describe('mapInsight', () => {
  it('maps a WP post onto the insight document shape', () => {
    const doc = expectOk(map(wpPost()))

    expect(doc._id).toBe('insight-wp-101')
    expect(doc._type).toBe('insight')
    expect(doc.title).toBe('A Post')
    expect(doc.slug).toEqual({ _type: 'slug', current: 'a-post' })
    expect(doc.excerpt).toBe('Short summary.')
    expect(doc.categories).toEqual([{ _type: 'reference', _ref: 'category-wp-86', _key: 'cat-86' }])
    // No `extractedAt`: it belongs to the extract run, lives in
    // `data/extract/_manifest.json`, and `load.ts` stamps it on the way to
    // Sanity — so convert output stays a pure function of extract content.
    expect(doc.migration).toEqual({
      locked: false,
      sourceId: 'wp:post:101',
    })
  })

  it('takes the byline from the ACF author, never the account that published (#17)', () => {
    // On 39 of the 40 posts carrying an ACF author, the two disagree — the WP
    // account is just whoever hit publish.
    const doc = expectOk(
      map(
        wpPost({
          fields: {
            author: [9147],
            flexible_post_content: [{ acf_fc_layout: 'text', text_editor: '<p>Body.</p>' }],
          },
        }),
      ),
    )
    expect(doc.author).toEqual({ _type: 'reference', _ref: 'person-wp-9147' })
  })

  /**
   * The live-site test (#32 item 1.1): a post with no ACF author shows no
   * byline anywhere on o3world.com — `post_author` reaches Yoast's machine
   * meta and nothing a reader sees. 232 of the 272 are like this, so the
   * document has no author and the run says nothing about it.
   */
  it('leaves a post with no ACF author unattributed, silently', () => {
    const result = map(wpPost())
    const doc = expectOk(result)
    expect(doc.author).toBeUndefined()
    // `ok()` omits `notes` entirely when there are none — the run is silent.
    expect(result.ok && result.notes).toBeUndefined()
  })

  it('notes an ACF byline whose team post no longer exists, and attributes nobody', () => {
    // Seven real posts point at team ids 5102 / 5320 / 7533 / 8031, all
    // deleted. WordPress renders no byline for them either.
    const result = map(
      wpPost({
        fields: {
          author: [5320],
          flexible_post_content: [{ acf_fc_layout: 'text', text_editor: '<p>Body.</p>' }],
        },
      }),
    )
    const doc = expectOk(result)
    expect(doc.author).toBeUndefined()
    expect(result.ok && result.notes).toEqual([
      {
        element: 'author',
        detail: 'ACF byline points at team post 5320, which no longer exists — no author',
      },
    ])
  })

  it('converts the WP GMT date to an ISO instant', () => {
    const doc = expectOk(map(wpPost({ dateGmt: '2026-05-04 13:20:00' })))
    expect(doc.publishedAt).toBe('2026-05-04T13:20:00Z')
  })

  it('prefers the ACF header description over the WP excerpt', () => {
    const doc = expectOk(
      map(
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
      map(
        wpPost({ featuredImage: { url: 'https://o3.com/up/photo-768x432.jpg', alt: 'A photo' } }),
      ),
    )
    expect(doc.cardMedia).toEqual({
      _type: 'figure',
      image: { _type: 'image', _wpSrc: 'https://o3.com/up/photo.jpg' },
      alt: 'A photo',
    })
  })

  it('falls back to the post title when the featured image has no alt text', () => {
    const doc = expectOk(
      map(wpPost({ featuredImage: { url: 'https://o3.com/up/p.jpg', alt: '' } })),
    )
    expect((doc.cardMedia as { alt: string }).alt).toBe('A Post')
  })

  describe('seo — overrides migrate, resolved defaults do not (#26)', () => {
    it('omits seo entirely when the post overrode nothing', () => {
      const doc = expectOk(map(wpPost({ seo: wpSeo() })))
      expect('seo' in doc).toBe(false)
    })

    it('ignores the resolved title and description a post never overrode', () => {
      // Yoast resolves these from site-wide templates for every post; copying
      // them in would freeze today's defaults into 272 documents.
      const doc = expectOk(
        map(
          wpPost({
            seo: wpSeo({
              titleRendered: 'A Post | O3',
              descriptionRendered: 'Auto-generated from the excerpt.',
            }),
          }),
        ),
      )
      expect('seo' in doc).toBe(false)
    })

    it('carries an overridden title, stripped of the site-name suffix Yoast appends', () => {
      const doc = expectOk(
        map(
          wpPost({
            seo: wpSeo({
              titleOverride: '%%title%% the long way',
              titleRendered: 'A Post the long way | O3',
            }),
          }),
        ),
      )
      // The app's own `%s | O3` template re-appends it — keeping Yoast's
      // would ship "… | O3 | O3".
      expect(doc.seo).toEqual({ title: 'A Post the long way' })
    })

    it('carries an overridden meta description', () => {
      const doc = expectOk(
        map(wpPost({ seo: wpSeo({ descriptionOverride: '  SEO description  ' }) })),
      )
      expect(doc.seo).toEqual({ description: 'SEO description' })
    })

    it('migrates a per-post OG image as an asset marker, thumbnail suffix stripped', () => {
      const doc = expectOk(
        map(
          wpPost({
            seo: wpSeo({ ogImage: { url: 'https://o3.com/up/share-1200x630.png', alt: '' } }),
          }),
        ),
      )
      expect(doc.seo).toEqual({
        ogImage: { _type: 'image', _wpSrc: 'https://o3.com/up/share.png' },
      })
    })

    it('never migrates the self-referential canonical WordPress renders', () => {
      // It points at www.o3world.com — migrating it would declare every new
      // page a duplicate of the old site.
      const doc = expectOk(map(wpPost({ seo: wpSeo() })))
      expect(doc.seo).toBeUndefined()
    })

    it('carries robots overrides', () => {
      const doc = expectOk(map(wpPost({ seo: wpSeo({ noIndex: true, noFollow: true }) })))
      expect(doc.seo).toEqual({ noIndex: true, noFollow: true })
    })
  })

  // Determinism is what makes "wipe and rebuild reproduces the dataset"
  // (ADR 0003) true, and it is why re-running convert does not churn every
  // _key in the committed JSON. See docs/adr/0004.
  it('is deterministic — the same post converts to byte-identical JSON every run', () => {
    const first = expectOk(map(wpPost()))
    const second = expectOk(map(wpPost()))
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('gives every body block a key, unique within the document', () => {
    const doc = expectOk(
      map(
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
      const result = map(
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
      const result = map(
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
      const result = map(wpPost({ fields: { flexible_post_content: [] } }))

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.issues.map((i) => i.element)).toContain('body')
    })

    it('reports an unexpanded shortcode instead of migrating the raw text', () => {
      const result = map(
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

    it('reports a slug that would move the post off its WordPress URL (#26)', () => {
      const result = map(
        wpPost({
          slug: 'a-renamed-post',
          seo: wpSeo({ canonicalRendered: 'https://www.o3world.com/insights/a-post/' }),
        }),
      )

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.issues.map((i) => i.element)).toContain('path parity')
    })

    it('accepts the WordPress URL with its trailing slash as parity', () => {
      const result = map(
        wpPost({
          seo: wpSeo({ canonicalRendered: 'https://www.o3world.com/insights/a-post/' }),
        }),
      )
      expect(result.ok).toBe(true)
    })

    it('writes nothing at all for a failed post — no partial document', () => {
      const result = map(
        wpPost({ fields: { flexible_post_content: [{ acf_fc_layout: 'unknown_thing' }] } }),
      )
      expect(result.ok).toBe(false)
      expect(result).not.toHaveProperty('doc')
    })
  })
})

/**
 * The gate both sources pass, and `verify` re-runs over the whole dataset.
 *
 * `publishedAt` is required of every insight, whatever produced it. o3xo.ai was
 * the one source with nothing to give it — the field used to be exempt for a
 * `framer:` document — and #218 closed that: its dates are synthesised from the
 * sitemap position, so no source is exempt and an insight with no date is a
 * failure again rather than a shape the gate has a hole for.
 */
describe('insightDoc', () => {
  const doc = {
    _id: 'insight-framer-a-migrated-article',
    _type: 'insight' as const,
    title: 'A migrated article',
    slug: { _type: 'slug' as const, current: 'a-migrated-article' },
    excerpt: 'Why this matters.',
    categories: [],
    publishedAt: '2026-08-01T12:00:00Z',
    body: [{ _type: 'block' }],
    migration: { locked: false, sourceId: 'framer:insight:KkV56cgmc' },
  }

  it('accepts a document from either source', () => {
    expect(insightDoc.safeParse(doc).success).toBe(true)
    expect(
      insightDoc.safeParse({
        ...doc,
        _id: 'insight-wp-101',
        migration: { locked: false, sourceId: 'wp:post:101' },
      }).success,
    ).toBe(true)
  })

  it('requires a date of an o3xo.ai insight too, now that it has one', () => {
    const dateless: Record<string, unknown> = { ...doc }
    delete dateless.publishedAt
    const parsed = insightDoc.safeParse(dateless)
    expect(parsed.success).toBe(false)
    expect(JSON.stringify(parsed.error?.issues)).toContain('publishedAt')
  })
})

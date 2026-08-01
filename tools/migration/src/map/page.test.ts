import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { EXTRACT_DIR } from '../lib/paths'
import type { WpSiteSeo } from '../lib/yoast'
import { KEEPER_SLUGS, mapPage, slugFromPath, type WpPage } from './page'
import type { ExtractMeta } from './types'

const SITE: WpSiteSeo = {
  siteName: 'O3',
  siteUrl: 'https://www.o3world.com',
  separator: '|',
  description: '',
  ogDefaultImage: '',
  twitterSite: 'o3world',
  twitterCardType: 'summary_large_image',
}

const META: ExtractMeta = {
  type: 'page',
  source: 'o3-world.live',
  extractedAt: '2026-07-31T20:07:34.550Z',
}

function wpPage(overrides: Partial<WpPage> = {}): WpPage {
  return {
    _meta: META,
    wpId: 3,
    slug: 'privacy-policy',
    path: '/privacy-policy/',
    title: 'Privacy Policy',
    parentSlug: null,
    seo: {
      titleOverride: '',
      titleRendered: 'Privacy Policy | O3',
      descriptionOverride: '',
      descriptionRendered: '',
      canonicalOverride: '',
      canonicalRendered: 'https://www.o3world.com/privacy-policy/',
      noIndex: false,
      noFollow: false,
      ogImage: null,
      twitterImageOverride: '',
    },
    fields: {
      page_header: [
        {
          acf_fc_layout: 'basic_header',
          page_title_content: [
            { acf_fc_layout: 'title', title: 'Privacy Policy', add_description: false },
          ],
        },
      ],
      flexible_content: [
        { acf_fc_layout: 'text', text: '<h2>What we collect</h2><p>Not much.</p>' },
      ],
    },
    ...overrides,
  }
}

function expectOk(result: ReturnType<typeof mapPage>) {
  if (!result.ok) {
    throw new Error(`expected a document, got issues: ${JSON.stringify(result.issues)}`)
  }
  return result.doc
}

describe('slugFromPath', () => {
  it('strips the slashes WordPress puts around a path', () => {
    expect(slugFromPath('/privacy-policy/', 'x')).toBe('privacy-policy')
  })

  it('keeps a child page’s prefix, so its slug carries its own URL (ADR 0001)', () => {
    expect(slugFromPath('/solutions/ux-audit/', 'ux-audit')).toBe('solutions/ux-audit')
  })

  it('falls back to the WP slug when there is no path', () => {
    expect(slugFromPath('', 'careers')).toBe('careers')
  })
})

describe('mapPage', () => {
  it('maps a page onto the two-tier section model', () => {
    const doc = expectOk(mapPage(wpPage(), SITE))
    expect(doc._id).toBe('page-wp-3')
    expect(doc.pageType).toBe('standard')
    expect(doc.sections.map((s) => s._type)).toEqual(['heroSection', 'layoutSection'])
  })

  it('gives the page its only h1 through a hero, without the orbital decoration', () => {
    // heroSection is the only section block that renders an <h1>; a page
    // without one has no document heading. Orbs belong on marketing pages.
    const doc = expectOk(mapPage(wpPage(), SITE))
    expect(doc.sections[0]).toMatchObject({
      _type: 'heroSection',
      headlineLines: ['Privacy Policy'],
      decoration: 'none',
    })
  })

  it('prefers the document title when the header only differs by case', () => {
    // WordPress holds the same words twice: "Accessibility statement" as a
    // post, "Accessibility Statement" in its header. Importing that
    // inconsistency would just move it.
    const doc = expectOk(
      mapPage(
        wpPage({
          title: 'Accessibility statement',
          fields: {
            page_header: [
              {
                acf_fc_layout: 'basic_header',
                page_title_content: [{ acf_fc_layout: 'title', title: 'Accessibility Statement' }],
              },
            ],
            flexible_content: [{ acf_fc_layout: 'text', text: '<p>Body.</p>' }],
          },
        }),
        SITE,
      ),
    )
    expect((doc.sections[0] as { headlineLines: string[] }).headlineLines).toEqual([
      'Accessibility statement',
    ])
  })

  it('keeps a header that says something genuinely different', () => {
    const doc = expectOk(
      mapPage(
        wpPage({
          title: 'Privacy Policy',
          fields: {
            page_header: [
              {
                acf_fc_layout: 'basic_header',
                page_title_content: [{ acf_fc_layout: 'title', title: 'How we handle your data' }],
              },
            ],
            flexible_content: [{ acf_fc_layout: 'text', text: '<p>Body.</p>' }],
          },
        }),
        SITE,
      ),
    )
    expect((doc.sections[0] as { headlineLines: string[] }).headlineLines).toEqual([
      'How we handle your data',
    ])
  })

  it('falls back to the document title when the header has none', () => {
    const doc = expectOk(
      mapPage(
        wpPage({ fields: { flexible_content: [{ acf_fc_layout: 'text', text: '<p>Body.</p>' }] } }),
        SITE,
      ),
    )
    expect((doc.sections[0] as { headlineLines: string[] }).headlineLines).toEqual([
      'Privacy Policy',
    ])
  })

  it('carries the header description onto the hero’s subheading', () => {
    const doc = expectOk(
      mapPage(
        wpPage({
          fields: {
            page_header: [
              {
                acf_fc_layout: 'basic_header',
                page_title_content: [
                  {
                    acf_fc_layout: 'title',
                    title: 'Privacy Policy',
                    add_description: true,
                    description: '  How we handle your data.  ',
                  },
                ],
              },
            ],
            flexible_content: [{ acf_fc_layout: 'text', text: '<p>Body.</p>' }],
          },
        }),
        SITE,
      ),
    )
    expect(doc.sections[0]).toMatchObject({ subheading: 'How we handle your data.' })
  })

  it('wraps a text module in a one-column layoutSection of richText', () => {
    const doc = expectOk(mapPage(wpPage(), SITE))
    const layout = doc.sections[1] as {
      columns: number
      items: { _type: string; body: unknown[] }[]
    }
    expect(layout.columns).toBe(1)
    expect(layout.items[0]?._type).toBe('richText')
    expect(layout.items[0]?.body.length).toBeGreaterThan(0)
  })

  it('preserves heading structure through the conversion', () => {
    const doc = expectOk(mapPage(wpPage(), SITE))
    const body = (doc.sections[1] as { items: { body: { style?: string }[] }[] }).items[0]!.body
    expect(body.map((b) => b.style)).toContain('h2')
  })

  it('gives every section and block a key unique within the document', () => {
    const doc = expectOk(mapPage(wpPage(), SITE))
    const keys = JSON.stringify(doc).match(/"_key":"[^"]+"/g) ?? []
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('is deterministic — the same page converts to byte-identical JSON', () => {
    expect(JSON.stringify(expectOk(mapPage(wpPage(), SITE)))).toBe(
      JSON.stringify(expectOk(mapPage(wpPage(), SITE))),
    )
  })

  describe('fails loud rather than dropping content (ADR 0002)', () => {
    it('reports a flexible-content layout it has no mapper for', () => {
      const result = mapPage(
        wpPage({
          fields: {
            flexible_content: [
              { acf_fc_layout: 'text', text: '<p>Kept.</p>' },
              { acf_fc_layout: 'client_list' },
            ],
          },
        }),
        SITE,
      )
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.issues).toContainEqual({
        element: 'acf module',
        detail: 'unmapped layout "client_list"',
      })
    })

    it('reports a page that converted to a header and nothing else', () => {
      const result = mapPage(wpPage({ fields: { flexible_content: [] } }), SITE)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.issues.map((i) => i.element)).toContain('sections')
    })

    it('reports a slug that would move the page off its WordPress URL (#26)', () => {
      const result = mapPage(wpPage({ path: '/legal/privacy/' }), SITE)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.issues.map((i) => i.element)).toContain('path parity')
    })
  })
})

describe('the keeper list', () => {
  it('names pages that were actually extracted', () => {
    for (const slug of KEEPER_SLUGS) {
      const file = join(EXTRACT_DIR, 'page', `${slug}.json`)
      expect(existsSync(file), `${slug} is a keeper but was never extracted`).toBe(true)
    }
  })

  // The rule the list encodes: migrate pages whose value is their exact
  // words. Every keeper is a single `text` module for that reason — anything
  // design-led is greenfield (#23), and a keeper that needed a carousel would
  // be a sign the line moved without anyone deciding to move it.
  it('only names pages built from text', () => {
    for (const slug of KEEPER_SLUGS) {
      const page = JSON.parse(
        readFileSync(join(EXTRACT_DIR, 'page', `${slug}.json`), 'utf8'),
      ) as WpPage
      const layouts = (page.fields?.flexible_content ?? []).map((m) => m.acf_fc_layout)
      expect(new Set(layouts), `${slug} is not text-only`).toEqual(new Set(['text']))
    }
  })
})

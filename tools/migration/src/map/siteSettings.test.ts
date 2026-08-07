import { describe, expect, it } from 'vitest'

import type { WpChrome, WpMenuItem } from '../lib/chrome'
import type { WpSiteSeo } from '../lib/yoast'
import { hrefForMenuItem, mapSiteSettings } from './siteSettings'
import type { ExtractMeta } from './types'

const SITE: WpSiteSeo = {
  siteName: 'O3',
  siteUrl: 'http://www.o3world.com',
  separator: '|',
  description: 'Digital experience consultants',
  ogDefaultImage: 'https://www.o3world.com/up/O3.png',
  twitterSite: 'o3world',
  twitterCardType: 'summary_large_image',
}

const META: ExtractMeta = { type: 'siteChrome' }

function item(title: string, url: string, overrides: Partial<WpMenuItem> = {}): WpMenuItem {
  return { title, url, type: 'post_type', object: 'page', parent: 0, ...overrides }
}

/** The live site's three menus, trimmed to what the mapper reads. */
function chrome(overrides: Partial<WpChrome> = {}): WpChrome & { _meta: ExtractMeta } {
  return {
    _meta: META,
    menus: {
      'primary-navigation': {
        name: 'Primary Navigation',
        items: [
          item('Solutions', 'http://www.o3world.com/solutions/'),
          item('Work', 'http://www.o3world.com/work/'),
          item('About', 'http://www.o3world.com/about/'),
          item('Insights', 'http://www.o3world.com/insights/'),
          item('Contact', 'http://www.o3world.com/contact/'),
        ],
      },
      'footer-navigation': {
        name: 'Footer Navigation',
        items: [
          item('Careers', 'http://www.o3world.com/careers/'),
          item('Privacy policy', 'http://www.o3world.com/privacy-policy/'),
          item('Accessibility statement', 'http://www.o3world.com/accessibility-statement/'),
        ],
      },
      'secondary-navigation': {
        name: 'Secondary Navigation',
        items: [
          item('Digital experience consulting', 'http://www.o3world.com/solutions/dxc/'),
          item('AI solutions', 'https://www.o3xo.ai/', { type: 'custom', object: 'custom' }),
          item('1682 conference', 'http://www.o3world.com/1682-conference-ai-innovation/'),
        ],
      },
    },
    options: {
      about: '<p>…</p>',
      address: '1339 Frankford Ave',
      email: 'hello@o3world.com',
      phone: '+12155924739',
      social: [
        { label: 'LinkedIn', key: 'linkedin', url: 'https://www.linkedin.com/company/o3-world/' },
        { label: 'Instagram', key: 'instagram', url: 'https://www.instagram.com/o3world/' },
      ],
    },
    ...overrides,
  }
}

function expectOk(result: ReturnType<typeof mapSiteSettings>) {
  if (!result.ok) {
    throw new Error(`expected a document, got issues: ${JSON.stringify(result.issues)}`)
  }
  return result.doc
}

describe('hrefForMenuItem', () => {
  it('reduces an internal WordPress URL to its path, preserving parity (#26)', () => {
    expect(hrefForMenuItem(item('Work', 'http://www.o3world.com/work/'), SITE.siteUrl)).toBe(
      '/work',
    )
  })

  it('keeps a multi-segment path whole', () => {
    expect(
      hrefForMenuItem(item('DXC', 'http://www.o3world.com/solutions/dxc/'), SITE.siteUrl),
    ).toBe('/solutions/dxc')
  })

  it('leaves an off-site URL absolute', () => {
    expect(
      hrefForMenuItem(item('O3XO', 'https://www.o3xo.ai/', { type: 'custom' }), SITE.siteUrl),
    ).toBe('https://www.o3xo.ai/')
  })

  it('treats the https version of the WordPress host as internal too', () => {
    // WordPress hands out both schemes; only the host decides internal.
    expect(hrefForMenuItem(item('Work', 'https://www.o3world.com/work/'), SITE.siteUrl)).toBe(
      '/work',
    )
  })

  it('returns null for an unusable URL rather than a broken link', () => {
    expect(hrefForMenuItem(item('Broken', ''), SITE.siteUrl)).toBeNull()
    expect(hrefForMenuItem(item('Broken', 'not a url'), SITE.siteUrl)).toBeNull()
  })
})

describe('mapSiteSettings', () => {
  it('loads under the singleton id the app queries', () => {
    const doc = expectOk(mapSiteSettings(chrome(), SITE))
    expect(doc._id).toBe('siteSettings')
    expect(doc._type).toBe('siteSettings')
  })

  it('builds the nav the Figma NavBar component reads, in its order (#41)', () => {
    const doc = expectOk(mapSiteSettings(chrome(), SITE))
    expect(doc.navItems.map((i) => i.label)).toEqual([
      'Work',
      'Live',
      'Insights',
      'Solutions',
      'About',
    ])
    // WordPress's own menu title for the collection is still "Perspectives" —
    // the word ADR 0017 retired — so `DISPLAY_LABELS` is what puts the type
    // name in the nav. Dropping that override would put the old word back.
    expect(doc.navItems.map((i) => i.label)).not.toContain('Perspectives')
    // The prototype's "Services" rename is reversed — Figma reads "Solutions".
    expect(doc.navItems.map((i) => i.label)).not.toContain('Services')
  })

  /**
   * The nav links where the site serves, not where WordPress did. Before
   * ADR 0017 these were the same path; now the menu item's WordPress URL says
   * `/perspectives` and only `movedPath` turns it into the route that exists.
   * Without it every visit to Insights would take a 301 first.
   */
  it('points the moved collection at its new path, not through a redirect', () => {
    const doc = expectOk(mapSiteSettings(chrome(), SITE))
    expect(doc.navItems.find((i) => i.label === 'Insights')).toMatchObject({ href: '/insights' })
    expect(doc.navItems.map((i) => ('href' in i ? i.href : null))).not.toContain('/perspectives')
  })

  it('carries Live, which WordPress has no page for at all (#50)', () => {
    const doc = expectOk(mapSiteSettings(chrome(), SITE))
    expect(doc.navItems.find((i) => i.label === 'Live')).toMatchObject({ href: '/live' })
  })

  it('moves Contact out of the nav and into the primary CTA', () => {
    const doc = expectOk(mapSiteSettings(chrome(), SITE))
    expect(doc.navItems.map((i) => i.label)).not.toContain('Contact')
    expect(doc.primaryCta).toMatchObject({ label: 'Let’s talk', href: '/contact' })
  })

  it('builds the footer columns the Figma frame reads, in order', () => {
    const doc = expectOk(mapSiteSettings(chrome(), SITE))
    expect(doc.footerGroups.map((g) => g.label)).toEqual(['Company', 'Everything else'])
    expect(doc.footerGroups[0]?.links.map((l) => l.label)).toEqual([
      'Work',
      'About',
      'Solutions',
      'Careers',
      'Blog',
    ])
    // The two service pages in the secondary menu are nav content in the
    // redesign, not footer content — only the campaign destinations carry over.
    expect(doc.footerGroups[1]?.links.map((l) => l.label)).toEqual(['1682 conference', 'O3XO'])
  })

  it('points Careers at the About page’s section, not the WordPress page (#34)', () => {
    const doc = expectOk(mapSiteSettings(chrome(), SITE))
    const careers = doc.footerGroups[0]?.links.find((l) => l.label === 'Careers')
    expect(careers).toMatchObject({ href: '/about#careers' })
  })

  it('splits legal links out of the footer menu', () => {
    const doc = expectOk(mapSiteSettings(chrome(), SITE))
    expect(doc.legalLinks.map((l) => l.label)).toEqual([
      'Privacy policy',
      'Accessibility statement',
    ])
  })

  it('takes socials from the ACF options page', () => {
    const doc = expectOk(mapSiteSettings(chrome(), SITE))
    expect(doc.socialLinks.map((s) => s.label)).toEqual(['LinkedIn', 'Instagram'])
  })

  it('populates defaultSeo from the Yoast site settings (#26 hands this over)', () => {
    const doc = expectOk(mapSiteSettings(chrome(), SITE))
    expect(doc.defaultSeo).toEqual({
      description: 'Digital experience consultants',
      ogImage: { _type: 'image', _wpSrc: 'https://www.o3world.com/up/O3.png' },
    })
  })

  it('is born unlocked, with provenance back to WordPress', () => {
    const doc = expectOk(mapSiteSettings(chrome(), SITE))
    expect(doc.migration).toEqual({
      locked: false,
      sourceId: 'wp:site:chrome',
    })
  })

  it('is deterministic — the same chrome converts to byte-identical JSON', () => {
    const first = expectOk(mapSiteSettings(chrome(), SITE))
    const second = expectOk(mapSiteSettings(chrome(), SITE))
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  describe('fails loud rather than shipping half a chrome (ADR 0002)', () => {
    it('reports a missing primary menu', () => {
      const source = chrome()
      const result = mapSiteSettings(
        { ...source, menus: { ...source.menus, 'primary-navigation': { name: '', items: [] } } },
        SITE,
      )
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.issues.map((i) => i.element)).toContain('navItems')
    })

    it('reports an ACF options page with no socials', () => {
      const source = chrome()
      const result = mapSiteSettings(
        { ...source, options: { ...source.options, social: [] } },
        SITE,
      )
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.issues.map((i) => i.element)).toContain('socialLinks')
    })

    it('writes nothing at all when it fails', () => {
      const source = chrome()
      const result = mapSiteSettings(
        { ...source, menus: { ...source.menus, 'primary-navigation': { name: '', items: [] } } },
        SITE,
      )
      expect(result).not.toHaveProperty('doc')
    })
  })
})

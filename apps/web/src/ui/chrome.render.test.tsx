import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { SiteFooter } from './SiteFooter'
import { SiteNav } from './SiteNav'

/**
 * The site chrome (#19), rendered from the **committed** Site Settings
 * document rather than a fixture. The chrome is the one thing every page
 * shows, and it is authored entirely in data — so the test that earns its
 * keep is "does the real converted document produce the prototype's nav and
 * footer", not "does the component map an array".
 */
const settings = JSON.parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../tools/migration/data/converted/siteSettings/settings.json',
    ),
    'utf8',
  ),
) as NonNullable<SITE_SETTINGS_QUERY_RESULT>

const navHtml = renderToStaticMarkup(<SiteNav settings={settings} />)
const footerHtml = renderToStaticMarkup(<SiteFooter settings={settings} />)

describe('site nav', () => {
  it('renders every nav item from Site Settings', () => {
    for (const item of settings.navItems ?? []) {
      expect(navHtml, `nav is missing "${item.label}"`).toContain(item.label as string)
    }
  })

  it('uses the redesign’s display copy, not WordPress’s type names', () => {
    // CONTEXT.md: "Insights" is display copy for the Perspectives collection.
    expect(navHtml).toContain('Insights')
    expect(navHtml).not.toContain('Perspectives')
  })

  it('reads as the Figma NavBar component does, in its order (#41)', () => {
    // `1710:2271` — Work · Live · Insights · Solutions · About.
    expect(settings.navItems?.map((i) => i.label)).toEqual([
      'Work',
      'Live',
      'Insights',
      'Solutions',
      'About',
    ])
    // The prototype's "Services" rename is reversed; #19's "Insights" stands.
    expect(navHtml).not.toContain('Services')
  })

  it('links to the paths WordPress serves today, so parity survives the chrome', () => {
    expect(navHtml).toContain('href="/perspectives"')
    expect(navHtml).toContain('href="/work"')
  })

  it('renders the primary CTA', () => {
    expect(navHtml).toContain(settings.primaryCta?.label as string)
  })
})

describe('site footer', () => {
  it('renders the tagline', () => {
    expect(footerHtml).toContain(settings.footerTagline as string)
  })

  it('renders every link column with its heading', () => {
    for (const group of settings.footerGroups ?? []) {
      expect(footerHtml, `footer is missing the "${group.label}" column`).toContain(
        group.label as string,
      )
      for (const link of group.links ?? []) {
        expect(footerHtml, `"${group.label}" is missing "${link.label}"`).toContain(
          link.label as string,
        )
      }
    }
  })

  it('renders the socials column from the ACF options page', () => {
    expect(footerHtml).toContain(settings.socialsLabel as string)
    for (const social of settings.socialLinks ?? []) {
      expect(footerHtml).toContain(social.url as string)
    }
  })

  it('opens external social profiles safely', () => {
    expect(footerHtml).toContain('rel="noreferrer"')
  })

  it('renders the legal links and the copyright line', () => {
    for (const link of settings.legalLinks ?? []) {
      expect(footerHtml).toContain(link.label as string)
    }
    expect(footerHtml).toContain(settings.legalName as string)
    expect(footerHtml).toContain(settings.copyrightNote as string)
    expect(footerHtml).toContain(String(new Date().getFullYear()))
  })
})

describe('every chrome destination is a route the build-out lands (#48)', () => {
  /**
   * The chrome is the one thing on every page, so a link here that goes
   * nowhere is a site-wide dead end. This is the checklist #48 proves: each
   * internal destination, and what has to ship for it to resolve.
   *
   * External URLs are excluded — they are WordPress facts, not our routes.
   */
  const INTENDED_ROUTES: Readonly<Record<string, string>> = {
    '/': 'seeded — data/seed/page/index.json',
    '/work': 'Work index — #43',
    '/live': 'Live — #50 (route name still to be confirmed there)',
    '/perspectives': 'Perspectives index — #49',
    '/solutions': 'Solutions — #47',
    '/about': 'About — #46',
    '/about#careers': 'the Careers section of About (#34) — #46',
    '/contact': 'no Figma frame; inherits map #1’s open forms question',
    '/privacy-policy': 'migrated — converted/page/privacy-policy.json',
    '/accessibility-statement': 'migrated — converted/page/accessibility-statement.json',
    '/1682-conference-ai-innovation': 'campaign page — not yet migrated (#32)',
  }

  const chromeHrefs = [
    ...(settings.navItems ?? []),
    settings.primaryCta,
    ...(settings.footerGroups ?? []).flatMap((g) => g.links ?? []),
    ...(settings.legalLinks ?? []),
  ]
    .filter((cta) => cta != null)
    .map((cta) => cta.href)
    .filter((href): href is string => typeof href === 'string')
    .filter((href) => href.startsWith('/'))

  it('points every internal link at a declared route', () => {
    for (const href of chromeHrefs) {
      expect(INTENDED_ROUTES, `chrome links to "${href}", which nothing is landing`).toHaveProperty(
        href,
      )
    }
  })

  it('does not link to /careers, which the redesign folds into About (#34)', () => {
    expect(chromeHrefs).not.toContain('/careers')
  })
})

describe('chrome degrades rather than crashing on an empty dataset', () => {
  // The homepage must still render before Site Settings is loaded — a broken
  // layout would take every route down with it.
  it('renders with no settings at all', () => {
    expect(() => renderToStaticMarkup(<SiteNav settings={null} />)).not.toThrow()
    expect(() => renderToStaticMarkup(<SiteFooter settings={null} />)).not.toThrow()
  })
})

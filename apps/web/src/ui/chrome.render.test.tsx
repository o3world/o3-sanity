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

/**
 * The O3 mark in each piece of chrome, matched on its 64 viewBox — which both
 * `BrandLogo` and `BrandMark` keep, and nothing else in the chrome uses.
 * Matching the whole element is what lets a test say "no plate in here"
 * without the hamburger's `<rect>` bars answering for it.
 */
const markIn = (html: string) =>
  html.match(/<svg[^>]*viewBox="0 0 64 64"[\s\S]*?<\/svg>/)?.[0] ?? ''
const navMark = markIn(navHtml)
const footerMark = markIn(footerHtml)

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

/**
 * The pinned bar and its two skins. Scroll sampling is `NavInk`'s and is not
 * testable here — jsdom has no layout, so every rect is zero and every answer
 * would be an artefact. What IS testable, and what actually breaks, is the
 * state the server ships and whether the flipped state is reachable at all.
 */
describe('the nav bar’s pinned, dark-ink default', () => {
  it('pins at every width, because a bar that leaves cannot cross a band', () => {
    // c1ee258's `lg:absolute` is what the ink flip needs gone.
    expect(navHtml).toContain('fixed')
    expect(navHtml).not.toContain('lg:absolute')
  })

  it('blurs whatever it is floating over', () => {
    // The prototype's `backdrop-filter: blur(14px)`, carried deliberately.
    expect(navHtml).toContain('backdrop-blur-[14px]')
  })

  it('server-renders the dark skin, with no ink attribute at all', () => {
    // No JS and no scroll position: the bar starts over the hero, which is
    // dark on every route. This is also what jsdom and a no-JS reader get.
    expect(navHtml).not.toContain('data-ink')
    expect(navHtml).toContain('bg-scrim')
    expect(navHtml).toContain('text-white')
  })

  it('keeps the flipped skin one attribute away, not a second component', () => {
    // Fill, hairline and copy all hang off `data-ink="dark"` on the header,
    // which is the whole contract between NavInk and this file.
    expect(navHtml).toContain('group-data-[ink=dark]:bg-scrim-light')
    expect(navHtml).toContain('group-data-[ink=dark]:border-on-light-line')
    expect(navHtml).toContain('group-data-[ink=dark]:text-fg')
    expect(navHtml).toContain('duration-(--duration-ink)')
  })

  it('holds the CTA brand red through the flip — the one thing that stays put', () => {
    // Nick's reference of both states (2026-08-02) draws it red on the light
    // pill and the dark one alike, as the prototype's `.o3btn` did. The red is
    // forced by the chrome, not a `Button` variant an editor could reach.
    // `rounded-btn` is `Button`'s own base class, which is what separates the
    // two CTAs from the hamburger's plain `<button>` trigger.
    const buttons = (navHtml.match(/<button[^>]*>/g) ?? []).filter((b) => b.includes('rounded-btn'))
    expect(buttons.length, 'the nav CTA was not found at all').toBe(2) // 1440 + 402
    for (const button of buttons) {
      expect(button).toContain('bg-brand')
      expect(button).toContain('hover:bg-brand/85')
      // Nothing on this button may hang off the bar's ink.
      expect(button).not.toContain('group-data-[ink=dark]')
      // …and with no flip to land, it keeps Button's own 220ms hover.
      expect(button).not.toContain('duration-(--duration-ink)')
    }
  })

  it('draws the mark without its plate, so there is nothing to invert', () => {
    // Nick's direction, 2026-08-02: the O3 changes colour to stay visible,
    // "without the square box". `BrandLogo`'s filled square IS the plate — the
    // nav uses `BrandMark` instead, and the tile stays a tile in the footer.
    //
    // Scoped to the 64 box: the hamburger draws its two bars as `<rect>` too,
    // so a document-wide probe for one would pass on the wrong element.
    expect(navMark, 'the nav mark was not found at all').not.toBe('')
    expect(navMark).not.toContain('<rect')
    expect(footerMark).toContain('<rect width="64" height="64" fill="currentColor"')
  })

  it('lets the mark take the bar’s ink rather than carrying its own', () => {
    // `currentColor` + no text color on the svg = the mark inherits white now
    // and `--color-fg` when flipped, riding the bar's own 350ms transition.
    // A color class here would strand the mark on one side of the flip.
    expect(navMark).toContain('fill="currentColor"')
    expect(navMark).not.toMatch(/text-(white|ink-deep|ink|fg|brand)/)
  })

  it('leaves the ink to the bar rather than pinning it on each link', () => {
    // A `text-white` on a link would survive the flip and strand one word in
    // white on a light band.
    const links = navHtml.match(/<a [^>]*class="[^"]*text-button[^"]*"/g) ?? []
    expect(links.length, 'the nav links were not found at all').toBeGreaterThan(0)
    for (const link of links) expect(link).not.toContain('text-white')
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

  it('keeps the red tile, which the nav’s box-less mark never touched', () => {
    // `1680:2099`. The two components share their geometry, so the assertion
    // worth having is that the footer still gets the PLATE and the brand fill —
    // the two parts the nav gave up — with its counterforms knocked out white.
    expect(footerMark, 'the footer mark was not found at all').not.toBe('')
    expect(footerMark).toContain('text-brand')
    expect(footerMark).toContain('fill="white"')
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

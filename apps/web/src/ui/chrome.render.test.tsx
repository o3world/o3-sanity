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

  it('ships the CTA white, and flips it dark rather than leaving it to vanish', () => {
    // `Button`'s `light` fill on the dark skin; its `dark` fill on the light
    // one, because `--color-scrim-light` is itself white and #58's one
    // conversion path would otherwise disappear where the flip fires.
    // `rounded-btn` is `Button`'s own base class, which is what separates the
    // two CTAs from the hamburger's plain `<button>` trigger.
    const buttons = (navHtml.match(/<button[^>]*>/g) ?? []).filter((b) => b.includes('rounded-btn'))
    expect(buttons.length, 'the nav CTA was not found at all').toBe(2) // 1440 + 402
    for (const button of buttons) {
      expect(button).toContain('bg-white')
      expect(button).toContain('group-data-[ink=dark]:bg-ink')
      expect(button).toContain('group-data-[ink=dark]:text-white')
      expect(button).toContain('group-data-[ink=dark]:hover:bg-ink/85')
      // Button hovers at --duration-hover; this one lands with the bar.
      expect(button).toContain('duration-(--duration-ink)')
    }
  })

  it('rests on the white mark and flips it to the ink tile, both inks together', () => {
    // The mark reverses with the surface (2026-08-02 direction): `Color=White`
    // at rest over the dark hero, `264:52`'s black tile over a light band.
    expect(navHtml).toContain('text-white')
    expect(navHtml).toContain('[--logo-counterform:var(--color-ink-deep)]')
    expect(navHtml).toContain('group-data-[ink=dark]:text-ink-deep')
    expect(navHtml).toContain('group-data-[ink=dark]:[--logo-counterform:white]')
    // The counterforms are one `<g>`, so the square and the ring cannot land
    // on different sides of the flip.
    expect(navHtml).toContain('fill="var(--logo-counterform, white)"')
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

  it('keeps the red mark exactly as it was through the counterform refactor', () => {
    // `--logo-counterform` exists for the nav. The footer sets nothing, so the
    // fallback has to be the literal white the frame draws (`1680:2099`) —
    // this is the assertion that catches a default changed for the nav's sake.
    expect(footerHtml).toContain('text-brand')
    expect(footerHtml).toContain('fill="var(--logo-counterform, white)"')
    expect(footerHtml).not.toContain('--logo-counterform:')
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

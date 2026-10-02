import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { BrandMark } from '@o3/ui'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { resolveAssetMarkers } from '../testing'

import { SiteFooter } from './SiteFooter'
import { SiteNav } from './SiteNav'

/**
 * The site chrome (#19), rendered from the **committed** Site Settings
 * document rather than a fixture. The chrome is the one thing every page
 * shows, and it is authored entirely in data — so the test that earns its
 * keep is "does the real converted document produce the prototype's nav and
 * footer", not "does the component map an array".
 *
 * The marks below are the ones `apps/web` hands the chrome (#228) — the chrome
 * draws no mark of its own, so every O3-flavoured assertion in this file is
 * about what that app supplies through the seam.
 */
const settingsDoc = JSON.parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../tools/migration/data/converted/siteSettings/settings.json',
    ),
    'utf8',
  ),
)

/**
 * The committed document carries `_localSrc` where `load` puts an asset
 * reference — the two property marks in `utilityNavItems` are the only ones in
 * this file — and a renderer handed a raw marker draws nothing. Ids are faked
 * from the path: nothing here asserts on a URL, only that the mark reached the
 * footer.
 */
const settings = resolveAssetMarkers(
  settingsDoc,
  (source) => `image-${'0'.repeat(40)}-${source.endsWith('.svg') ? '1x1-svg' : '1200x630-png'}`,
) as NonNullable<SITE_SETTINGS_QUERY_RESULT>

const O3_NAV_MARK = <BrandMark size={64} className="lg:-m-2" />
const O3_FOOTER_MARK = <BrandMark trim size={128} className="lg:size-[148px]" />

/** The footer prints the year it is handed; the layout is what resolves one. */
const HANDED_YEAR = 2026

const navHtml = renderToStaticMarkup(<SiteNav settings={settings} brandMark={O3_NAV_MARK} />)
const footerHtml = renderToStaticMarkup(
  <SiteFooter settings={settings} brandMark={O3_FOOTER_MARK} year={HANDED_YEAR} />,
)

/**
 * The O3 mark in each piece of chrome, matched on its viewBox — the tile's 64
 * box in the nav, and `BrandMark`'s trimmed box in the footer, whose Figma
 * vector is bounded to the mark itself (`1280:1856`). Nothing else in the
 * chrome draws either. Matching the whole element is what lets a test say "no
 * plate in here" without the hamburger's `<rect>` bars answering for it.
 */
const markIn = (html: string) =>
  html.match(
    /<svg[^>]*viewBox="(?:0 0 64 64|16\.6016 16\.5947 38\.8394 38\.7806)"[\s\S]*?<\/svg>/,
  )?.[0] ?? ''
const navMark = markIn(navHtml)
const footerMark = markIn(footerHtml)

describe('site nav', () => {
  it('renders every nav item from Site Settings', () => {
    for (const item of settings.navItems ?? []) {
      expect(navHtml, `nav is missing "${item.label}"`).toContain(item.label as string)
    }
  })

  it('uses the redesign’s vocabulary, not WordPress’s', () => {
    // WordPress's menu still says "Perspectives"; the nav says the type name
    // (ADR 0017). The mapper's DISPLAY_LABELS override is what makes that so,
    // and this is what fails if it is ever dropped as redundant.
    expect(navHtml).toContain('Insights')
    expect(navHtml).not.toContain('Perspectives')
  })

  it('reads as the Figma NavBar component does, in its order (#41)', () => {
    // `2225:2920` — Work · Live · Insights · Solutions · About.
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
    expect(navHtml).toContain('href="/insights"')
    expect(navHtml).toContain('href="/work"')
  })

  it('renders the primary button', () => {
    expect(navHtml).toContain(settings.primaryButton?.label as string)
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

  it('names the view transition on the pill, so the glass has a backdrop to blur', () => {
    // AN ELEMENT WITH A `view-transition-name` IS ITS OWN BACKDROP ROOT. On
    // the `<header>` the name left the pill's `backdrop-filter` with nothing
    // behind it to sample, and the glass painted on no page at all while every
    // computed style still read `blur(40px)`. The two have to be on the SAME
    // element, which is what this asserts: the name and the blur travel
    // together or the bar silently stops being glass.
    const named = navHtml.match(/class="[^"]*\[view-transition-name:site-nav\][^"]*"/)
    expect(named, 'nothing carries the view-transition name').not.toBeNull()
    expect(named![0]).toContain('backdrop-blur-')

    // And nothing ABOVE it carries one — an ancestor's name is the same bug.
    const header = navHtml.slice(0, navHtml.indexOf('<nav'))
    expect(header).not.toContain('view-transition-name')
  })

  it('blurs whatever it is floating over', () => {
    // The Glass effect's frost and rim (`3271:17013`): the photograph under
    // the pill is a tone, not a shape.
    expect(navHtml).toContain('backdrop-blur-[10px]')
    expect(navHtml).toContain('backdrop-saturate-[1.1]')
    expect(navHtml).toContain('shadow-glass-rim')
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
    // The flipped fill is a WHITE scrim: an alpha, so the bar's blur still
    // reads through it, but never the grey a dark scrim makes of a pale band.
    expect(navHtml).toContain('group-data-[ink=dark]:bg-scrim-light')
    expect(navHtml).toContain('group-data-[ink=dark]:text-fg')
    expect(navHtml).toContain('duration-(--duration-ink)')
  })

  it('resolves the button’s fill from the surface the bar declares, and inverts it with the flip', () => {
    // The pill instances `Theme=White` (`2205:1298`). Nothing here forces that:
    // `SiteNav` declares the bar an `ink` surface and Auto reads it, which is
    // the whole of #147 at the one place the band system does not reach.
    //
    // They are anchors: the nav button carries a destination, and a button
    // with one renders a link. `rounded-btn` is the button's own base class,
    // which separates the desktop CTA from the plain nav links. The mobile
    // CTA is also visible in the collapsed header in the September design.
    const buttons = (navHtml.match(/<a [^>]*>/g) ?? []).filter((b) => b.includes('rounded-btn'))
    expect(buttons.length, 'desktop and mobile both expose the contact action').toBe(2)
    for (const button of buttons) {
      // The resolved skin, and the only one a server, no-JS or jsdom render
      // ever draws — `data-ink` exists solely because a browser measured a
      // light band under the bar.
      expect(button).toContain('[--button-bg:var(--color-white)]')
      expect(button).toContain('[--button-fg:var(--color-ink)]')
      // Flipped, it inverts with the links and the hairline. White on the
      // white scrim keeps the label and loses the button.
      expect(button).toContain('group-data-[ink=dark]:[--button-bg:var(--color-ink)]')
      expect(button).toContain('group-data-[ink=dark]:[--button-fg:var(--color-white)]')
    }
  })

  it('draws the mark without its plate, so there is nothing to invert', () => {
    // Nick's direction, 2026-08-02: the O3 changes colour to stay visible,
    // "without the square box" — `BrandMark` draws no plate.
    //
    // Scoped to the mark's own svg: the hamburger draws its two bars as
    // `<rect>` too, so a document-wide probe for one would pass on the wrong
    // element.
    expect(navMark, 'the nav mark was not found at all').not.toBe('')
    expect(navMark).not.toContain('<rect')
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
    // white on a light band. The nav button is an anchor too and is excluded
    // by `rounded-btn`: its ink label is its resolved fill's, and that one is
    // meant to survive the flip.
    const links = (navHtml.match(/<a [^>]*class="[^"]*text-button[^"]*"/g) ?? []).filter(
      (link) => !link.includes('rounded-btn'),
    )
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

  it('draws the logo as the plate-less mark, taking the band’s white (#87)', () => {
    // `1280:1856` — the 2026-08 component drops the red tile for a white vector
    // of the mark alone. So: no plate, no brand fill, and no colour class,
    // because the mark inherits the footer's `text-white` the way the nav's
    // inherits the bar's ink.
    expect(footerMark, 'the footer mark was not found at all').not.toBe('')
    expect(footerMark).not.toContain('<rect')
    expect(footerMark).not.toContain('text-brand')
    expect(footerMark).toContain('fill="currentColor"')
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
    expect(footerHtml).toContain(String(HANDED_YEAR))
    // The legal row is `on-utility` (#AAA69E) — the component binds the same
    // variable here as the Utility Nav links (`2050:1226`), not the cool
    // `fg-subtle` grey the row shipped with (2026-08-13 token pass).
    expect(footerHtml).toContain('text-on-utility')
    expect(footerHtml).not.toContain('text-fg-subtle')
    // The copyright note IS the `Go birds.` easter egg (`1275:1631`), whose
    // only state is `State=Hover` — Eagles green, `#339C5E`.
    expect(footerHtml).toContain('hover:text-[#339c5e]')
  })

  it('draws a property’s mark in place of the footer link to the same place', () => {
    const html = renderToStaticMarkup(
      <SiteFooter
        settings={settings}
        brandMark={O3_FOOTER_MARK}
        year={HANDED_YEAR}
        utilityNavItems={settings.utilityNavItems}
      />,
    )
    // The label survives as the alt text, so the link keeps its name.
    expect(html).toContain('alt="1682 Conference"')
    expect(html).toContain('alt="O3XO"')
    // 20px tall, width from each file's own proportions.
    expect((html.match(/h-5 w-auto/g) ?? []).length).toBe(2)
    expect(footerHtml).not.toContain('h-5 w-auto')
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
    '/insights': 'Insights index — #49',
    '/solutions': 'Solutions — #47',
    '/about': 'About — #46',
    '/about#careers': 'the Careers section of About (#34) — #46',
    '/contact': 'no Figma frame; inherits map #1’s open forms question',
    '/privacy-policy': 'migrated — converted/page/privacy-policy.json',
    '/accessibility-statement': 'migrated — converted/page/accessibility-statement.json',
    '/1682-conference-ai-innovation': 'campaign page — not yet migrated (#32)',
  }

  const chromeHrefs = [
    // `utilityNavItems` is a union too: a member drawn as its mark keeps its
    // destination one level in, on the `button` the `brandLogo` wraps.
    ...(settings.utilityNavItems ?? []).map((item) =>
      item._type === 'brandLogo' ? item.button : item,
    ),
    // `navItems` is a union: a member is a button or a `navGroup`, and only
    // the button half carries an href. No group is authored, so this narrowing
    // drops nothing here — it is what keeps the sweep honest if one ever is.
    ...(settings.navItems ?? []).filter((item) => item._type === 'button'),
    settings.primaryButton,
    ...(settings.footerGroups ?? []).flatMap((g) => g.links ?? []),
    ...(settings.legalLinks ?? []),
  ]
    .filter((button) => button != null)
    .map((button) => button.href)
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

/** The mark is the app's (#228): the chrome takes one and draws it where the frame puts it. */
describe('the mark comes from the app, not the chrome', () => {
  const probe = <svg data-mark="probe" viewBox="0 0 1 1" />
  const probeNav = renderToStaticMarkup(<SiteNav settings={settings} brandMark={probe} />)

  it('puts the nav mark inside the home link, where the whole mark is the target', () => {
    expect(probeNav).toMatch(/<a[^>]*href="\/"[^>]*>\s*<svg data-mark="probe"/)
  })
})

describe('chrome degrades rather than crashing on an empty dataset', () => {
  // The homepage must still render before Site Settings is loaded — a broken
  // layout would take every route down with it.
  it('renders with no settings at all', () => {
    expect(() =>
      renderToStaticMarkup(<SiteNav settings={null} brandMark={O3_NAV_MARK} />),
    ).not.toThrow()
    expect(() =>
      renderToStaticMarkup(
        <SiteFooter settings={null} brandMark={O3_FOOTER_MARK} year={HANDED_YEAR} />,
      ),
    ).not.toThrow()
  })
})

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { BrandMark } from '@o3/ui'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { SiteFooter } from './SiteFooter'
import { SiteNav } from './SiteNav'
import { UtilityNav } from './UtilityNav'

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
const settings = JSON.parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../tools/migration/data/converted/siteSettings/settings.json',
    ),
    'utf8',
  ),
) as NonNullable<SITE_SETTINGS_QUERY_RESULT>

const O3_NAV_MARK = <BrandMark size={64} />
const O3_FOOTER_MARK = <BrandMark trim size={128} className="lg:size-[148px]" />

const navHtml = renderToStaticMarkup(<SiteNav settings={settings} brandMark={O3_NAV_MARK} />)
const utilityHtml = renderToStaticMarkup(<UtilityNav settings={settings} />)
const footerHtml = renderToStaticMarkup(
  <SiteFooter settings={settings} brandMark={O3_FOOTER_MARK} />,
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

  it('resolves the button’s fill from the surface the bar declares, and inverts it with the flip', () => {
    // The pill instances `Theme=White` (`2205:1298`). Nothing here forces that:
    // `SiteNav` declares the bar an `ink` surface and Auto reads it, which is
    // the whole of #147 at the one place the band system does not reach.
    //
    // They are anchors: the nav button carries a destination, and a button
    // with one renders a link. `rounded-btn` is the button's own base class,
    // which is what separates the two of them from the plain nav links.
    const buttons = (navHtml.match(/<a [^>]*>/g) ?? []).filter((b) => b.includes('rounded-btn'))
    expect(buttons.length, 'the nav button was not found at all').toBe(2) // 1440 + 402
    for (const button of buttons) {
      // The resolved skin, and the only one a server, no-JS or jsdom render
      // ever draws — `data-ink` exists solely because a browser measured a
      // light band under the bar.
      expect(button).toContain('bg-white')
      expect(button).toContain('text-ink')
      // Flipped, it inverts with the links and the hairline. White on
      // `--color-scrim-light` keeps the label and loses the button.
      expect(button).toContain('group-data-[ink=dark]:bg-ink')
      expect(button).toContain('group-data-[ink=dark]:text-white')
    }
  })

  it('draws the mark without its plate, so there is nothing to invert', () => {
    // Nick's direction, 2026-08-02: the O3 changes colour to stay visible,
    // "without the square box". `BrandLogo`'s filled square IS the plate, so
    // the nav uses `BrandMark`.
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

/**
 * The brand-property strip (#88). It is the only piece of chrome that is NOT
 * pinned — the Home frame draws it in flow, above everything, with the pill
 * fixed 14px under it — so the assertions worth having are the ones that break
 * if someone folds it into the nav's fixed header or gives one property a state
 * the frame does not draw.
 */
describe('utility nav', () => {
  it('renders the three brand properties, in the frame’s order', () => {
    expect(settings.utilityNavItems?.map((i) => i.label)).toEqual([
      'O3 World',
      '1682 Conference',
      'O3XO',
    ])
    for (const item of settings.utilityNavItems ?? []) {
      expect(utilityHtml, `strip is missing "${item.label}"`).toContain(item.label as string)
    }
  })

  it('points each property at the destination the site already publishes', () => {
    // Nothing invented: `/` is this site, and the other two are the URLs the
    // footer's "Everything else" column has carried since #19.
    expect(utilityHtml).toContain('href="/"')
    expect(utilityHtml).toContain('href="/1682-conference-ai-innovation"')
    expect(utilityHtml).toContain('href="https://www.o3xo.ai/"')
  })

  it('scrolls with the page instead of pinning like the pill', () => {
    // `2250:1453` is an in-flow child of the Home frame (`scrollBehavior:
    // SCROLLS`) where `NavBar` is `ABSOLUTE` + `FIXED`. A `fixed` here would
    // also cover the top 50px of every hero for the length of the page.
    expect(utilityHtml).not.toContain('fixed')
  })

  it('is desktop-only, because mobile Home has no strip above the bar', () => {
    // `1814:1618` opens on the nav bar at y:0. Hidden rather than restyled —
    // and hidden costs no height, so the 402 chrome is untouched.
    expect(utilityHtml).toContain('hidden')
    expect(utilityHtml).toContain('lg:flex')
  })

  it('highlights no property, because the frame highlights none', () => {
    // All three links are State=Default at the same fill, so the strip is a
    // switcher, not a breadcrumb. `aria-current` would be a claim the design
    // does not make, and a second colour class would be one you could see.
    expect(utilityHtml).not.toContain('aria-current')
    const links = utilityHtml.match(/<a [^>]*class="[^"]*"/g) ?? []
    expect(links.length).toBe(3)
    const classes = new Set(links.map((link) => link.match(/class="([^"]*)"/)?.[1]))
    expect(classes.size, 'one property is styled differently from the others').toBe(1)
  })

  it('takes the strip’s own tokens, not the pill’s scrim', () => {
    // The bar is opaque black with a solid hairline; the pill is two alphas
    // that flip. Reaching for `bg-scrim` here would make it flip with them.
    expect(utilityHtml).toContain('bg-utility')
    expect(utilityHtml).toContain('text-on-utility')
    expect(utilityHtml).toContain('border-on-utility-line')
    expect(utilityHtml).not.toContain('bg-scrim')
    expect(utilityHtml).not.toContain('group-data-[ink=dark]')
  })

  it('hovers to brand red — a read state, not a house habit', () => {
    // `2225:2893`, and the design's one canonical red-on-dark anchor.
    expect(utilityHtml).toContain('hover:text-brand')
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

  it('sits on the component’s black band, padded 64px 96px (#87)', () => {
    // `1280:1885` is `#000000`, not `--color-ink-deep`'s `#030303`, and 64px
    // top AND bottom where the frame footer this was first built from had
    // `96px 96px 16px`.
    expect(footerHtml).toContain('bg-black')
    expect(footerHtml).toContain('px-gutter')
    expect(footerHtml).toContain('py-16')
    expect(footerHtml).not.toContain('bg-ink-deep')
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
    // The legal row is `on-utility` (#AAA69E) — the component binds the same
    // variable here as the Utility Nav links (`2050:1226`), not the cool
    // `fg-subtle` grey the row shipped with (2026-08-13 token pass).
    expect(footerHtml).toContain('text-on-utility')
    expect(footerHtml).not.toContain('text-fg-subtle')
    // The copyright note IS the `Go birds.` easter egg (`1275:1631`), whose
    // only state is `State=Hover` — Eagles green, `#339C5E`.
    expect(footerHtml).toContain('hover:text-[#339c5e]')
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
    ...(settings.utilityNavItems ?? []),
    // `navItems` is a union since O3XO's nav grew dropdowns: a member is a
    // button or a `navGroup`, and only the button half carries an href. O3
    // authors no group, so this narrowing drops nothing here — it is what
    // keeps the sweep honest if it ever does.
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

/**
 * The mark is the app's (#228). Both brands render this chrome, and O3XO's
 * mark is a different drawing in a colour no shared role names — so the chrome
 * takes one and draws it, rather than choosing between two.
 *
 * A probe in place of a brand's mark is what proves it: whatever the chrome
 * still draws of its own would show up here as the O3 geometry the seam is
 * meant to have removed.
 */
describe('the mark comes from the app, not the chrome', () => {
  const probe = <svg data-mark="probe" viewBox="0 0 1 1" />
  const probeNav = renderToStaticMarkup(<SiteNav settings={settings} brandMark={probe} />)
  const probeFooter = renderToStaticMarkup(<SiteFooter settings={settings} brandMark={probe} />)

  it.each([
    ['nav', probeNav],
    ['footer', probeFooter],
  ])('draws the mark %s was handed', (_where, html) => {
    expect(html).toContain('data-mark="probe"')
  })

  it.each([
    ['nav', probeNav],
    ['footer', probeFooter],
  ])('keeps no mark of its own in the %s', (_where, html) => {
    // The two boxes O3's mark draws in. Either one surviving a probe render is
    // a brand's geometry hardcoded in shared chrome.
    expect(markIn(html)).toBe('')
  })

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
      renderToStaticMarkup(<SiteFooter settings={null} brandMark={O3_FOOTER_MARK} />),
    ).not.toThrow()
  })
})

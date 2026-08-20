import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { SiteFooter } from './SiteFooter'
import { SiteNav } from './SiteNav'
import type { NavGroup, Settings } from './navItems'

/**
 * O3XO's own chrome (#243), rendered from the **committed** Site Settings
 * document rather than a fixture — the same standard the shared chrome's test
 * holds itself to. The chrome is the one thing every page shows and it is
 * authored entirely in data, so what earns its keep is "does the real
 * converted document produce the kit's bar and footer".
 *
 * This file exists beside the stories rather than instead of them. A story
 * paints; it cannot say that a trigger carries `aria-expanded`, that the
 * `aria-controls` it names resolves to something, or that a panel nobody has
 * hovered is already in the markup — which is the whole of the dropdown's
 * contract with a screen reader.
 */
const settings = JSON.parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../tools/migration/data-o3xo/converted/siteSettings/settings.json',
    ),
    'utf8',
  ),
) as Settings

const navHtml = renderToStaticMarkup(<SiteNav settings={settings} />)
const footerHtml = renderToStaticMarkup(<SiteFooter settings={settings} />)

const groups = (settings.navItems ?? []).filter(
  (item): item is NavGroup => item._type === 'navGroup',
)

describe('the bar', () => {
  it('draws every nav item the document authors', () => {
    for (const item of settings.navItems ?? []) {
      expect(navHtml, `the bar is missing "${item.label}"`).toContain(item.label as string)
    }
  })

  it('ends the row with the bar’s button rather than a fifth link', () => {
    // `4404:4036` — Contact is a filled Button, and the kit draws no glyph on
    // it, which is what the document's `icon: none` says.
    expect(settings.primaryButton?.label).toBe('Contact')
    expect(navHtml).toContain('href="/contact"')
  })

  it('carries O3XO’s own mark, not a slot the layout fills', () => {
    // `Link - O3XO Home` (`4404:3980`) draws the horizontal lockup at 32px,
    // which the kit measures 104.33 wide. The mark rounds its box to 391 × 120
    // (#228), so it lands 6/100ths narrower — the box is the mark's to state,
    // and a nav that re-derived it from the kit would be a second source for
    // one drawing.
    expect(navHtml).toContain('viewBox="0 0 391 120"')
    expect(navHtml).toContain('height="32"')
    expect(navHtml).toContain('width="104.27"')
  })

  it('never flips its ink, because the fill is opaque', () => {
    // O3's pill samples the band under it and swaps skins; this bar is its own
    // surface at every scroll position, so there is no second skin to name.
    expect(navHtml).not.toContain('data-ink')
  })
})

describe('the dropdowns', () => {
  it('opens the three items the kit draws a caret beside', () => {
    expect(groups.map((group) => group.label)).toEqual(['Industries', 'Case studies', 'About'])
  })

  it('leaves the fourth a link, because a trigger that navigates has two jobs', () => {
    expect(navHtml).toContain('href="/insights"')
  })

  it('gives each trigger a button that says it is closed and what it controls', () => {
    const triggers = [...navHtml.matchAll(/<button[^>]*aria-expanded="false"[^>]*>/g)].map(
      (match) => match[0],
    )
    // Three panels on the bar, plus the narrow bar's menu.
    expect(triggers).toHaveLength(groups.length + 1)
    for (const trigger of triggers) {
      const controls = /aria-controls="([^"]+)"/.exec(trigger)?.[1]
      expect(controls, `a trigger controls nothing: ${trigger}`).toBeTruthy()
      expect(navHtml, `nothing carries id "${controls}"`).toContain(`id="${controls}"`)
    }
  })

  it('renders every panel closed, and every panel’s cards with it', () => {
    // `hidden` rather than unmounted: a panel a pointer has never reached is
    // still in the document, which is what lets this assert on it at all.
    for (const group of groups) {
      for (const item of group.items ?? []) {
        expect(navHtml, `"${group.label}" is missing "${item.button?.label}"`).toContain(
          item.button?.label as string,
        )
        if (item.excerpt) expect(navHtml).toContain(item.excerpt)
        if (item.eyebrow) expect(navHtml).toContain(item.eyebrow)
      }
      expect(navHtml).toContain(group.button?.label as string)
    }
  })

  it('fills every panel opaque, because it is the only dark layer over the page', () => {
    // o3xo.ai gets away with a translucent panel by stacking two of them: its
    // fixed bar grows to the open panel's height at 95% black, and the panel
    // sits on that at 90%, so ~0.5% of the page reaches a visitor. This bar is
    // sticky and the panel hangs below its box (`SiteNav`), which leaves the
    // panel the only fill between a visitor and the hero — one 95% fill passes
    // 5%, and 5% of white type is 13/255, which reads (#250).
    const controls = [...navHtml.matchAll(/aria-controls="([^"]+)"/g)].map(
      (match) => match[1] ?? '',
    )
    expect(controls.length).toBeGreaterThan(0)
    for (const id of controls) {
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const tag = new RegExp(`<[a-z]+ [^>]*id="${escaped}"[^>]*>`).exec(navHtml)?.[0]
      expect(tag, `nothing carries id "${id}"`).toBeTruthy()
      const classes = /class="([^"]*)"/.exec(tag as string)?.[1]?.split(' ') ?? []
      const fills = classes.filter((cls) => cls.startsWith('bg-'))
      expect(fills, `panel "${id}" has no fill of its own`).not.toHaveLength(0)
      for (const fill of fills) {
        expect(fill, `panel "${id}" is translucent`).not.toContain('/')
      }
    }
  })

  it('points every panel card at a route this site serves', () => {
    const hrefs = groups.flatMap((group) => (group.items ?? []).map((item) => item.button?.href))
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(href, 'a panel card goes nowhere').toMatch(
        /^\/(industries|case-studies|about)(\/[a-z0-9-]+)?$/,
      )
      expect(navHtml).toContain(`href="${href}"`)
    }
  })
})

describe('the narrow bar', () => {
  it('offers a named control rather than the row', () => {
    expect(navHtml).toContain('aria-label="Open menu"')
  })

  it('shows every group expanded, because two taps to a link is a menu to learn', () => {
    // The menu panel repeats each card, so every label appears twice: once in
    // the dropdown, once in the menu.
    for (const group of groups) {
      const occurrences = navHtml.split(`>${group.label}<`).length - 1
      expect(occurrences, `"${group.label}" is not in both bars`).toBe(2)
    }
  })
})

describe('the footer', () => {
  it('is light, where O3’s is black', () => {
    // `4404:4148` fills `#F3F3F3`, which is `bone` under O3XO's palette.
    expect(footerHtml).toContain('bg-bone')
    expect(footerHtml).toContain('data-surface="bone"')
  })

  it('sets the wordmark in type, as both the kit and the live site do', () => {
    // `4404:4044` is a TEXT node at 28/400 — `display-md` — and o3xo.ai
    // renders a paragraph in the same place. Neither draws the lockup here.
    expect(footerHtml).toContain('text-display-md')
    expect(footerHtml).toContain(settings.title as string)
    expect(footerHtml).not.toContain('<svg')
  })

  it('carries the tagline and the copyright the document authors', () => {
    expect(footerHtml).toContain(settings.footerTagline as string)
    expect(footerHtml).toContain(settings.legalName as string)
    expect(footerHtml).toContain(String(new Date().getFullYear()))
  })

  it('is where the brand-property links live, because O3XO draws no strip', () => {
    for (const link of settings.utilityNavItems ?? []) {
      expect(footerHtml, `the footer is missing "${link.label}"`).toContain(link.label as string)
      expect(footerHtml).toContain(`href="${link.href}"`)
    }
    for (const link of settings.legalLinks ?? []) {
      expect(footerHtml).toContain(link.label as string)
    }
  })

  it('draws no link columns, because the kit’s footer has none', () => {
    expect(settings.footerGroups ?? []).toHaveLength(0)
    expect(footerHtml).not.toContain('Socials')
  })
})

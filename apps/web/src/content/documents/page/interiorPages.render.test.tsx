import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'
import type { RailPanelsSection } from '@o3/sanity/types/generated'

import { buildCatchAllRoute } from '@/lib/content-routes/build'
import { CATCH_ALL_TYPES } from '@/content/documents'
import {
  aSeededPage,
  renderRoute,
  siteSettings,
  unprefixedHorizontalScrollUtilities,
  variantsOf,
  withSettings,
} from '@/test'

/**
 * The About (`1924:5344`), Solutions (`1925:6138`) and Live (`1644:1889`)
 * seeds, rendered through the real page route from the **committed** JSON —
 * the same durable proof `home.render.test.tsx` gives the homepage.
 *
 * About and Solutions landed provisional in #46 and #47 because four of their
 * bands had no block that fit. #56 built the blocks; what these tests hold is
 * that the bands now reach the page through them rather than through a
 * `layoutSection` approximation — which is exactly what "no longer
 * provisional" claims.
 *
 * Live is net-new (#50) and has no counterpart on the current site, so its
 * tests carry a second job: they are the only place that says what the route
 * `/live` resolves to.
 *
 * Contact and 1682 (#48) have no canonical frame at all — their copy is
 * WordPress's, their composition assembled from existing blocks, and both are
 * provisional. #48's gate is "every top-level link resolves", so like Live,
 * these tests are the durable proof the two routes resolve to their bands.
 */
const route = buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY)

async function render(slug: string) {
  return renderRoute(route, {
    data: withSettings(aSeededPage(slug), siteSettings()),
    params: { segments: [slug] },
  })
}

const about = await render('about')
const solutions = await render('solutions')
const live = await render('live')
const contact = await render('contact')
const conference = await render('1682-conference-ai-innovation')

describe('the seeded About page', () => {
  const html = about.html
  const sections = (aSeededPage('about').sections ?? []) as { _type: string }[]

  it('renders every section in the array — none silently dropped', () => {
    expect(html.match(/data-sanity=/g) ?? []).toHaveLength(sections.length)
  })

  // The frame's band order (`1924:5344`): hero, Why O3, the disciplines grid,
  // the team, Culture, the beyond-client-services row, Careers, CTA.
  it('follows the frame’s band sequence, with the team band restored', () => {
    expect(sections.map((s) => s._type)).toEqual([
      'heroSection',
      'layoutSection',
      'disciplineGridSection',
      'personGridSection',
      'layoutSection',
      'layoutSection',
      'roleListSection',
      'ctaSection',
    ])
  })

  it.each([
    ['disciplines heading', '4 disciplines. One team.'],
    ['a discipline body', 'before a line of code is written'],
    ['team eyebrow', 'Our team'],
    ['team heading', 'The people who find it and build it.'],
    ['careers eyebrow', 'Careers'],
    ['a role', 'Senior Product Strategist'],
    ['a role location', 'Remote · Philadelphia'],
  ])('shows the frame’s %s', (_label, copy) => {
    expect(html).toContain(copy)
  })

  /**
   * The reason `personGridSection` is the highest-value of #56's four blocks:
   * 14 `person` documents came in with #17 and were rendered nowhere. These
   * names are dereferenced from the committed converted tree, not typed into
   * the page.
   */
  it('renders the migrated person documents the team band references', () => {
    expect(html).toContain('Mike Gadsby')
    expect(html).toContain('Christine Sheller')
    expect(html).toContain('Chief Experience Officer')
  })

  it('gives every role row its own Apply button', () => {
    expect(html.match(/>Apply</g) ?? []).toHaveLength(4)
  })

  /**
   * The band's three 394×390 images (`1924:5388`) and the Culture band's
   * group portrait (`1927:6432`) — the imagery #56 left behind when it
   * replaced the other approximations.
   *
   * Each beyond-band image rides **inside** its column's `richText` body
   * rather than as a sibling `figure` item. `layoutSection` puts one item per
   * grid cell, so three figures plus three passages would read image-image-
   * image / text-text-text at three columns and fall apart entirely at one.
   * `bodyText` already admits `figure`, so one item per column keeps each
   * image with its own caption at every width, with no schema change.
   */
  it.each([
    ['the 1682 mark', 'The 1682 conference wordmark on black'],
    ['the O3XO mark', 'The O3XO mark on black'],
    ['the community photo', 'twenty people in branded tees'],
    ['the Culture band portrait', 'gathered for a group portrait'],
  ])('draws %s from the frame', (_label, alt) => {
    expect(html).toContain(alt)
  })

  it('gives the page a single h1', () => {
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })
})

describe('the seeded Solutions page', () => {
  const html = solutions.html
  const sections = (aSeededPage('solutions').sections ?? []) as { _type: string }[]

  it('renders every section in the array — none silently dropped', () => {
    expect(html.match(/data-sanity=/g) ?? []).toHaveLength(sections.length)
  })

  it('replaces the two-column approximation with the orbital diagram', () => {
    expect(sections.map((s) => s._type)).toEqual([
      'heroSection',
      'disciplineGridSection',
      'railPanelsSection',
      'ctaSection',
    ])
    expect(html).toContain('data-testid="orbital-diagram"')
  })

  /**
   * Slot order is the array's, not the author's — apex first, then the base
   * ring. The frame puts Strategy at the apex and reads AI, Engineering,
   * Design around the base, so the seed carries them in that order.
   */
  it('places the four disciplines in the frame’s slot order', () => {
    const disciplines = (
      sections.find((s) => s._type === 'disciplineGridSection') as
        { disciplines?: { heading?: string }[] } | undefined
    )?.disciplines
    expect(disciplines?.map((d) => d.heading)).toEqual(['Strategy', 'AI', 'Engineering', 'Design'])
  })

  it.each([
    ['apex discipline', 'The root of every engagement'],
    ['engagement band heading', 'Three ways in.'],
    ['an engagement card', 'Embedded Team Member'],
    ['an engagement card’s one line', 'Senior hands, inside your team.'],
    ['an engagement card’s Best-when foot', 'Best when you trust the direction'],
  ])('shows the frame’s %s', (_label, copy) => {
    expect(html).toContain(copy)
  })

  /**
   * The band is Home's ways-to-work band (`1762:2168`) in the Solutions
   * frame's arrangement (`1925:6108`) — three ink cards, no rail, no media
   * square, no button. `layout` is what says so; the numerals, the 395px
   * media slot and the panel CTAs are all rail-layout elements, so their
   * absence is the assertion (#47).
   */
  it('draws the engagement band as cards, not the rail', () => {
    const band = sections.find((s) => s._type === 'railPanelsSection') as
      RailPanelsSection | undefined

    expect(band?.layout).toBe('cards')
    expect(band?.panels).toHaveLength(3)
    expect(band?.panels?.some((panel) => panel.cta ?? panel.media)).toBe(false)
    expect(html).not.toContain('rail-panel-eng-embedded')
  })

  /**
   * **Solutions has no 402 frame.** The "Solutions section" at `1924:4768` is
   * a generation-1 capture (1920 / 390, DOM-ish layer names), not the
   * breakpoint pair the ticket assumed — the Design Concept section holds one
   * Solutions frame and it is 1440. So every mobile composition on this page
   * is a renderer decision under ADR 0006, and these are the invariants that
   * keep it honest: nothing scrolls sideways, and the three-across card row
   * and the 1120px orbital diagram are both `lg:`.
   */
  it('is a stack at 402, with no frame to copy', () => {
    expect(unprefixedHorizontalScrollUtilities(html)).toEqual([])
    expect(variantsOf(html, 'grid-cols-3')).toEqual(['lg:grid-cols-3'])
    expect(html).toContain('data-testid="orbital-diagram"')
    expect(html).toContain('lg:block')
  })
})

describe('the seeded Live page', () => {
  const html = live.html
  const sections = (aSeededPage('live').sections ?? []) as { _type: string; layout?: string }[]

  it('renders every section in the array — none silently dropped', () => {
    expect(html.match(/data-sanity=/g) ?? []).toHaveLength(sections.length)
  })

  // The frame's band order (`1644:1889`): the ink-warm hero, the studio card
  // row, the appearances list, the ideas list, the CTA.
  it('follows the frame’s band sequence', () => {
    expect(sections.map((s) => s._type)).toEqual([
      'heroSection',
      'inFlightSection',
      'inFlightSection',
      'inFlightSection',
      'ctaSection',
    ])
  })

  // One block, two compositions — the studio band is cards, both lists rows.
  it('uses one block in two layouts rather than three blocks', () => {
    expect(sections.filter((s) => s._type === 'inFlightSection').map((s) => s.layout)).toEqual([
      'cards',
      'rows',
      'rows',
    ])
  })

  it.each([
    ['hero eyebrow', 'Live'],
    ['hero headline', 'What we’re working on.'],
    ['hero standfirst', 'the rooms we&#x27;ll be in'],
    ['studio heading', 'What’s being worked on right now.'],
    ['studio standfirst', 'not the polished case study'],
    ['a studio card kicker', 'Fintech · Onboarding'],
    ['a studio card title', 'Untangling a five-step signup nobody finishes'],
    ['appearances heading', 'Where to find us'],
    ['an appearance kicker', 'Workshop · Online'],
    ['an appearance title', 'Strategy in the age of AI'],
    ['ideas heading', 'Ideas we’re chasing before they reach you'],
    ['an idea title', 'Where AI earns its keep'],
    ['closing CTA', 'Let’s get started on your next big thing.'],
  ])('shows the frame’s %s', (_label, copy) => {
    expect(html).toContain(copy)
  })

  /**
   * The date is a `date` field, not two authored strings — the frame draws
   * "OCT" over "15" and the renderer derives both from `2026-10-15`. A seed
   * that stored the marker as copy would pass a weaker version of this.
   */
  it('derives the appearance marker from the date, in UTC', () => {
    expect(html).toContain('>Oct<')
    expect(html).toContain('>15<')
  })

  /**
   * The frame's rows end in an icon-only control, so its accessible name has
   * to come from the cta label — that is the label's whole job here (nothing
   * draws it).
   */
  it('names every row control from its cta label', () => {
    expect(html).toContain('aria-label="Details and registration"')
    expect(html).toContain('aria-label="Read the thinking"')
  })

  it('gives the page a single h1', () => {
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })
})

describe('the seeded Contact page', () => {
  const html = contact.html
  const sections = (aSeededPage('contact').sections ?? []) as { _type: string }[]

  it('renders every section in the array — none silently dropped', () => {
    expect(html.match(/data-sanity=/g) ?? []).toHaveLength(sections.length)
  })

  // No frame authored this order — it is the seed's own: hero, the ways to
  // reach the studio, the Handler pull quote.
  it('resolves to its three bands', () => {
    expect(sections.map((s) => s._type)).toEqual(['heroSection', 'layoutSection', 'quoteSection'])
  })

  it.each([
    ['hero headline', 'Let’s make exceptional experiences together.'],
    ['reach eyebrow', 'Get in touch'],
    ['the studio email', 'hello@o3world.com'],
    ['the studio phone', '(215) 592-4739'],
    ['the mailing address', 'Philadelphia, PA 19125'],
    ['the Handler portrait alt', 'Black and white photo of Justin Handler'],
    ['the Handler quote', 'complex business challenges'],
  ])('carries WordPress’s %s', (_label, copy) => {
    expect(html).toContain(copy)
  })

  // The form stand-in (#48): WordPress serves a Gravity Form here and the
  // schema has no form block, so a mailto CTA is the page's one conversion
  // path until a real form exists. If this assertion breaks because a form
  // block landed, delete it with joy.
  it('offers the mailto CTA standing in for the form', () => {
    expect(html).toContain('href="mailto:hello@o3world.com"')
  })

  it('gives the page a single h1', () => {
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })
})

describe('the seeded 1682 conference page', () => {
  const html = conference.html
  const sections = (aSeededPage('1682-conference-ai-innovation').sections ?? []) as {
    _type: string
  }[]

  it('renders every section in the array — none silently dropped', () => {
    expect(html.match(/data-sanity=/g) ?? []).toHaveLength(sections.length)
  })

  // WordPress's module order, carried: header, intro + mark + attend CTA, the
  // events list, the about-1682 panels, the recap video, the selected
  // perspectives, the page callout.
  it('resolves to WordPress’s band sequence', () => {
    expect(sections.map((s) => s._type)).toEqual([
      'heroSection',
      'layoutSection',
      'layoutSection',
      'railPanelsSection',
      'layoutSection',
      'perspectivesCarouselSection',
      'ctaSection',
    ])
  })

  it.each([
    ['hero eyebrow', '1682'],
    ['hero headline', 'The business of innovation conference'],
    ['the attend CTA', 'Attend the 1682 conference on October 8'],
    ['the events heading', 'Events'],
    ['the panels heading', 'Shaping the future of AI + innovation'],
    ['the perspectives heading', 'Expert insights driving impactful solutions'],
    ['the callout heading', 'Let’s explore your future in AI and innovation'],
  ])('carries WordPress’s %s', (_label, copy) => {
    expect(html).toContain(copy)
  })

  it('sends the attend CTA to the conference site, unfreshened', () => {
    expect(html).toContain('https://www.1682conference.com/')
  })

  it('gives the page a single h1', () => {
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })
})

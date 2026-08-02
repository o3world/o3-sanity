import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'

import { buildCatchAllRoute } from '@/lib/content-routes/build'
import { CATCH_ALL_TYPES } from '@/content/documents'
import { aSeededPage, renderRoute, siteSettings, withSettings } from '@/test'

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
    ['engagement rail', 'Three ways in.'],
  ])('shows the frame’s %s', (_label, copy) => {
    expect(html).toContain(copy)
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

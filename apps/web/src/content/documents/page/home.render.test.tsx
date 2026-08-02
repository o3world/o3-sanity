import { describe, expect, it } from 'vitest'

import { buildSingletonRoute } from '@/lib/content-routes/build'
import {
  aSeededPage,
  renderRoute,
  siteSettings,
  unprefixedHorizontalScrollUtilities,
  variantsOf,
  withSettings,
} from '@/test'

import { home } from './entry'

/**
 * The homepage seed (#20), rendered through the real singleton route and the
 * real block renderers, from the **committed** `data/seed/page/index.json`.
 *
 * This is the check that survives a rebuild. The dataset is disposable
 * (ADR 0003), so "it looked right in the browser once" proves nothing about
 * the next wipe-and-load; what has to hold is that the committed JSON — the
 * source of truth — renders the canonical Home frame through code nobody
 * wrote specially for it.
 *
 * The copy below was the **prototype's** until #42. Figma is the source of
 * record and outranks it (map #33), so these strings are now transcribed from
 * `1680:2134` — which is why several of them changed rather than the seed
 * being bent back to fit the test.
 */
const route = buildSingletonRoute(home)

const rendered = await renderRoute(route, {
  data: withSettings(aSeededPage('index'), siteSettings()),
})
const html = rendered.html

describe('the seeded homepage', () => {
  it('renders every section in the array — none silently dropped', () => {
    const sections = (aSeededPage('index').sections ?? []) as unknown[]
    expect(sections).toHaveLength(8)
    // The dispatcher wraps each block in a keyed div, so the count is the
    // honest measure of "did anything fail to dispatch".
    expect(html.match(/data-sanity=/g) ?? []).toHaveLength(sections.length)
  })

  it.each([
    ['hero', 'You see the problem in front of you.'],
    ['hero subheading', 'The same senior team that finds the move is the team that builds it.'],
    ['partners statement', 'where the stakes — and the org charts — are real'],
    ['case showcase heading', 'Most firms ship what you asked for'],
    ['a case study’s narrative headline', 'Families were navigating twelve portals'],
    ['quote', 'positioned our company as the leader and shaper'],
    ['platform rail', 'The platforms we go deep on'],
    ['platform standfirst', 'We don&#x27;t dabble across every tool'],
    ['engagement heading', 'Three ways in. You decide how much of the problem to give.'],
    ['engagement panel', 'Embedded Team Member'],
    ['engagement body', 'Best when you trust the direction and need the horsepower.'],
    ['perspectives carousel', 'The thinking behind the work.'],
    ['closing CTA', 'The best partnerships don’t have an end date.'],
    ['closing CTA body', 'We stay and build it. That&#x27;s the whole offer.'],
  ])('shows the frame’s %s', (_label, copy) => {
    expect(html).toContain(copy)
  })

  it('numbers the ways-to-work rail from array order, not authored strings', () => {
    // `rail: 'number'` on the second railPanelsSection (1762:2168) — the one
    // field that distinguishes it from the platforms band.
    expect(html).toContain('>01<')
    expect(html).toContain('>03<')
  })

  it('renders the client logos the logo wall references', () => {
    // Dereferenced from the committed client seeds, not inlined on the page.
    expect(html).toContain('AmeriGas')
    expect(html).toContain('La Colombe Coffee Roasters')
  })

  it('renders the headline stat each showcase card pulls from its case study', () => {
    expect(html).toContain('41%')
    expect(html).toContain('fewer missed appointments')
  })

  it('gives the page a single h1', () => {
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })

  it('derives its metadata from the seed like any other page', async () => {
    expect(rendered.metadata.title).toBe('O3 World')
    expect(rendered.metadata.alternates?.canonical).toBe('http://localhost:3000/')
  })
})

/**
 * The mobile frame, `1814:1618`. Desktop was verified when #42 was built and
 * 402 was not, which is how the perspectives carousel shipped scrolling
 * sideways on a phone for a whole batch. These are the invariants that would
 * have caught it — read off the rendered classes, so they hold for whatever
 * the blocks actually emit rather than for what a component file says.
 */
describe('the homepage at 402 (ADR 0006)', () => {
  it('has no horizontally-scrolling band', () => {
    // `lg:overflow-x-auto` — the desktop carousel — is fine and expected.
    // Anything unprefixed is live on a 402 phone.
    expect(unprefixedHorizontalScrollUtilities(html)).toEqual([])
  })

  it('keeps the perspectives carousel a stack until lg', () => {
    // `1814:1867`: cards stacked, gap 24, no prev/next. The track, its snap
    // points and the 394px card are all `lg:`.
    expect(html).toContain('lg:overflow-x-auto')
    expect(html).toContain('lg:w-[394px]')
    expect(variantsOf(html, 'snap-x')).toEqual(['lg:snap-x'])
  })

  it('stacks the partner logos rather than bleeding a marquee off a phone', () => {
    // `1814:1898` — one tile per row inside the gutter; `1864:2395`'s
    // over-wide row is the 1440 treatment.
    expect(html).toContain('lg:w-max')
    expect(html).toContain('lg:flex-row')
  })

  it('sets the hero flush to the gutter, centring it only at lg', () => {
    // `1814:1622` is a 362px column at x=20; `1810:1616` centres on the
    // sphere. Matched on the hero's own class attribute — `items-start` alone
    // is on half the cards on the page and would pass without the hero.
    const heroClasses = html.match(/class="([^"]*min-h-\[420px\][^"]*)"/)?.[1] ?? ''
    expect(heroClasses, 'the hero band was not found at all').not.toBe('')
    expect(heroClasses).toContain('items-start')
    expect(heroClasses).toContain('text-left')
    expect(heroClasses).toContain('lg:items-center')
    expect(heroClasses).toContain('lg:text-center')
  })

  it('holds the case-card gap at 24 until lg', () => {
    // 24 at 402 (`1889:3620`), 48 at 1440 (`1683:2661`).
    expect(variantsOf(html, 'gap-12')).toEqual(['lg:gap-12'])
  })

  it('carries the ways-to-work numbering into the row when the rail cannot', () => {
    // `PanelRail` is `hidden … lg:flex`, so at 402 the numeral has to come
    // from the row itself (`1814:1930`) or the panels lose their order.
    const numerals = html.match(/>01</g) ?? []
    expect(numerals.length).toBeGreaterThanOrEqual(2)
  })
})

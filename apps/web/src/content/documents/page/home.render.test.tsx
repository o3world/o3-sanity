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
    ['hero subheading', 'The senior team that finds the move is the team that builds it.'],
    ['partners statement', 'where the stakes — and the org charts — are real'],
    ['case showcase heading', 'Most firms can ship what you ask for'],
    ['a case study’s narrative headline', 'CMS was heading for end of life'],
    ['quote', 'positioned our company as the leader and shaper'],
    ['platform rail', 'The platforms we go deep on'],
    ['platform standfirst', 'We don&#x27;t dabble across every tool'],
    ['engagement heading', 'Three ways in. You decide how much of the problem to give.'],
    ['engagement panel', 'Embedded Team Member'],
    ['engagement body', 'Best when you trust the direction and need the horsepower.'],
    ['insights carousel', 'The thinking behind the work.'],
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

  /**
   * The three cards are the real translated case studies since ADR 0016 —
   * IRONMAN, Vertex and Caron, the three clients whose logos the frame's own
   * cards carry (`1883:3557`, `1883:3569`, `1883:3581`). Their copy is
   * WordPress's, not the frame's: `1683:2661` repeats one authored card three
   * times, so it is authoritative for which clients appear and for nothing it
   * says about them (ADR 0007).
   */
  it('renders the headline stat each showcase card pulls from its case study', () => {
    expect(html).toContain('75 days')
    expect(html).toContain('From start to delivery of the Pro-Series experience')
    expect(html).toContain('3X')
    expect(html).toContain('56%')
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
 * 402 was not, which is how the insights carousel shipped scrolling
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

  it('keeps the insights carousel a stack until lg', () => {
    // `1814:1867`: cards stacked, gap 24, no prev/next. The track, its snap
    // points and the 394px card are all `lg:`.
    expect(html).toContain('lg:overflow-x-auto')
    expect(html).toContain('lg:w-[394px]')
    expect(variantsOf(html, 'snap-x')).toEqual(['lg:snap-x'])
  })

  it('keeps the partner logos a two-across grid inside the gutter', () => {
    // The wall used to be a crawling row wider than the page — clipped at
    // both edges at 1440, and at 402 showing a logo and a half. It is a
    // 3 × 2 grid now, which is two across on a phone and never leaves the
    // gutter at any width.
    expect(html).toContain('lg:grid-cols-3')
    expect(html).not.toContain('animate-marquee')
    expect(html).not.toContain('lg:w-max')
  })

  it('renders the partner marks big and in their own colour', () => {
    // 96px at lg against the marquee tile's 68px, and no `grayscale` — the
    // wall's whole argument is that six marks can be looked at.
    const logo = html.match(/<img[^>]*class="[^"]*max-h-16[^"]*"[^>]*>/)?.[0] ?? ''
    expect(logo, 'no partner logo image was rendered').not.toBe('')
    expect(logo).toContain('lg:max-h-24')
    expect(logo).not.toContain('grayscale')
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

  it('sizes the three statements from the step its own frame reads', () => {
    /*
     * ADR 0006's amendment (2026-08-02). The 30px floor was read off
     * `1814:1684` — the PULL QUOTE — and applied to `--text-hero`, which three
     * bands share. The other two read 36 at 402: the hero headline
     * `1814:1624` (36/40) and the partners statement `1814:1894` (36/1.25).
     * All three are 64 at 1440, so the quote needs a second clamp; it cannot
     * be a second class on the same one.
     *
     * Asserted on each band's own class attribute, because `text-hero`
     * appearing anywhere in the document would pass while the quote still
     * dragged the floor down.
     */
    const heroHeadline = html.match(/<h1 class="([^"]*)"/)?.[1] ?? ''
    const statement = html.match(/class="([^"]*max-w-\[1026px\][^"]*)"/)?.[1] ?? ''
    const pullQuote = html.match(/<blockquote[^>]*>.*?<p class="([^"]*)"/s)?.[1] ?? ''

    expect(heroHeadline, 'the hero h1 was not found at all').not.toBe('')
    expect(statement, 'the partners statement was not found at all').not.toBe('')
    expect(pullQuote, 'the pull quote was not found at all').not.toBe('')

    // 36 at 402 → 64 at 1440.
    expect(heroHeadline).toContain('text-hero')
    expect(statement).toContain('text-hero')

    // 30 at 402 → 64 at 1440 — its own step, or the other two follow it down.
    expect(pullQuote).toContain('text-quote')
    expect(pullQuote).not.toContain('text-hero')
  })

  it('holds the case-card gap at 24 until lg', () => {
    // 24 at 402 (`1889:3620`), 48 at 1440 (`1683:2661`).
    //
    // Asserted as the band's own pair rather than "no unprefixed gap-12
    // anywhere": a492f7e re-read `1814:1738` and gave the Blog stack a 48px
    // ROW gap at 402, so `gap-12` is now legitimately unprefixed elsewhere on
    // this page and the document-wide probe stopped measuring this band.
    expect(html).toContain('gap-6 lg:gap-12')
    expect(variantsOf(html, 'gap-12')).toContain('lg:gap-12')
  })

  it('carries the ways-to-work numbering into the row when the rail cannot', () => {
    // `PanelRail` is `hidden … lg:flex`, so at 402 the numeral has to come
    // from the row itself (`1814:1930`) or the panels lose their order.
    const numerals = html.match(/>01</g) ?? []
    expect(numerals.length).toBeGreaterThanOrEqual(2)
  })
})

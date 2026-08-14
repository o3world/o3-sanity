import { describe, expect, it } from 'vitest'

import { buildSingletonRoute } from '@/lib/content-routes/build'
import {
  aSeededPage,
  bandPaths,
  renderRoute,
  siteSettings,
  subBlockPaths,
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
    // honest measure of "did anything fail to dispatch". A band path is a
    // bare `sections:<key>`; everything #107 added hangs below one.
    expect(bandPaths(html)).toHaveLength(sections.length)
  })

  /**
   * Sub-block attribution (#107) — the elements the canvas toolbar attaches
   * to. A toolbar whose surfaces are *section / header / item* needs three
   * attributed elements; before this the band was the only one, so every
   * surface collapsed onto it.
   *
   * Asserted as the complete list rather than a count, because the interesting
   * failures are silent ones: a path one segment wrong resolves to nothing in
   * Presentation and logs nothing (#104), and an over-eager attribution — a
   * header stamped on a band that has no header field — looks identical in
   * the HTML. Both show up here as a wrong string.
   */
  it('attributes each band’s header and every keyed item beneath it', () => {
    expect(subBlockPaths(html)).toEqual([
      'sections:platforms.heading',
      'sections:platforms.panels:plat-sanity',
      'sections:platforms.panels:plat-vercel',
      'sections:platforms.panels:plat-lovable',
      'sections:engagements.heading',
      'sections:engagements.panels:eng-embedded',
      'sections:engagements.panels:eng-squad',
      'sections:engagements.panels:eng-ownership',
      // The carousel's header row — heading plus its prev/next controls. Its
      // cards are `insight` documents rather than array items, so the band
      // stops at the header: there is no slot under this block to attribute.
      'sections:insights.heading',
    ])
  })

  it.each([
    ['hero', 'You see the problem in front of you.'],
    ['hero subheading', 'The senior team that finds the move is the team that builds it.'],
    ['partners heading', 'Trusted by organizations shaping what&#x27;s next.'],
    ['partners standfirst', 'From Fortune 500 enterprises to high-growth organizations'],
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

  it('renders the client logos the partners strip references', () => {
    // Dereferenced from the committed client seeds, not inlined on the page.
    // The six changed with the 2026-08 restructure (#89): AmeriGas and
    // Aramark left, Vertex and Hire Heroes USA arrived.
    expect(html).toContain('Vertex')
    expect(html).toContain('Hire Heroes USA')
    expect(html).toContain('La Colombe Coffee Roasters')
    expect(html).not.toContain('AmeriGas')
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
 * sideways on a phone for a whole batch — unnoticed, with no affordance. These
 * are the invariants that would have caught it, read off the rendered classes
 * so they hold for whatever the blocks actually emit rather than for what a
 * component file says.
 *
 * The carousel scrolls sideways at 402 again since ADR 0006's 2026-08-13
 * amendment (#90) — the difference is that the frame now draws the prev/next
 * controls there, so the scroll is announced. The guard below is exact rather
 * than empty for that reason.
 */
describe('the homepage at 402 (ADR 0006)', () => {
  it('scrolls sideways nowhere but the insights carousel', () => {
    // Since the 2026-08-13 amendment (#90) the carousel is a snap-scroller at
    // every width, so its own `overflow-x-auto` + `snap-x` are expected here.
    // The assertion is exact, not empty: a band that starts sizing itself
    // `w-max` or `w-screen`, or a second `overflow-scroll` region, still fails
    // — which is the 402 regression this was written for.
    expect(unprefixedHorizontalScrollUtilities(html)).toEqual(['overflow-x-auto', 'snap-x'])
  })

  it('gives the insights carousel one card per view until lg', () => {
    // `2204:1145` draws the controls at 402, so the track has to move there;
    // what stays `lg:` is the card measure — full column below, the frame's
    // 394.67px card at 1440 (`2134:1186`).
    expect(html).toContain('lg:w-[394px]')
    expect(variantsOf(html, 'overflow-x-auto')).toEqual(['overflow-x-auto'])
    expect(variantsOf(html, 'snap-x')).toEqual(['snap-x'])
  })

  it('wraps the partner strip instead of clipping it at 402', () => {
    // The strip is one row of six 280px plates at 1440 (`1864:2394`) — 1680px
    // wide, clipped by the viewport on purpose. At 402 that would show one
    // plate and a half, so it wraps: `flex-nowrap` is the thing that has to
    // carry the `lg:`. The clip itself must stay `overflow-hidden`; the moment
    // it becomes a scroll region the test above fails instead.
    expect(variantsOf(html, 'flex-nowrap')).toEqual(['lg:flex-nowrap'])
    expect(html).not.toContain('animate-marquee')
    expect(html).not.toContain('lg:w-max')
  })

  it('sizes the partner plates from each frame’s own read', () => {
    // 280 square at 1440; 168 at 402, which is the largest square that still
    // fits two inside a 362px column. The plates are what the restructure
    // added — before #89 the marks floated in a grid cell with no rule.
    const plate = html.match(/<li class="([^"]*lg:size-\[280px\][^"]*)"/)?.[1] ?? ''
    expect(plate, 'no partner plate was rendered').not.toBe('')
    expect(plate).toContain('size-[168px]')
    expect(plate).toContain('border-line')
  })

  it('desaturates the partner marks', () => {
    // Reversed by the redesign: every tile on `1864:2390` renders its
    // full-colour artwork grey.
    const logo = html.match(/<img[^>]*class="[^"]*grayscale[^"]*"[^>]*>/)?.[0] ?? ''
    expect(logo, 'no partner logo image was rendered').not.toBe('')
  })

  it('sets the hero flush to the gutter, centring it only at lg', () => {
    // `1814:1622` is a 362px column at x=20; `2089:4316` centres its column.
    // Matched on the hero's own class attribute — `items-start` alone is on
    // half the cards on the page and would pass without the hero.
    const heroClasses = html.match(/class="([^"]*pt-\[276px\][^"]*)"/)?.[1] ?? ''
    expect(heroClasses, 'the hero band was not found at all').not.toBe('')
    expect(heroClasses).toContain('items-start')
    expect(heroClasses).toContain('text-left')
    expect(heroClasses).toContain('lg:items-center')
    expect(heroClasses).toContain('lg:text-center')
  })

  it('gives the hero band each frame’s own vertical rhythm', () => {
    // 276 above / 353 below at 402 (`1814:1622` at y 276 in an 874 band);
    // 288 / 470 at 1440 (`2089:4313` at y 288 in an 1100 band). Read values
    // at both ends, so the band's height is the frames' rather than a
    // `min-h` someone picked.
    const heroClasses = html.match(/class="([^"]*pt-\[276px\][^"]*)"/)?.[1] ?? ''
    expect(heroClasses).toContain('pb-[353px]')
    expect(heroClasses).toContain('lg:pt-[288px]')
    expect(heroClasses).toContain('lg:pb-[470px]')
  })

  it('sizes the three statements from the step its own frame reads', () => {
    /*
     * ADR 0006's amendment (2026-08-02). The 30px floor was read off
     * `1814:1684` — the PULL QUOTE — and applied to `--text-hero`, which three
     * bands shared. Two of them read 36 at 402: the hero headline
     * `1814:1624` (36/40) and the partners statement `1814:1894` (36/1.25);
     * both were 64 at 1440, so the quote needed a second clamp.
     *
     * TWO SHARE IT NOW, NOT THREE. The 2026-08 restructure (#89) took the
     * partners band off the 64px step entirely: `1864:2393` is `Heading/h2`,
     * 48/58, which is `display-xl` — so the band that used to pull this clamp
     * around no longer touches it.
     *
     * Asserted on each band's own class attribute, because `text-hero`
     * appearing anywhere in the document would pass while the quote still
     * dragged the floor down.
     */
    const heroHeadline = html.match(/<h1 class="([^"]*)"/)?.[1] ?? ''
    const partnersHeading = html.match(/class="([^"]*max-w-\[1026px\][^"]*)"/)?.[1] ?? ''
    const pullQuote = html.match(/<blockquote[^>]*>.*?<p class="([^"]*)"/s)?.[1] ?? ''

    expect(heroHeadline, 'the hero h1 was not found at all').not.toBe('')
    expect(partnersHeading, 'the partners heading was not found at all').not.toBe('')
    expect(pullQuote, 'the pull quote was not found at all').not.toBe('')

    // 36 at 402 → 64 at 1440.
    expect(heroHeadline).toContain('text-hero')

    // 40 at 402 → 48 at 1440, Light — the workhorse section-headline step.
    expect(partnersHeading).toContain('text-display-xl')
    expect(partnersHeading).toContain('font-light')
    expect(partnersHeading).not.toContain('text-hero')

    // 30 at 402 → 64 at 1440 — its own step, or the hero follows it down.
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

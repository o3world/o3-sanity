import { describe, expect, it } from 'vitest'

import { buildSingletonRoute } from '@o3/content-runtime/routes'
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
   * The frame's band sequence (`2747:4486`'s parent `1680:2134`, and
   * `1814:1618` at 402 — both widths run the same order). The platforms band
   * comes before the quote, and the how-we-work track after it.
   */
  it('follows the frame’s band sequence', () => {
    const sections = (aSeededPage('index').sections ?? []) as { _type: string; _key: string }[]
    expect(sections.map((section) => section._key)).toEqual([
      'hero',
      'partners',
      'work',
      'platforms',
      'quote',
      'engagements',
      'insights',
      'cta',
    ])
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
    ['platform standfirst', 'certified depth in modern platforms that are scaling the internet'],
    ['engagement heading', 'How we work'],
    ['engagement panel', 'Embedded Team'],
    ['engagement note', 'Best when you trust the direction and need the horsepower.'],
    ['insights carousel', 'The thinking behind the work.'],
    ['closing CTA', 'Let’s get started on your next big thing.'],
    ['closing CTA body', 'If you’re ready, we’re ready.'],
  ])('shows the frame’s %s', (_label, copy) => {
    expect(html).toContain(copy)
  })

  it('numbers the how-we-work track from array order, not authored strings', () => {
    // Both visible columns on `2846:5480` read `.03` — the component's
    // default, overridden on neither instance. The band counts its own array
    // instead (#309).
    expect(html).toContain('>.01<')
    expect(html).toContain('>.02<')
    expect(html).toContain('>.03<')
  })

  /**
   * The quote band's decoration (`2748:4767`, `2748:4804` at 402): the
   * molecule at 10%, hung off the band's bottom-left corner. The two spheres
   * belong to the closer, which draws its own — see the last describe.
   */
  it('hangs the molecule behind the quote, not the spheres', () => {
    const sections = (aSeededPage('index').sections ?? []) as {
      _type: string
      decoration?: string
    }[]
    expect(sections.find((section) => section._type === 'quoteSection')?.decoration).toBe(
      'molecule',
    )
    // The mark's own viewBox. Home's closer draws `orbs`, so the glyph
    // appearing at all is this band's.
    expect(html).toContain('viewBox="0 0 699 699"')
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
  it('scrolls sideways only where a 402 frame draws a track', () => {
    // Two bands move sideways — the insights carousel (#90) and the
    // how-we-work track (`2975:8355`) — and both are Embla carousels now:
    // an `overflow-hidden` viewport, not a scroll region. So the honest
    // reading of ADR 0006's rule is that NO unprefixed scroll utility may
    // appear at all; a band that starts sizing itself `w-max` or `w-screen`,
    // or an `overflow-scroll` region, still fails — which is the 402
    // regression this was written for.
    expect(unprefixedHorizontalScrollUtilities(html)).toEqual([])

    // And the two carousels are really there — the guard above would also
    // pass on a page that lost them.
    expect(html.match(/aria-roledescription="carousel"/g) ?? []).toHaveLength(2)
  })

  it('gives the how-we-work track one column per view until lg', () => {
    // Matched on the band's OWN class attribute, not on the document: the
    // utilities probe above de-duplicates, so the carousel would answer for
    // this band and the assertion would pass with the track gone.
    const column = html.match(/<div[^>]*class="([^"]*lg:basis-\[42\.548%\][^"]*)"/)?.[1] ?? ''
    expect(column, 'no track column was rendered').not.toBe('')
    // The frame's 531 over its 1248 content column (`2846:5480`), held as a
    // fraction so every lg viewport keeps the framing; the full content
    // column at 402 — where the frame's own column overruns the gutter by its
    // right padding alone.
    expect(column).toContain('basis-full')
    // The hairline between columns is the one part that is `lg:` only: at 402
    // it falls outside the gutter, so it is drawn nowhere rather than at the
    // wrong place.
    expect(variantsOf(html, 'border-r')).toEqual(['lg:border-r'])
  })

  /**
   * The platforms rail at 402 (`2975:8193`): the same three stops, laid as a
   * tab row over the panels instead of a sticky column beside them. The
   * column measure is what carries the `lg:`, and the row must not scroll —
   * the three labels fit the 354px column.
   */
  it('lays the platforms rail as a tab row until lg', () => {
    expect(variantsOf(html, 'w-[82px]')).toEqual(['lg:w-[82px]'])
    expect(variantsOf(html, 'flex-col')).toContain('lg:flex-col')
    // The active stop is underlined in brand red at 402 and marked by the
    // 3 × 20 indicator at 1440 — two drawings of one state.
    expect(html).toContain('border-brand')
  })

  it('gives the insights carousel one card per view until sm', () => {
    // `2204:1145` draws the controls at 402, so the track has to move there;
    // what stays `sm:` is the card measure — full column below (the slide's
    // own `basis-full` default), the frame's 394.67px card from `sm` up so
    // the tablet range is not one viewport-wide square per view (`2134:1186`).
    expect(html).toContain('sm:basis-[394px]')
  })

  it('clips the partner strip at every width and crawls it instead of wrapping', () => {
    // The 1440 row clips symmetrically, and so does the 402 one: the frame's
    // `2975:8088` is the desktop row pasted at x −639, not a mobile treatment,
    // so there was never a second composition to read. The row used to wrap
    // below `lg` so a phone could see all six marks; the marquee does that at
    // both widths (Nick, 2026-08-25), which is why the wrap is gone rather
    // than sitting alongside it.
    //
    // Matched on the row's own class attribute, because the platforms tab row
    // (`PanelRail`) also wraps below `lg` and would answer for this one in a
    // document-wide probe.
    const row = html.match(/<ul[^>]*class="([^"]*ml-px[^"]*)"/)?.[1] ?? ''
    expect(row, 'the partner strip was not rendered').not.toBe('')
    expect(row).toContain('flex-nowrap')
    expect(row).not.toContain('flex-wrap')
    expect(row).toContain('animate-marquee')
    expect(row).toContain('motion-reduce:animate-none')
    // The track sizes itself off `shrink-0`, so the 402 probe above stays
    // exact: `w-max` at any width would fail it, prefixed or not.
    expect(row).toContain('shrink-0')
    expect(html).not.toContain('w-max')
  })

  it('sizes the partner plates from the 1440 row, stepping down with the wrap', () => {
    // 280 square with 64px of side padding at 1440 (`1864:2395`); the smaller
    // steps below `lg` follow the wrap, not a frame.
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

  it('centres the hero column at both widths', () => {
    // `1814:1622` sets `counterAxisAlignItems: CENTER` and every text node in
    // it is `textAlignHorizontal: CENTER`; `2089:4316` centres its column too.
    // Matched on the hero's own class attribute — `items-center` alone is on
    // half the cards on the page and would pass without the hero.
    const heroClasses = html.match(/class="([^"]*pb-\[247px\][^"]*)"/)?.[1] ?? ''
    expect(heroClasses, 'the hero band was not found at all').not.toBe('')
    expect(heroClasses).toContain('items-center')
    expect(heroClasses).toContain('text-center')
    expect(heroClasses).not.toContain('items-start')
    expect(heroClasses).not.toContain('text-left')
  })

  it('gives the hero band each frame’s own vertical rhythm', () => {
    // The foot is the frame's: 247 below at 402 (`1814:1622` in an 874 band),
    // 310 at 1440 (`2209:2223` ending at y 630 in a 940 band). The head is a
    // step under it — 160 / 256 — because #397 rules the frames' 173 / 288 too
    // deep by about a tenth. Both are on the 4px spacing scale.
    const heroClasses = html.match(/class="([^"]*pb-\[247px\][^"]*)"/)?.[1] ?? ''
    expect(heroClasses).toContain('pt-40')
    expect(heroClasses).toContain('lg:pt-64')
    expect(heroClasses).toContain('lg:pb-[310px]')
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

    // 48/58 Light at 1440 — the workhorse section-headline step — stepped down
    // to the 36/44 `2975:8086` reads at 402, which the token's 40px floor is a
    // width short of.
    expect(partnersHeading).toContain('text-display-xl')
    expect(partnersHeading).toContain('font-light')
    expect(partnersHeading).toContain('max-lg:text-[36px]')
    expect(partnersHeading).toContain('max-lg:leading-[44px]')
    expect(partnersHeading).not.toContain('text-hero')

    // 36 at 402 → 64 at 1440 (`2748:4839` / `2748:4715`). It carries the
    // hero's numbers on this brand but keeps its own name — see the token.
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

  it('holds the partners band to `2975:8083`’s own rhythm', () => {
    // 128 above and below at both widths, and 24 between the band's three
    // parts at 402 against the 1440 frame's 128. The text block's own 32 is
    // flat — `2975:8084` and `1864:2391` gap the same.
    const partners = html.match(/<section[^>]*class="([^"]*surface-wash-warm[^"]*)"/)?.[1] ?? ''
    expect(partners, 'the partners band was not found at all').not.toBe('')
    expect(partners).toContain('py-band-md')
    expect(partners).toContain('gap-6')
    expect(partners).toContain('lg:gap-band-md')
    expect(partners).not.toContain('pt-band-sm')
  })

  it('steps the closer’s standfirst down at 402', () => {
    // 18/22 at −0.8 tracking (`1814:1778`) against the 24px the 1440 band
    // draws — `text-lead`'s 20px floor is a step too big for it. The ink fade
    // that dissolves the sphere into the footer steps with it: 64 at 402
    // (`1928:6595`), 172 at 1440 (`1928:6596`).
    const closer = html.match(/<p class="([^"]*text-on-ink-subtle[^"]*)"/)?.[1] ?? ''
    expect(closer, 'the closer standfirst was not found at all').not.toBe('')
    expect(closer).toContain('max-lg:text-[18px]')
    expect(closer).toContain('max-lg:leading-[22px]')
    expect(html).toContain('h-16 lg:h-[172px]')
  })

  it('numbers each how-we-work column once, at both widths', () => {
    // The track's numeral sits inside the column, so it survives 402 without
    // a second copy — the shape the rail composition needed and this one does
    // not. Two would mean a hidden desktop numeral had come back.
    expect((html.match(/>\.01</g) ?? []).length).toBe(1)
  })
})

/**
 * THE CLOSER THE OTHERS WERE PASTED FROM (#163).
 *
 * Home's frame (`1680:2134`) draws the bespoke band `1680:2132` — the sphere
 * layer `1799:1470` plus the `1928:6596` ink fade that dissolves its lower
 * limb into the footer. It is why `orbs` is on the knob, and its seed pins the
 * value rather than reading the default.
 *
 * Five other frames now carry a copy of that band, raster and all; #303 read
 * the raster as this band pasted (not a photo), and #317 pinned `orbs` in
 * those pages' seeds accordingly.
 *
 * If Home's frame is ever redrawn to instance the `CTA` component, this is the
 * test that should fail.
 */
describe('the homepage closer', () => {
  it('still draws the sphere band, with the fade into the footer', () => {
    const sections = (aSeededPage('index').sections ?? []) as {
      _type: string
      decoration?: string
    }[]
    expect(sections.find((s) => s._type === 'ctaSection')?.decoration).toBe('orbs')
    expect(html).toContain('--gradient-ink-fade')
    // CtaSection's molecule, which this band must not also be drawing.
    expect(html).not.toContain('w-[54%]')
  })
})

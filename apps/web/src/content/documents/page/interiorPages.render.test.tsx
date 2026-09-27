import { ARTICLE_COLUMN, CONTENT_COLUMN, LAYOUT_COLUMN } from '@o3/content-ui/image-sizes'
import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'
import type { RailPanelsSection } from '@o3/sanity/types/generated'

import { buildCatchAllRoute } from '@o3/content-runtime/routes'
import { CATCH_ALL_TYPES } from '@/content/documents'
import {
  aSeededPage,
  bandPaths,
  declaredSizes,
  renderRoute,
  siteSettings,
  subBlockPaths,
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
 * Contact reads off `2960:7557` / `2975:10037` (#331), and its form posts to
 * `/api/contact` (#412). 1682 (#48) has no canonical frame at all
 * — its copy is WordPress's and its composition assembled from existing
 * blocks. #48's gate is "every top-level link resolves", so like Live, these
 * tests are the durable proof the two routes resolve to their bands.
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

// The service page's file name and its slug differ (`solutions-software-engineering`
// vs `solutions/software-engineering`), so it cannot go through `render()`.
const softwareEngineering = await renderRoute(route, {
  data: withSettings(aSeededPage('solutions-software-engineering'), siteSettings()),
  params: { segments: ['solutions', 'software-engineering'] },
})

describe('the seeded About page', () => {
  const html = about.html
  const sections = (aSeededPage('about').sections ?? []) as { _type: string }[]

  it('renders every section in the array — none silently dropped', () => {
    expect(bandPaths(html)).toHaveLength(sections.length)
  })

  /**
   * A picture declares the column it was placed in, not the widest column it
   * could have been placed in (#268). Every image on the page is a `mediaCard`
   * in the three-column beyond band, so each asks for (1728 − 80) / 3 ≈ 550 at
   * the cap — the full 1728 would buy too large a candidate for that box, and
   * the 822px article measure belongs to a detail page.
   */
  it('sizes a card’s picture to its layout column, not to the whole content column', () => {
    const slots = declaredSizes(html)
    expect(slots.filter((slot) => slot === LAYOUT_COLUMN[3])).toHaveLength(3)
    expect(slots).not.toContain(CONTENT_COLUMN)
    expect(slots).not.toContain(ARTICLE_COLUMN)
  })

  /**
   * Sub-block attribution (#107). The team band is the only place a
   * **reference** array is attributed: the path is the array item's, not the
   * person document's, because what an editor changes on a card is which
   * person the card shows. `_key` survives the dereference only because
   * `PAGE_QUERY` spreads the person into the item rather than replacing it.
   */
  it('attributes the team band’s header and one path per person card', () => {
    const team = sections.find((s) => s._type === 'personGridSection') as {
      people?: { _key: string }[]
    }
    expect(subBlockPaths(html).filter((path) => path.startsWith('sections:team.'))).toEqual([
      'sections:team.heading',
      ...(team.people ?? []).map((person) => `sections:team.people:${person._key}`),
    ])
  })

  /**
   * `layoutSection.items` is deliberately unattributed (#115). It is the one
   * polymorphic array at depth ≥ 2 in the repo, and the Presentation overlay
   * cannot attach a component inside it at `sanity@6.8.0` — **silently**
   * (#104: the resolver context comes back undefined and the resolver is
   * never called, with no console warning). About carries two of them, so
   * this is the page that proves nothing leaked in: a path under a column
   * would look correct in the HTML and do nothing on the canvas.
   */
  it('attributes nothing inside a layoutSection column', () => {
    expect(sections.filter((s) => s._type === 'layoutSection')).toHaveLength(2)
    expect(subBlockPaths(html).filter((path) => path.includes('.items'))).toEqual([])
  })

  // The frame's band order (`1924:5344`): hero, Why O3, the optimize-for
  // track, the team, the beyond-client-services row, Careers, CTA. The
  // Culture band went with the redesign (#308 ruling 4).
  it('follows the frame’s band sequence', () => {
    expect(sections.map((s) => s._type)).toEqual([
      'heroSection',
      'layoutSection',
      'railPanelsSection',
      'personGridSection',
      'layoutSection',
      'roleListSection',
      'ctaSection',
    ])
  })

  /**
   * The frame's own strings, sentence-cased where it shouts — the team band's
   * heading is `1927:6434` / `2975:9117` and its eyebrow `1924:5344`'s
   * "LEADERSHIP TEAM". "Quality over scale" is the one line here the frame
   * does not author: its third rail panel (`I2960:7035;2846:5581`) carries no
   * override, so the seed fills it in the O3 voice and says so in
   * `migration.provisionalNote`.
   */
  it.each([
    ['track heading', 'What we optimize for.'],
    ['track standfirst', 'One senior team that carries a problem'],
    ['a track panel', 'Quality over scale'],
    ['team eyebrow', 'Leadership team'],
    ['team heading', 'Meet the Team'],
    ['careers eyebrow', 'Careers'],
    ['a role', 'Senior Product Strategist'],
    ['a role location', 'Remote · Philadelphia'],
  ])('shows the About page’s %s', (_label, copy) => {
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
    // Two of the four person docs b117780's roster repoint newly emitted —
    // proof the converted tree carries them, not just the Feb-2025 fourteen.
    expect(html).toContain('Keith Scandone')
    expect(html).toContain('Director of Human Resources')
  })

  it('gives every role row its own Apply button', () => {
    expect(html.match(/>Apply</g) ?? []).toHaveLength(4)
  })

  /**
   * The band's three 395×391 pictures (`1924:5388`). Each is its column's
   * `mediaCard` — one item per grid cell, so the picture, the name, the line
   * and the link stay together at every column count.
   */
  it.each([
    ['the 1682 mark', 'The 1682 conference wordmark on black'],
    ['the O3XO mark', 'The O3XO mark on black'],
    ['the community photo', 'twenty people in 1682 conference tees'],
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
    expect(bandPaths(html)).toHaveLength(sections.length)
  })

  it('replaces the two-column approximation with the orbital diagram', () => {
    expect(sections.map((s) => s._type)).toEqual([
      'heroSection',
      'featureGridSection',
      'railPanelsSection',
      'ctaSection',
    ])
    expect(html).toContain('data-testid="orbital-diagram"')
  })

  /**
   * Position order is the array's, not the author's — apex first, then the
   * base ring. The frame puts Strategy at the apex and reads AI, Engineering,
   * Design around the base, so the seed carries them in that order.
   */
  it('places the four features in the frame’s position order', () => {
    const features = (
      sections.find((s) => s._type === 'featureGridSection') as
        { features?: { heading?: string }[] } | undefined
    )?.features
    expect(features?.map((f) => f.heading)).toEqual(['Strategy', 'AI', 'Engineering', 'Design'])
  })

  it.each([
    ['apex feature', 'The root of every engagement'],
    ['engagement band heading', 'Three ways in.'],
    ['an engagement card', 'Embedded Team Member'],
    ['an engagement card’s one line', 'Senior hands, inside your team.'],
    ['an engagement card’s Best-when foot', 'Best when you trust the direction'],
  ])('shows the frame’s %s', (_label, copy) => {
    expect(html).toContain(copy)
  })

  /**
   * The band is the same three engagements Home carries, in the Solutions
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
    expect(band?.panels?.some((panel) => panel.button ?? panel.media)).toBe(false)
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

describe('the seeded Software Engineering service page', () => {
  const html = softwareEngineering.html
  const sections = (aSeededPage('solutions-software-engineering').sections ?? []) as {
    _type: string
  }[]

  it('renders every section in the array — none silently dropped', () => {
    expect(bandPaths(html)).toHaveLength(sections.length)
  })

  // The frame's band order (`2360:2879`, #93): Interior Hero, the Overview
  // intro, the service grid, the proof-point band, the use cases, the CTA.
  // The frame is named "Solutions" in the file but draws a standalone page
  // under `/solutions/`, not the index.
  it("follows the frame's band sequence", () => {
    expect(sections.map((s) => s._type)).toEqual([
      'heroSection',
      'layoutSection',
      'railPanelsSection',
      'layoutSection',
      'featureGridSection',
      'ctaSection',
    ])
  })

  it.each([
    ['hero headline', 'Build for scale and performance.'],
    ['hero deck', 'architecting for performance, flexibility, and growth'],
    ['Overview intro', 'migrate legacy systems without breaking them'],
    ['a service column', 'Custom Development'],
    ['a service detail label', 'CRM integration'],
    ['a service detail', 'React, Next.js, TypeScript (with rendering strategies)'],
    ['proof-point heading', 'ship and disappear.'],
    ['proof-point body', 'replatform every couple of years'],
    ['use-cases band heading', 'Use cases.'],
    ['transcribed use case', 'stuck in a legacy CMS'],
    ['authored use case', 'one system of record'],
    ['CTA heading', 'Engineering that scales with your business.'],
  ])("shows the frame's %s", (_label, copy) => {
    expect(html).toContain(copy)
  })

  /**
   * The service band is `railPanelsSection` in its fourth arrangement
   * (`2358:2788`): three columns, each panel's details stacked under its
   * heading — no rail, no numerals, no media square, no button (#93).
   */
  it('draws the service band as the grid, not the rail', () => {
    const band = sections.find((s) => s._type === 'railPanelsSection') as
      RailPanelsSection | undefined

    expect(band?.layout).toBe('grid')
    expect(band?.panels).toHaveLength(3)
    expect(band?.panels?.every((panel) => (panel.details?.length ?? 0) >= 4)).toBe(true)
    expect(band?.panels?.some((panel) => panel.button ?? panel.media)).toBe(false)
  })

  /** The proof point retains its molecule; the current CTA uses its gradient. */
  it('hangs the current molecule in the hero and proof point', () => {
    const decorations = sections
      .filter((s) => s._type === 'layoutSection')
      .map((s) => (s as { decoration?: string }).decoration)
    expect(decorations).toEqual(['none', 'molecule'])
    expect(html.match(/viewBox="0 0 562 562"/g) ?? []).toHaveLength(2)
  })

  it('gives the page a single h1', () => {
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })

  /**
   * The frame (`2360:2879`) is 1440-only, so every mobile composition on
   * this page is a renderer decision under ADR 0006, and these are the
   * invariants that keep it honest: nothing scrolls sideways, and the
   * service columns begin at `lg:`.
   */
  it('is a stack at 402, with no frame to copy', () => {
    expect(unprefixedHorizontalScrollUtilities(html)).toEqual([])
    expect(variantsOf(html, 'grid-cols-[minmax(0,395fr)_minmax(0,821fr)]')).toEqual([
      'lg:grid-cols-[minmax(0,395fr)_minmax(0,821fr)]',
    ])
  })
})

describe('the seeded Live page', () => {
  const html = live.html
  const sections = (aSeededPage('live').sections ?? []) as { _type: string; layout?: string }[]

  it('renders every section in the array — none silently dropped', () => {
    expect(bandPaths(html)).toHaveLength(sections.length)
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
   * The ideas rows are lead-less. `1732:1416` holds one child — the kicker and
   * heading stack `1899:4281`, which takes the full 684 the row already
   * measured for two. Only the appearances band has a lead, and it is the
   * date column.
   */
  it('draws no mark beside an idea', () => {
    expect(html).not.toContain('w-[113px]')
    // The date lead survives on the appearances rows above it.
    expect(html).toContain('size-[9px]')
  })

  /**
   * The frame's rows end in an icon-only control, so its accessible name has
   * to come from the button label — that is the label's whole job here (nothing
   * draws it).
   */
  it('names every row control from its button label', () => {
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
    expect(bandPaths(html)).toHaveLength(sections.length)
  })

  // `2960:7792` pairs the introduction and form in one hero.
  it('resolves to one form hero with the supporting content retained', () => {
    expect(sections.map((s) => s._type)).toEqual(['formSection'])
    expect(sections[0]).toMatchObject({ variant: 'hero' })
  })

  it.each([
    ['hero headline', 'experiences together'],
    ['the visit kicker', 'Visit us'],
    ['the reach kicker', 'Reach us'],
    ['the studio email', 'hello@o3world.com'],
    ['the studio phone', '(215) 592-4739'],
    ['the mailing address', 'Philadelphia, PA 19125'],
    ['the Handler portrait alt', 'Black and white photo of Justin Handler'],
    ['the Handler quote', 'complex business challenges'],
  ])('folds %s into the form band', (_label, copy) => {
    expect(html).toContain(copy)
  })

  // A printed address is not a way to reach anyone from a phone, and these are
  // the two paths a reader who does not want to fill in the form has — which is
  // why they are links and not the flat text the frame draws.
  it('keeps the email and phone reachable, not printed', () => {
    expect(html).toContain('href="mailto:hello@o3world.com"')
    expect(html).toContain('href="tel:2155924739"')
  })

  it('gives the page a single h1', () => {
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })

  /**
   * The form band (#58).
   *
   * WordPress serves **Gravity Form 1** here. Its field set was recovered
   * from the live markup — the WP extract only ever captured
   * `{ acf_fc_layout: "form", form_id: "1" }`, never the fields — and this is
   * what it draws: two names at half width, email, a Reason dropdown, a
   * message, and a newsletter opt-in. A form that carried four of the six
   * would be a quieter regression than no form at all, so the set is
   * asserted whole.
   */
  describe('the inquiry form', () => {
    it.each([
      ['your name', 'field-name'],
      ['how’d you hear about us?', 'field-referral'],
      ['email', 'field-email'],
      ['reason', 'field-reason'],
      ['message', 'field-message'],
      ['the newsletter opt-in', 'field-consent'],
    ])('draws Gravity Form 1’s %s field', (_label, id) => {
      expect(html).toContain(`id="${id}"`)
    })

    it('gives every field a label pointing at its own control', () => {
      for (const field of ['name', 'referral', 'email', 'reason', 'message', 'consent']) {
        expect(html, `no label for ${field}`).toContain(`for="field-${field}"`)
      }
    })

    // The four required Figma fields retain both required indicators. The asterisk
    // is the sighted half and `aria-required` the other; a marker drawn
    // without its pair is decoration.
    it('marks all four required fields, in both halves', () => {
      expect(html.match(/aria-required="true"/g) ?? []).toHaveLength(4)
      expect(html.match(/\(required\)/g) ?? []).toHaveLength(4)
    })

    // The options are the editor's (`reasons`), not the renderer's — which is
    // where ADR 0014 draws the line between the field set and the words.
    it('carries the seed’s Reason options rather than a hard-coded list', () => {
      for (const reason of ['New business inquiry', 'Ventures request', 'Tech consultation']) {
        expect(html).toContain(reason)
      }
    })

    /**
     * **The wiring, asserted.** #412 gave the form a destination: it posts to
     * `/api/contact`, which validates and forwards to HubSpot. So the submit
     * is an ordinary enabled button and the "not connected" notice is gone —
     * a page that still said it cannot send would be lying.
     *
     * The honeypot is the half of the spam story server HTML can show. The
     * other half — three seconds between mount and submit — is client-side
     * and unit-tested in `inquiry.test.ts`.
     */
    it('offers a working submit rather than a disabled one', () => {
      expect(html).not.toContain('isn’t connected')
      // `disabled=""` / `aria-disabled="true"` — the rendered attribute forms;
      // a bare `\sdisabled` would also match the class string's `disabled:`
      // Tailwind variants.
      expect(html).not.toMatch(/<button[^>]*\saria-disabled="true"/)
      expect(html).not.toMatch(/<button[^>]*\sdisabled=""/)
    })

    /**
     * Before the page's JavaScript arrives, the browser resolves the submit on
     * its own. A form that names no method GETs the page it is on and writes
     * every field into the address bar — the message included. Naming the
     * method and the action posts it to the route instead.
     */
    it('names a method and an action, so a submit before hydration still posts', () => {
      const form = html.match(/<form[^>]*>/)?.[0]
      expect(form).toContain('method="post"')
      expect(form).toContain('action="/api/contact"')
    })

    it('carries a honeypot input nobody using the form can reach', () => {
      const honeypot = html.match(/<input[^>]*name="website"[^>]*>/)?.[0]
      expect(honeypot, 'no honeypot input').toBeTruthy()
      expect(honeypot).toContain('aria-hidden="true"')
      expect(honeypot).toContain('tabindex="-1"')
      expect(honeypot).toContain('left-[-9999px]')
    })

    it('still shows the submit’s words, so the intent stays legible', () => {
      expect(html).toContain('Send message')
    })

    // `3754:78225` stacks the fields on mobile; desktop pairs them.
    it('stacks fields on mobile, with nothing escaping sideways', () => {
      expect(unprefixedHorizontalScrollUtilities(html)).toEqual([])
      const variants = variantsOf(html, 'grid-cols-2')
      expect(variants).toContain('lg:grid-cols-2')
      expect(variants).not.toContain('grid-cols-2')
    })
  })
})

describe('the seeded 1682 conference page', () => {
  const html = conference.html
  const sections = (aSeededPage('1682-conference-ai-innovation').sections ?? []) as {
    _type: string
  }[]

  it('renders every section in the array — none silently dropped', () => {
    expect(bandPaths(html)).toHaveLength(sections.length)
  })

  // WordPress's module order, carried: header, intro + mark + attend CTA, the
  // events list, the about-1682 panels, the recap video, the selected
  // insights, the page callout.
  it('resolves to WordPress’s band sequence', () => {
    expect(sections.map((s) => s._type)).toEqual([
      'heroSection',
      'layoutSection',
      'layoutSection',
      'railPanelsSection',
      'layoutSection',
      'insightsCarouselSection',
      'ctaSection',
    ])
  })

  it.each([
    ['hero eyebrow', '1682'],
    ['hero headline', 'The business of innovation conference'],
    ['the attend CTA', 'Attend the 1682 conference on October 8'],
    ['the events heading', 'Events'],
    ['the panels heading', 'Shaping the future of AI + innovation'],
    ['the insights heading', 'Expert insights driving impactful solutions'],
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

/** The current Combined CTA + Footer replaces obsolete stored decorations. */
describe('the closing CTA band', () => {
  it.each([
    ['About', about.html],
    ['Solutions', solutions.html],
    ['Live', live.html],
    ['Software Engineering', softwareEngineering.html],
    ['1682', conference.html],
  ])('closes %s on the current gradient band', (_label, html) => {
    expect(html).toContain('cta-band')
    expect(html).not.toContain('cta-lag')
    expect(html).not.toContain('w-[54%]')
  })
})

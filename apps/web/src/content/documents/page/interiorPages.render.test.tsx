import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'
import type { RailPanelsSection } from '@o3/sanity/types/generated'

import { buildCatchAllRoute } from '@/lib/content-routes/build'
import { CATCH_ALL_TYPES } from '@/content/documents'
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
   * never called, with no console warning). About carries three of them, so
   * this is the page that proves nothing leaked in: a path under a column
   * would look correct in the HTML and do nothing on the canvas.
   */
  it('attributes nothing inside a layoutSection column', () => {
    expect(sections.filter((s) => s._type === 'layoutSection')).toHaveLength(3)
    expect(subBlockPaths(html).filter((path) => path.includes('.items'))).toEqual([])
  })

  // The frame's band order (`1924:5344`): hero, Why O3, the feature grid,
  // the team, Culture, the beyond-client-services row, Careers, CTA.
  it('follows the frame’s band sequence, with the team band restored', () => {
    expect(sections.map((s) => s._type)).toEqual([
      'heroSection',
      'layoutSection',
      'featureGridSection',
      'personGridSection',
      'layoutSection',
      'layoutSection',
      'roleListSection',
      'ctaSection',
    ])
  })

  it.each([
    ['feature-grid heading', '4 disciplines. One team.'],
    ['a feature body', 'before a line of code is written'],
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
    // Two of the four person docs b117780's roster repoint newly emitted —
    // proof the converted tree carries them, not just the Feb-2025 fourteen.
    expect(html).toContain('Keith Scandone')
    expect(html).toContain('Director of Human Resources')
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

  /**
   * The proof-point band (`2357:2690`) and the CTA (`2354:2640`) both hang
   * the molecule — the first through `layoutSection`'s decoration knob, the
   * second through `ctaSection`'s. Exactly two glyphs: the Overview band's
   * molecule is almost entirely cropped off-canvas in the frame and is
   * deliberately not drawn.
   */
  it('hangs the molecule behind the proof point and the CTA', () => {
    const decorations = sections
      .filter((s) => s._type === 'layoutSection')
      .map((s) => (s as { decoration?: string }).decoration)
    expect(decorations).toEqual(['none', 'molecule'])
    expect(html.match(/viewBox="0 0 699 699"/g) ?? []).toHaveLength(2)
  })

  it('gives the page a single h1', () => {
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })

  /**
   * The frame (`2360:2879`) is 1440-only, so every mobile composition on
   * this page is a renderer decision under ADR 0006, and these are the
   * invariants that keep it honest: nothing scrolls sideways, and the
   * three-across service grid is `lg:`.
   */
  it('is a stack at 402, with no frame to copy', () => {
    expect(unprefixedHorizontalScrollUtilities(html)).toEqual([])
    expect(variantsOf(html, 'grid-cols-3')).toEqual(['lg:grid-cols-3'])
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

  // No frame authored this order — it is the seed's own: hero, the inquiry
  // form (#58), the ways to reach the studio, the Handler pull quote.
  it('resolves to its four bands', () => {
    expect(sections.map((s) => s._type)).toEqual([
      'heroSection',
      'formSection',
      'layoutSection',
      'quoteSection',
    ])
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

  // The mailto CTA stood in for the form in #48 and still does — #58 built
  // the fields without a handler, so this remains the page's only WORKING
  // conversion path rather than a leftover.
  it('keeps the mailto CTA as the one path that actually reaches someone', () => {
    expect(html).toContain('href="mailto:hello@o3world.com"')
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
      ['first name', 'field-firstName'],
      ['last name', 'field-lastName'],
      ['email', 'field-email'],
      ['reason', 'field-reason'],
      ['message', 'field-message'],
      ['the newsletter opt-in', 'field-consent'],
    ])('draws Gravity Form 1’s %s field', (_label, id) => {
      expect(html).toContain(`id="${id}"`)
    })

    it('gives every field a label pointing at its own control', () => {
      for (const field of ['firstName', 'lastName', 'email', 'reason', 'message', 'consent']) {
        expect(html, `no label for ${field}`).toContain(`for="field-${field}"`)
      }
    })

    // All five are `gfield_contains_required` on the live form. The asterisk
    // is the sighted half and `aria-required` the other; a marker drawn
    // without its pair is decoration.
    it('marks all five required fields, in both halves', () => {
      expect(html.match(/aria-required="true"/g) ?? []).toHaveLength(5)
      expect(html.match(/\(required\)/g) ?? []).toHaveLength(5)
    })

    // The options are the editor's (`reasons`), not the renderer's — which is
    // where ADR 0014 draws the line between the field set and the words.
    it('carries the seed’s Reason options rather than a hard-coded list', () => {
      for (const reason of ['New business inquiry', 'Ventures request', 'Tech consultation']) {
        expect(html).toContain(reason)
      }
    })

    /**
     * **The stub, asserted.** #58 built the fields only; the mechanism and
     * the destination are still open. The one thing this page must never do
     * is look like it sends, so the button is `aria-disabled` (not native
     * `disabled` — it stays in the tab order so its description is announced)
     * and the reason sits on the page, wired to the button as its description.
     * The no-op itself is client-side (`onSubmit` preventDefault), which
     * server HTML can't show; what it can show is that no success state
     * exists to be reached.
     *
     * When #58's other halves land, this is the test that should fail.
     */
    it('disables submit and says why, rather than pretending to send', () => {
      expect(html).toContain('This form isn’t connected yet')
      // `disabled=""` / `aria-disabled="true"` — the rendered attribute forms;
      // a bare `\sdisabled` would also match the class string's `disabled:`
      // Tailwind variants.
      expect(html).toMatch(/<button[^>]*\saria-disabled="true"/)
      expect(html).not.toMatch(/<button[^>]*\sdisabled=""/)
      expect(html).toMatch(/<button[^>]*aria-describedby="form-not-connected"/)
      expect(html).toContain('id="form-not-connected"')
    })

    it('still shows the submit’s words, so the intent stays legible', () => {
      expect(html).toContain('Send message')
    })

    /**
     * ADR 0006 — no 402 frame exists for this page either, so the stack is a
     * renderer decision and the rule is only that nothing escapes sideways.
     *
     * `variantsOf` is page-wide, and the reach band below already emits
     * `md:grid-cols-2`, so this asserts the form's own variant is present and
     * that **no bare `grid-cols-2`** exists anywhere — an unprefixed one
     * would put two inputs side by side on a 402 phone.
     */
    it('is a stack at 402, the two names pairing only from sm', () => {
      expect(unprefixedHorizontalScrollUtilities(html)).toEqual([])
      const variants = variantsOf(html, 'grid-cols-2')
      expect(variants).toContain('sm:grid-cols-2')
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

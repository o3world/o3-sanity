import { z } from 'zod'

import type { FramerBand, FramerChrome, FramerLine, FramerPage } from '../lib/framerPage'
import { convertHtml, createKeyGenerator, type ConversionIssue } from '../lib/htmlToPortableText'
import { checkPathParity } from './paths'
import { seoObject, type SeoObject } from './seo'
import { failed, ok, type ExtractMeta, type Mapped } from './types'
import type { PersonDoc } from './person'

/**
 * o3xo.ai's marketing pages → `page` documents, and the chrome around them.
 *
 * This is the O3XO half of `map/page.ts`, and it inherits that mapper's one
 * rule: **migrate the pages whose value is their exact words.** All eleven
 * qualify here, because unlike o3 — whose services pages are an argument the
 * redesign is deliberately re-making — O3XO's pages are the live site and the
 * adaptation experiment is judged on them (#209).
 *
 * ## Bands are composed per page, not by a general rule
 *
 * A band arrives from `lib/framerPage.ts` as lines, links and images; nothing
 * in the markup says what kind of band it is. So each page has an arm below
 * that says which block each of its bands becomes, and every arm asserts the
 * band count and line count it expects. A page whose shape moved fails the run
 * rather than composing the wrong words into the right-looking block.
 *
 * The six industry pages are one arm, not six: they are one shape — hero, four
 * pain points, a two-phase process, a related-content widget — which is what
 * makes them worth a mapper at all.
 *
 * ## What does not migrate, and why
 *
 * Four things, each reported as a note on every run rather than dropped
 * silently, and each recorded on the document's provisional note. The team
 * bios were a fifth until `person.bio` landed (#247); they migrate now, as
 * does the label over the homepage's testimonial, which is the quote band's
 * `eyebrow`.
 *
 * - **The related-content band** on five industry pages. It curates one case
 *   study and one insight; the case studies are #219's documents, so a
 *   reference written here would be a dangling one. The new site derives
 *   related work, which is the same call WordPress's `project_feed` widget
 *   already got (README → the translate track).
 * - **The homepage's case-study showcase**, for the same reason and the same
 *   ticket. `caseShowcaseSection` renders only what the referenced documents
 *   say, so there is nothing to write here in the meantime.
 * - **Hero background photography.** Every section block now carries
 *   `backgroundMedia` (#239), so the field is no longer what is missing: the
 *   source is. Framer serves the hero's backdrop as a video layer — the kit
 *   draws it as one (`4406:6597`) — and `lib/framerPage.ts` records `<img>`
 *   elements only, so the opener's backdrop is not in the extract to migrate.
 */

/** An extract record as committed under the O3XO extract tree. */
export interface FramerPageRecord extends FramerPage {
  readonly _meta: ExtractMeta
}

export interface FramerPageMapOptions {
  /**
   * Every page slug this run extracted. When given, an internal destination
   * this mapper derives is checked against it, so a link to a page nobody
   * migrated stops the run instead of rendering a 404.
   */
  readonly pageSlugs?: readonly string[]
}

/**
 * `page-framer-<key>`. A Sanity `_id` may hold only `[a-zA-Z0-9._-]`, and page
 * slugs are multi-segment, so `industries/construction` keys as
 * `industries-construction` while the slug keeps the path the site serves.
 */
function idKey(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const framerPageDoc = z.object({
  _id: z.string().regex(/^page-framer-[a-z0-9-]+$/),
  _type: z.literal('page'),
  title: z.string().min(1),
  slug: z.object({ _type: z.literal('slug'), current: z.string().min(1) }),
  pageType: z.literal('standard'),
  sections: z.array(z.record(z.string(), z.unknown())).min(2),
  seo: seoObject.optional(),
  migration: z.object({
    locked: z.boolean(),
    sourceId: z.string(),
    provisional: z.boolean(),
    provisionalNote: z.string().min(1),
  }),
})

export type FramerPageDoc = z.infer<typeof framerPageDoc>

/** Keys are authored, readable and unique per document — never generated. */
function keyer() {
  const used = new Set<string>()
  return (name: string): string => {
    let key = name
    for (let n = 2; used.has(key); n++) key = `${name}-${n}`
    used.add(key)
    return key
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Plain lines → Portable Text, through the converter both sources share. */
function richTextBody(texts: readonly string[], notes: ConversionIssue[]): unknown[] {
  const issues: ConversionIssue[] = []
  const html = texts.map((text) => `<p>${escapeHtml(text)}</p>`).join('')
  return convertHtml(html, issues, createKeyGenerator(), notes) as unknown[]
}

type Pair = { readonly heading: string; readonly body: string }

/**
 * A band's item list. Framer authors every one of them the same way — a short
 * line, then the line under it — so the pairing is positional, and an odd
 * count means the band gained or lost a line and is reported rather than
 * silently truncated.
 */
function pairs(
  lines: readonly FramerLine[],
  from: number,
  issues: ConversionIssue[],
  where: string,
): Pair[] {
  const rest = lines.slice(from)
  if (rest.length === 0 || rest.length % 2 !== 0) {
    issues.push({
      element: where,
      detail: `expected an even number of item lines, got ${rest.length}`,
    })
    return []
  }
  const out: Pair[] = []
  for (let i = 0; i < rest.length; i += 2) {
    out.push({ heading: rest[i]!.text, body: rest[i + 1]!.text })
  }
  return out
}

function expectBands(
  bands: readonly FramerBand[],
  count: number,
  issues: ConversionIssue[],
): boolean {
  if (bands.length === count) return true
  issues.push({
    element: 'bands',
    detail: `expected ${count} bands on this page, got ${bands.length}`,
  })
  return false
}

function expectLines(
  band: FramerBand | undefined,
  count: number,
  issues: ConversionIssue[],
  where: string,
): boolean {
  if (band && band.lines.length === count) return true
  issues.push({
    element: where,
    detail: `expected ${count} lines, got ${band?.lines.length ?? 'no band'}`,
  })
  return false
}

/**
 * The opening band: the page's `<h1>` and the sentence under it.
 *
 * `variant: 'band'` on every page including the homepage. The orbital
 * composition is O3's sphere band, drawn from O3's frames; nothing on o3xo.ai
 * corresponds to it, and picking it here would be composing a design rather
 * than migrating a page. `decoration: 'none'` for the same reason, and
 * `surface: 'ink'` because o3xo.ai opens every page on a dark band.
 */
function hero(band: FramerBand, key: (name: string) => string): Record<string, unknown> {
  return {
    _type: 'heroSection',
    _key: key('hero'),
    variant: 'band',
    headlineLines: [band.lines[0]!.text],
    ...(band.lines[1] ? { subheading: band.lines[1].text } : {}),
    decoration: 'none',
    surface: 'ink',
  }
}

/**
 * A heading, a standfirst and a list of short claims → the cards layout.
 *
 * `railPanelsSection` rather than `featureGridSection` because these bands all
 * carry a standfirst and the feature grid has nowhere to put one. On the cards
 * layout the rail is not drawn, so `railLabel` and `heading` hold the same
 * words — which is what `data/seed/page/solutions.json` already does.
 */
function cardsBand(
  key: (name: string) => string,
  name: string,
  heading: string,
  intro: string | null,
  items: readonly Pair[],
  surface: string,
): Record<string, unknown> {
  return {
    _type: 'railPanelsSection',
    _key: key(name),
    surface,
    layout: 'cards',
    heading,
    ...(intro ? { intro } : {}),
    panels: items.map((item) => ({
      _type: 'panel',
      _key: key(idKey(item.heading).slice(0, 40)),
      railLabel: item.heading,
      heading: item.heading,
      body: item.body,
    })),
  }
}

/**
 * The two-phase engagement process, on every industry page and on Approach.
 *
 * Each phase is one panel and its three steps are that panel's `details` rows
 * — a labelled breakdown under the panel's body, which is exactly what the
 * rows layout draws. The phase's label and its heading arrive as the two
 * paragraphs of one text container, which is why `parts` exists.
 *
 * `rows` rather than `rail`, and it costs the phase's label: the rows layout
 * numbers its panels instead of labelling them, so "Educate → Explore" is
 * stored and not drawn. The rail layout would draw it and drop the six steps
 * instead, because `details` renders on rows and grid only — six paragraphs of
 * the source against two labels, so rows wins. Noted per page.
 */
function processBand(
  key: (name: string) => string,
  heading: string,
  intro: string | null,
  lines: readonly FramerLine[],
  surface: string,
  issues: ConversionIssue[],
  notes: ConversionIssue[],
): Record<string, unknown> | null {
  const starts = lines.flatMap((line, i) => (line.parts.length === 2 ? [i] : []))
  if (starts.length !== 2) {
    issues.push({
      element: 'process',
      detail: `expected 2 phases (a label and a heading in one container), found ${starts.length}`,
    })
    return null
  }
  const panels = starts.map((start, phase) => {
    const end = starts[phase + 1] ?? lines.length
    const [railLabel, phaseHeading] = lines[start]!.parts as [string, string]
    const steps = pairs(lines.slice(start, end), 2, issues, 'process steps')
    return {
      _type: 'panel',
      _key: key(idKey(railLabel).slice(0, 40)),
      railLabel,
      heading: phaseHeading,
      body: lines[start + 1]!.text,
      details: steps.map((step) => ({
        _type: 'detail',
        _key: key(idKey(step.heading).slice(0, 40)),
        label: step.heading,
        items: [step.body],
      })),
    }
  })
  notes.push({
    element: 'phase label',
    detail:
      `the rows layout numbers its panels, so the phase labels — ` +
      `${panels.map((panel) => `"${panel.railLabel}"`).join(', ')} — are stored and not drawn`,
  })
  return {
    _type: 'railPanelsSection',
    _key: key('process'),
    surface,
    layout: 'rows',
    heading,
    ...(intro ? { intro } : {}),
    panels,
  }
}

/**
 * The closing ask, which o3xo.ai keeps in its footer component rather than on
 * the page — the same three lines above the copyright on every page but
 * Contact.
 *
 * It becomes a band on each document because the shared model has no
 * site-wide closing band: `siteSettings` carries nav, footer links and legal
 * copy, and a CTA is a section. So the words repeat across ten documents, and
 * an editor who changes one changes one — which is the honest cost of the
 * shape, recorded here rather than discovered later.
 */
function closingAsk(
  chrome: FramerChrome,
  key: (name: string) => string,
): Record<string, unknown> | null {
  if (!chrome.cta) return null
  return {
    _type: 'ctaSection',
    _key: key('closer'),
    heading: chrome.cta.heading,
    body: chrome.cta.body,
    button: {
      _type: 'button',
      label: chrome.cta.button.label,
      ...(chrome.cta.button.href ? { href: chrome.cta.button.href } : {}),
    },
    decoration: 'none',
  }
}

/**
 * Where an industry card points.
 *
 * Derived from the card's own words rather than taken from the anchor, because
 * two of the six anchors on `/industries` are wrong on the live site today:
 * "Real estate" links to `/industries/technology`, and "Technology" links
 * nowhere. Both pages exist and both are in the sitemap, so this is source
 * cleanup rather than a conversion decision — and `pageSlugs` is what stops
 * the derivation from inventing a destination.
 */
function industryHref(
  name: string,
  band: FramerBand,
  options: FramerPageMapOptions,
  issues: ConversionIssue[],
  notes: ConversionIssue[],
): string | null {
  const slug = `industries/${idKey(name)}`
  if (options.pageSlugs && !options.pageSlugs.includes(slug)) {
    issues.push({
      element: 'industry link',
      detail: `"${name}" points at ${slug}, which nothing migrated`,
    })
    return null
  }
  const href = `/${slug}`
  const served = band.links.find((link) => link.label.startsWith(name))
  if (served && served.href !== href) {
    notes.push({
      element: 'corrected link',
      detail: `o3xo.ai links the "${name}" card to ${served.href}; it points at ${href} here`,
    })
  }
  return href
}

function industryCards(
  key: (name: string) => string,
  band: FramerBand,
  heading: string,
  intro: string | null,
  items: readonly Pair[],
  options: FramerPageMapOptions,
  issues: ConversionIssue[],
  notes: ConversionIssue[],
): Record<string, unknown> {
  /**
   * A band picture tagged with the band's OWN heading is behind the band, not
   * inside a card. `nearestLine` attributes a picture to the nearest text
   * above it, and a full-bleed backdrop's nearest text is the band's title —
   * which is exactly what distinguishes it from the per-industry pictures,
   * each of which lands on its card's name.
   *
   * The homepage band is the one that carries one (kit `4406:6755`, "AI
   * Expertise"); `/industries` draws its pictures on the cards instead, so
   * nothing there matches.
   */
  const backdrop = band.images.find((image) => image.near === heading)

  return {
    _type: 'railPanelsSection',
    _key: key('industries'),
    surface: 'ink',
    ...(backdrop
      ? {
          backgroundMedia: {
            _type: 'backgroundMedia',
            image: { _type: 'image', _srcUrl: backdrop.url },
            // No tint: the kit lays this band's copy straight onto the picture,
            // and the picture is O3XO's near-black starfield.
            tint: 'none',
          },
        }
      : {}),
    layout: 'rail',
    rail: 'label',
    heading,
    ...(intro ? { intro } : {}),
    panels: items.map((item) => {
      const href = industryHref(item.heading, band, options, issues, notes)
      // Framer leaves these pictures' alt empty, so the card they belong to is
      // read off which card they sit inside (`FramerImage.near`).
      const media = band.images.find((image) => image.near === item.heading)
      return {
        _type: 'panel',
        _key: key(idKey(item.heading).slice(0, 40)),
        railLabel: item.heading,
        heading: item.heading,
        body: item.body,
        // The card links with no visible label of its own — the whole card is
        // the anchor — so the button takes the industry's name, which is the
        // link's accessible name on the live site.
        ...(href ? { button: { _type: 'button', label: item.heading, href } } : {}),
        ...(media
          ? {
              media: {
                _type: 'figure',
                image: { _type: 'image', _srcUrl: media.url },
                // No alt on the source, and the card's own name is what a
                // reader of the picture would be told: it is the industry.
                alt: media.alt || item.heading,
              },
            }
          : {}),
      }
    }),
  }
}

/**
 * The four people the About page prints, in the order it prints them.
 *
 * The band runs heading, then one (name, role, biography) triple per person —
 * the same three lines the kit's People Cards draw (`4404:5726`).
 */
export function mapFramerPeople(src: FramerPageRecord): PersonDoc[] {
  const band = src.slug === 'about' ? src.bands[4] : undefined
  if (!band) return []
  const out: PersonDoc[] = []
  for (let i = 1; i + 2 < band.lines.length + 1; i += 3) {
    const name = band.lines[i]?.text
    const role = band.lines[i + 1]?.text
    if (!name || !role) break
    const bio = band.lines[i + 2]?.text
    const headshot = band.images.find((image) => image.alt.startsWith(name))
    out.push({
      _id: `person-framer-${idKey(name)}`,
      _type: 'person' as const,
      name,
      title: role,
      ...(bio ? { bio } : {}),
      ...(headshot ? { headshot: { _type: 'image' as const, _srcUrl: headshot.url } } : {}),
      migration: { locked: false, sourceId: `framer:person:${idKey(name)}` },
    })
  }
  return out
}

type Composition = {
  readonly sections: Record<string, unknown>[]
  readonly notes: ConversionIssue[]
}

function composeIndustry(
  src: FramerPageRecord,
  key: (name: string) => string,
  issues: ConversionIssue[],
  notes: ConversionIssue[],
): Record<string, unknown>[] {
  const [heroBand, painBand, processHeadingBand, processStepsBand, related] = src.bands
  if (!heroBand || !painBand || !processHeadingBand || !processStepsBand) {
    issues.push({
      element: 'bands',
      detail: `an industry page needs 4 bands, got ${src.bands.length}`,
    })
    return []
  }
  const sections = [hero(heroBand, key)]

  sections.push(
    cardsBand(
      key,
      'pain-points',
      painBand.lines[0]!.text,
      painBand.lines[1]!.text,
      pairs(painBand.lines, 2, issues, 'pain points'),
      'bone',
    ),
  )

  if (!expectLines(processHeadingBand, 2, issues, 'process heading')) return sections
  const process = processBand(
    key,
    processHeadingBand.lines[0]!.text,
    processHeadingBand.lines[1]!.text,
    processStepsBand.lines,
    'white',
    issues,
    notes,
  )
  if (process) sections.push(process)

  if (related) {
    notes.push({
      element: 'related content',
      detail:
        'dropped the "Related content" band: it curates one case study (#219’s documents) and ' +
        'one insight, and the new site derives related work',
    })
  }
  return sections
}

function composeIndustriesIndex(
  src: FramerPageRecord,
  key: (name: string) => string,
  options: FramerPageMapOptions,
  issues: ConversionIssue[],
  notes: ConversionIssue[],
): Record<string, unknown>[] {
  if (!expectBands(src.bands, 2, issues)) return []
  const [heroBand, grid] = src.bands as [FramerBand, FramerBand]
  return [
    hero(heroBand, key),
    industryCards(
      key,
      grid,
      grid.lines[0]!.text,
      null,
      pairs(grid.lines, 1, issues, 'industry cards'),
      options,
      issues,
      notes,
    ),
  ]
}

function composeHome(
  src: FramerPageRecord,
  key: (name: string) => string,
  options: FramerPageMapOptions,
  issues: ConversionIssue[],
  notes: ConversionIssue[],
): Record<string, unknown>[] {
  const bands = src.bands
  const [opener, partner, industries] = bands
  const showcase = bands.find((band) => band.lines[0]?.text === 'Impact in action')
  const testimonial = bands.find(
    (band) => band.lines[0]?.text === 'Trusted by leading organizations',
  )
  const insights = bands.find((band) => band.lines[0]?.text?.startsWith('Insights from'))
  const conference = bands.find(
    (band) => band.lines[0]?.text === 'Thought leaders in AI innovation',
  )
  if (!opener || !partner || !industries || !testimonial || !insights || !conference) {
    issues.push({ element: 'bands', detail: 'the homepage is missing a band this arm composes' })
    return []
  }
  if (!expectLines(opener, 9, issues, 'homepage opener')) return []

  const sections: Record<string, unknown>[] = [hero(opener, key)]

  // Three figures with their labels, under the line that introduces them.
  const stats = pairs(opener.lines, 3, issues, 'homepage metrics')
  sections.push({
    _type: 'layoutSection',
    _key: key('metrics'),
    surface: 'ink',
    columns: 1,
    eyebrow: opener.lines[2]!.text,
    items: [
      {
        _type: 'statGroup',
        _key: key('metrics-stats'),
        stats: stats.map((stat) => ({
          _type: 'stat',
          _key: key(idKey(stat.body).slice(0, 40)),
          value: stat.heading,
          label: stat.body,
        })),
      },
    ],
  })

  // The band carries two wordings of its standfirst, one per breakpoint. The
  // longer one is kept because it holds strictly more of the claim; the other
  // is noted rather than dropped silently.
  const intros = [partner.lines[1]!.text, partner.lines[2]!.text].sort(
    (a, b) => b.length - a.length,
  )
  notes.push({
    element: 'responsive copy',
    detail: `o3xo.ai serves a second, shorter standfirst on another breakpoint: "${intros[1]}"`,
  })
  sections.push(
    cardsBand(
      key,
      'partner',
      partner.lines[0]!.text,
      intros[0]!,
      pairs(partner.lines.slice(0, 11), 3, issues, 'homepage capabilities'),
      'bone',
    ),
  )
  notes.push({
    element: 'two destinations',
    detail:
      'dropped the line "Learn more about us or our approach" — it links to two pages and a ' +
      'band carries one button (both pages are in the nav)',
  })

  sections.push(
    industryCards(
      key,
      industries,
      industries.lines[0]!.text,
      industries.lines[1]!.text,
      pairs(industries.lines, 2, issues, 'homepage industries'),
      options,
      issues,
      notes,
    ),
  )

  if (showcase) {
    notes.push({
      element: 'case showcase',
      detail:
        'dropped the "Impact in action" band: it references three case studies, which are ' +
        '#219’s documents — `caseShowcaseSection` renders only what they say',
    })
  }

  sections.push({
    _type: 'quoteSection',
    _key: key('testimonial'),
    surface: 'bone',
    // The band's own label, which the kit draws as a pill above the quote
    // (`4414:8100`).
    eyebrow: testimonial.lines[0]!.text,
    quote: testimonial.lines[1]!.text,
    attribution: testimonial.lines[2]!.text,
    decoration: 'none',
  })

  // Left to fill itself. The band curates three articles on o3xo.ai; an empty
  // list self-fills with the most recent of the migrated collection, which stays
  // current without anyone maintaining it.
  notes.push({
    element: 'curated insights',
    detail:
      'the insights band curates three articles; the list is left empty so the band self-fills ' +
      'with the newest of the collection instead',
  })
  sections.push({
    _type: 'insightsCarouselSection',
    _key: key('insights'),
    surface: 'white',
    heading: insights.lines[0]!.text,
  })

  notes.push({
    element: 'cta eyebrow',
    detail: `dropped the label over the 1682 band: "${conference.lines[0]!.text}"`,
  })
  sections.push({
    _type: 'ctaSection',
    _key: key('conference'),
    heading: conference.lines[1]!.text,
    body: conference.lines[2]!.text,
    button: {
      _type: 'button',
      label: conference.lines[3]!.text,
      href: conference.links[0]?.href ?? 'https://www.1682conference.com/',
    },
    decoration: 'none',
  })

  return sections
}

function composeAbout(
  src: FramerPageRecord,
  key: (name: string) => string,
  issues: ConversionIssue[],
  notes: ConversionIssue[],
): Record<string, unknown>[] {
  if (!expectBands(src.bands, 5, issues)) return []
  const [heroBand, origin, why, principles, team] = src.bands as [
    FramerBand,
    FramerBand,
    FramerBand,
    FramerBand,
    FramerBand,
  ]
  const people = mapFramerPeople(src)

  return [
    hero(heroBand, key),
    {
      _type: 'layoutSection',
      _key: key('origin'),
      surface: 'white',
      columns: 1,
      heading: origin.lines[0]!.text,
      items: [
        {
          _type: 'richText',
          _key: key('origin-body'),
          body: richTextBody(
            origin.lines.slice(1).map((line) => line.text),
            notes,
          ),
        },
      ],
    },
    cardsBand(
      key,
      'why',
      why.lines[0]!.text,
      why.lines[1]!.text,
      pairs(why.lines, 2, issues, 'why o3xo'),
      'bone',
    ),
    cardsBand(
      key,
      'principles',
      principles.lines[0]!.text,
      principles.lines[1]!.text,
      pairs(principles.lines, 2, issues, 'principles'),
      'ink',
    ),
    {
      _type: 'personGridSection',
      _key: key('team'),
      surface: 'white',
      heading: team.lines[0]!.text,
      people: people.map((person) => ({
        _type: 'reference',
        _ref: person._id,
        _key: key(`ref-${idKey(person.name)}`),
      })),
    },
  ]
}

function composeApproach(
  src: FramerPageRecord,
  key: (name: string) => string,
  issues: ConversionIssue[],
  notes: ConversionIssue[],
): Record<string, unknown>[] {
  if (!expectBands(src.bands, 4, issues)) return []
  const [heroBand, processHeading, processSteps, faq] = src.bands as [
    FramerBand,
    FramerBand,
    FramerBand,
    FramerBand,
  ]
  const sections = [hero(heroBand, key)]
  const process = processBand(
    key,
    processHeading.lines[0]!.text,
    processHeading.lines[1]!.text,
    processSteps.lines,
    'white',
    issues,
    notes,
  )
  if (process) sections.push(process)

  const band = faqBand(faq, key, notes)
  if (band) sections.push(band)
  return sections
}

/**
 * The FAQ band (#248) — the kit draws it on a photograph (`4406:7288`), and
 * `faqSection` is on O3XO's half of the section roster.
 *
 * The questions are the band's own lines and the answers come from the page's
 * JavaScript, which the extract reads because the served HTML does not carry
 * them (`lib/framerAccordion.ts`). No answers means the module moved under that
 * parse: the band is dropped rather than published with the questions bare,
 * which is what #220 did for the whole band.
 */
function faqBand(
  band: FramerBand,
  key: (name: string) => string,
  notes: ConversionIssue[],
): Record<string, unknown> | null {
  const [heading, subheading] = band.lines as [FramerLine, FramerLine]
  if (!band.faq?.length) {
    notes.push({
      element: 'faq',
      detail:
        `dropped the "${heading.text}" band: its answers are not in the served HTML and no ` +
        'page module builds them either, so there is nothing to publish under the questions',
    })
    return null
  }

  // The band's backdrop, by the rule the industries band uses: a picture tagged
  // with the band's own heading is the band's, not an item's.
  const backdrop = band.images.find((image) => image.near === heading.text)
  notes.push({
    element: 'faq answers',
    detail:
      'the answers arrive as plain prose — `question.body` is text, so an answer that carries ' +
      'an inline link on the live site keeps its words and loses its destination',
  })

  return {
    _type: 'faqSection',
    _key: key('faq'),
    surface: 'ink',
    ...(backdrop
      ? {
          backgroundMedia: {
            _type: 'backgroundMedia',
            image: { _type: 'image', _srcUrl: backdrop.url },
            // No tint, for the reason the industries band declares none: the
            // picture is already O3XO's near-black starfield.
            tint: 'none',
          },
        }
      : {}),
    heading: heading.text,
    ...(subheading ? { subheading: subheading.text } : {}),
    questions: band.faq.map((row) => ({
      _type: 'question',
      _key: key(idKey(row.question).slice(0, 40)),
      heading: row.question,
      body: row.answer,
    })),
  }
}

function composeContact(
  src: FramerPageRecord,
  key: (name: string) => string,
  issues: ConversionIssue[],
): Record<string, unknown>[] {
  if (!expectBands(src.bands, 3, issues)) return []
  const [heroBand, routes, expect] = src.bands as [FramerBand, FramerBand, FramerBand]

  // "Schedule a strategy call — Discuss your AI goals…": the words before the
  // dash are the link the card carries, the words after it are the card's copy.
  const routeItems = pairs(routes.lines, 1, issues, 'contact routes')
  return [
    hero(heroBand, key),
    {
      _type: 'railPanelsSection',
      _key: key('routes'),
      surface: 'bone',
      layout: 'rail',
      rail: 'label',
      heading: routes.lines[0]!.text,
      panels: routeItems.map((item, i) => {
        const [label, body] = item.body.split(' — ')
        return {
          _type: 'panel',
          _key: key(idKey(item.heading).slice(0, 40)),
          railLabel: item.heading,
          heading: item.heading,
          body: body ?? item.body,
          ...(label && routes.links[i]
            ? { button: { _type: 'button', label, href: routes.links[i]!.href } }
            : {}),
        }
      }),
    },
    {
      _type: 'featureGridSection',
      _key: key('what-to-expect'),
      surface: 'white',
      layout: 'grid',
      decoration: 'none',
      heading: expect.lines[0]!.text,
      features: pairs(expect.lines, 1, issues, 'what to expect').map((item) => ({
        _type: 'feature',
        _key: key(idKey(item.heading).slice(0, 40)),
        heading: item.heading,
        body: item.body,
      })),
    },
  ]
}

function compose(
  src: FramerPageRecord,
  options: FramerPageMapOptions,
  issues: ConversionIssue[],
  notes: ConversionIssue[],
): Composition {
  const key = keyer()
  if (src.slug === 'index')
    return { sections: composeHome(src, key, options, issues, notes), notes }
  if (src.slug === 'industries') {
    return { sections: composeIndustriesIndex(src, key, options, issues, notes), notes }
  }
  if (src.slug.startsWith('industries/')) {
    return { sections: composeIndustry(src, key, issues, notes), notes }
  }
  if (src.slug === 'about') return { sections: composeAbout(src, key, issues, notes), notes }
  if (src.slug === 'about/approach') {
    return { sections: composeApproach(src, key, issues, notes), notes }
  }
  if (src.slug === 'contact') return { sections: composeContact(src, key, issues), notes }
  issues.push({
    element: 'composition',
    detail:
      `no composition for "${src.slug}". Every page is composed band by band here, so a new ` +
      'page on o3xo.ai needs an arm rather than a default that would guess at its blocks',
  })
  return { sections: [], notes }
}

/**
 * The meta description is the only SEO field these pages override; the
 * `<title>` they serve is the h1 plus ` | O3XO`, which the app's own title
 * template already composes. The canonical is never migrated — a
 * self-referential one pointing back at o3xo.ai would tell Google the new page
 * is a duplicate of the Framer one.
 */
function mapPageSeo(src: FramerPage['seo'], notes: ConversionIssue[]): SeoObject | undefined {
  const description = src.descriptionOverride.trim()
  if (!description) return undefined
  const seo: SeoObject = { description }
  if (!seoObject.safeParse(seo).success) {
    notes.push({
      element: 'seo',
      detail: `dropped an seo object that failed its gate: ${description}`,
    })
    return undefined
  }
  return seo
}

/**
 * One parsed o3xo.ai page → one `page` document, or the reasons it cannot be
 * one. Fail-loud like every mapper (ADR 0002).
 */
export function mapFramerPage(
  src: FramerPageRecord,
  options: FramerPageMapOptions = {},
): Mapped<FramerPageDoc> {
  const issues: ConversionIssue[] = []
  const notes: ConversionIssue[] = []

  const { sections } = compose(src, options, issues, notes)
  const closer = closingAsk(src.chrome, keyer())
  // Contact is the one page whose footer carries no ask, because it is the ask.
  if (closer && src.slug !== 'contact') sections.push({ ...closer, _key: 'closer' })

  const parity = checkPathParity(src.seo.canonicalRendered, src.path, 'o3xo.ai')
  if (parity) issues.push(parity)

  if (issues.length > 0) return failed(issues)

  const seo = mapPageSeo(src.seo, notes)
  const doc = {
    _id: `page-framer-${idKey(src.slug)}`,
    _type: 'page' as const,
    title: src.title,
    slug: { _type: 'slug' as const, current: src.slug },
    pageType: 'standard' as const,
    sections,
    ...(seo ? { seo } : {}),
    migration: {
      locked: false,
      sourceId: `framer:page:${src.slug}`,
      provisional: true,
      provisionalNote:
        'Migrated from o3xo.ai band by band into O3’s block roster (#220). Provisional because ' +
        'the composition is a translation rather than a design: the hero carries no background ' +
        'photograph, curated case-study and insight cards are left to be derived, and anything ' +
        'the source does not serve is absent rather than ' +
        'invented. Cleared when the adaptation delta is reviewed and the page is composed ' +
        'against O3XO’s own design.',
    },
  }

  const parsed = framerPageDoc.safeParse(doc)
  if (!parsed.success) {
    return failed(
      parsed.error.issues.map((issue) => ({
        element: issue.path.join('.'),
        detail: issue.message,
      })),
    )
  }
  // The constructed literal, not zod's output: `sections` is typed loosely in
  // the gate and parsing would widen the written JSON.
  return ok(doc, notes)
}

interface SettingsButton {
  readonly _type: 'button'
  readonly _key: string
  readonly label: string
  readonly href: string
  /** The `icon` knob, written only where the design draws no glyph. */
  readonly icon?: 'none'
}

/** One card in a dropdown panel: a link, and the two lines drawn around it. */
interface SettingsNavGroupItem {
  readonly _type: 'navGroupItem'
  readonly _key: string
  readonly button: SettingsButton
  readonly eyebrow?: string
  readonly excerpt?: string
}

/** A nav item that opens a panel instead of going anywhere. */
interface SettingsNavGroup {
  readonly _type: 'navGroup'
  readonly _key: string
  readonly label: string
  readonly items: readonly SettingsNavGroupItem[]
  readonly button: SettingsButton
}

/** The `siteSettings` singleton, as a document. */
export interface FramerSiteSettingsDoc {
  readonly _id: 'siteSettings'
  readonly _type: 'siteSettings'
  readonly title: string
  readonly utilityNavItems: readonly SettingsButton[]
  readonly navItems: readonly (SettingsButton | SettingsNavGroup)[]
  readonly primaryButton: SettingsButton
  readonly footerTagline: string
  readonly socialsLabel: string
  readonly socialLinks: readonly {
    readonly _type: 'socialLink'
    readonly _key: string
    readonly label: string
    readonly url: string
  }[]
  readonly legalLinks: readonly SettingsButton[]
  readonly legalName: string
  readonly copyrightNote?: string
  readonly migration: {
    readonly locked: boolean
    readonly sourceId: string
    readonly provisional: boolean
    readonly provisionalNote: string
  }
}

interface NavLink {
  readonly label: string
  readonly href: string
}

interface NavEntry extends NavLink {
  /** Present iff the item opens a panel — three of the four do. */
  readonly panel?: {
    /** The panel's cards, in the order the live grid fills. */
    readonly items: readonly (NavLink & { eyebrow?: string; excerpt: string })[]
    /** The row that closes the panel. */
    readonly more: NavLink
  }
}

/**
 * The nav o3xo.ai draws.
 *
 * The labels, the copy and the order are the live site's, read off the opened
 * panels on 2026-08-19 — Industries, Case studies and About render as triggers
 * with no `href` in the served HTML and fill their panels client-side, so the
 * SSR page carries three labels with nowhere to go and nothing under them.
 * The kit's `Navigation` (`4404:4146`) agrees on which three open: those are
 * the items it draws a caret beside, and Insights is the one it does not.
 *
 * A trigger's own `href` is still the section index from the sitemap, and it
 * lands on the panel's last row rather than on the trigger — a trigger that
 * also navigates is one control doing two jobs, and the design draws the row
 * for exactly this.
 *
 * Destinations are hrefs rather than references, the way every other link this
 * mapper writes is: the source is a URL, and resolving it to a document id
 * here would be inventing a certainty the extract does not carry.
 */
const NAV: readonly NavEntry[] = [
  {
    label: 'Industries',
    href: '/industries',
    panel: {
      items: [
        {
          label: 'Construction',
          href: '/industries/construction',
          excerpt: 'Project lifecycle automation',
        },
        {
          label: 'Industrial services',
          href: '/industries/industrial-services',
          excerpt: 'Operational efficiency',
        },
        {
          label: 'Life sciences',
          href: '/industries/life-sciences',
          excerpt: 'Research to revenue',
        },
        {
          label: 'Real estate',
          href: '/industries/real-estate',
          excerpt: 'Lead gen + property mgmt optimization',
        },
        {
          label: 'Finance + insurance',
          href: '/industries/finance-insurance',
          excerpt: 'Underwriting + advisory amplification',
        },
        {
          label: 'Technology',
          href: '/industries/technology',
          excerpt: 'Competitive advantage',
        },
      ],
      more: { label: 'View all industries', href: '/industries' },
    },
  },
  {
    label: 'Case studies',
    href: '/case-studies',
    panel: {
      items: [
        {
          label: 'Buffalo Construction',
          href: '/case-studies/buffalo-construction',
          eyebrow: 'Construction',
          excerpt: 'AI-powered construction operations',
        },
        {
          label: 'Tyndale',
          href: '/case-studies/tyndale',
          eyebrow: 'Industrial services',
          excerpt: 'AI-driven product insight',
        },
        {
          label: 'Healthcare tech leader',
          href: '/case-studies/healthcare-tech-leader',
          eyebrow: 'Life sciences',
          excerpt: 'AI strategy acceleration',
        },
        {
          label: 'e-Hazard',
          href: '/case-studies/e-hazard',
          eyebrow: 'Industrial services',
          excerpt: 'Certificate automation magic',
        },
        {
          label: 'Global tech firm',
          href: '/case-studies/global-tech-firm',
          eyebrow: 'Technology',
          excerpt: 'RFP automation',
        },
        {
          label: 'Fortune 500 insurance provider',
          href: '/case-studies/fortune-500-insurance-provider',
          eyebrow: 'Finance + insurance',
          excerpt: 'Legal document intelligence',
        },
      ],
      more: { label: 'View all case studies', href: '/case-studies' },
    },
  },
  { label: 'Insights', href: '/insights' },
  {
    label: 'About',
    href: '/about',
    panel: {
      items: [
        {
          label: 'Our story + mission',
          href: '/about',
          eyebrow: 'About O3XO',
          excerpt:
            '20+ years of digital transformation expertise applied to AI strategy and execution',
        },
        {
          label: 'Strategy to activation',
          href: '/about/approach',
          eyebrow: 'Our approach',
          excerpt: 'Our proven methodology from AI roadmap to measurable results',
        },
      ],
      more: { label: 'Talk with our team', href: '/contact' },
    },
  },
]

/** The bar's own button, drawn filled at the end of the row (`4404:4036`). */
const NAV_BUTTON: NavLink = { label: 'Contact', href: '/contact' }

/**
 * o3xo.ai's chrome → the `siteSettings` singleton, replacing the hand-seeded
 * bootstrap #215 wrote and #217 recorded as owing three facts: the legal name,
 * the privacy link and the LinkedIn account. All three are here.
 *
 * It is not held to `siteSettingsDoc`, which describes the **WordPress chrome
 * extract** — nav menus plus an ACF options page. o3xo.ai has neither, and the
 * field it genuinely does not carry (a default OG image) stays absent rather
 * than being filled in with something plausible.
 *
 * **No `footerGroups`.** The kit's `Footer` (`4404:4148`) draws no link
 * columns: one row of properties and the legal link, both of which
 * `utilityNavItems` and `legalLinks` already carry. The single "Site" column
 * the bootstrap wrote existed to fill the shared footer's three-column shape,
 * and o3xo's chrome no longer has one.
 */
export function mapFramerSiteSettings(chrome: FramerChrome): FramerSiteSettingsDoc {
  const button = (prefix: string, link: NavLink): SettingsButton => ({
    _type: 'button',
    _key: `${prefix}-${idKey(link.label)}`,
    label: link.label,
    href: link.href,
  })
  const navItem = (entry: NavEntry): SettingsButton | SettingsNavGroup => {
    if (!entry.panel) return button('nav', entry)
    return {
      _type: 'navGroup',
      _key: `nav-${idKey(entry.label)}`,
      label: entry.label,
      items: entry.panel.items.map((item) => ({
        _type: 'navGroupItem',
        _key: `nav-${idKey(entry.label)}-${idKey(item.label)}`,
        button: button('link', item),
        ...(item.eyebrow ? { eyebrow: item.eyebrow } : {}),
        excerpt: item.excerpt,
      })),
      button: button('more', entry.panel.more),
    }
  }
  return {
    _id: 'siteSettings',
    _type: 'siteSettings',
    title: chrome.title,
    utilityNavItems: chrome.footerLinks.map((link) => button('utility', link)),
    navItems: NAV.map(navItem),
    // No glyph: `4404:4036` is a label alone, where the panel's closing row
    // (`View all industries →`) keeps the arrow the default writes.
    primaryButton: { ...button('nav', NAV_BUTTON), icon: 'none' },
    footerTagline: chrome.footerTagline,
    socialsLabel: 'Socials',
    socialLinks: chrome.socialLinks.map((social) => ({
      _type: 'socialLink',
      _key: `social-${idKey(social.label)}`,
      label: social.label,
      url: social.url,
    })),
    legalLinks: chrome.legalLinks.map((link) => button('legal', link)),
    legalName: chrome.legalName,
    ...(chrome.copyrightNote ? { copyrightNote: chrome.copyrightNote } : {}),
    migration: {
      locked: false,
      sourceId: 'framer:siteSettings',
      provisional: true,
      provisionalNote:
        'Extracted from o3xo.ai’s footer and its Organization ld+json (#220), then authored ' +
        'against O3XO’s own chrome (#243): the three dropdown panels carry the copy the live ' +
        'nav opens, and Contact is the bar’s button. Destinations are the sitemap’s URLs rather ' +
        'than references. Still provisional for the one fact nothing serves: o3xo.ai declares ' +
        'no site-wide OG image, so there is no default SEO.',
    },
  }
}

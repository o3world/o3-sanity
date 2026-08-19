import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { SECTION_BLOCKS } from '@o3/sanity/schemas/registry'

import { dataRoot } from '../lib/paths'
import { mapFramerPage, mapFramerPeople, mapFramerSiteSettings } from './framerPage'
import type { FramerPageRecord } from './framerPage'

/**
 * The O3XO page mapper, checked against the extract the pipeline actually
 * committed rather than a fixture.
 *
 * A fixture would prove the composition rules and nothing else; what these
 * pages need proving is that the rules still fit the real bands, because the
 * bands come out of a parse of a site that can be republished at any time. The
 * extract is committed, so this is a unit test with a real input — and when
 * o3xo.ai moves, the re-extract's diff and this file fail together.
 */
const ROOT = dataRoot('o3xo')

function record(slug: string): FramerPageRecord {
  const file = join(ROOT, 'extract', 'page', `${slug.replaceAll('/', '-')}.json`)
  if (!existsSync(file))
    throw new Error(`no committed extract for ${slug} — run extract --pages all`)
  return JSON.parse(readFileSync(file, 'utf8')) as FramerPageRecord
}

function mapped(slug: string) {
  const result = mapFramerPage(record(slug))
  if (!result.ok) throw new Error(`${slug} did not map: ${JSON.stringify(result.issues)}`)
  return result
}

const INDUSTRY_SLUGS = [
  'industries/construction',
  'industries/technology',
  'industries/industrial-services',
  'industries/life-sciences',
  'industries/real-estate',
  'industries/finance-insurance',
]

const ALL_SLUGS = ['index', 'about', 'about/approach', 'contact', 'industries', ...INDUSTRY_SLUGS]

describe('mapFramerPage', () => {
  it('maps every page the sitemap lists, with no page left uncomposed', () => {
    for (const slug of ALL_SLUGS) {
      const result = mapFramerPage(record(slug))
      expect(result.ok, `${slug}: ${JSON.stringify(result.ok ? [] : result.issues)}`).toBe(true)
    }
  })

  /**
   * Deterministic ids naming the source, so `load` can retire what it wrote
   * (ADR 0003). A multi-segment slug reduces to what a Sanity `_id` may hold.
   */
  it('gives each page an id naming o3xo.ai and its slug', () => {
    expect(mapped('industries/construction').doc._id).toBe('page-framer-industries-construction')
    expect(mapped('index').doc._id).toBe('page-framer-index')
  })

  it('keeps the multi-segment slug the live site serves', () => {
    expect(mapped('industries/construction').doc.slug.current).toBe('industries/construction')
    expect(mapped('about/approach').doc.slug.current).toBe('about/approach')
    expect(mapped('index').doc.slug.current).toBe('index')
  })

  it('composes only registered section blocks', () => {
    for (const slug of ALL_SLUGS) {
      for (const section of mapped(slug).doc.sections) {
        expect(SECTION_BLOCKS as readonly string[], slug).toContain(section._type as string)
      }
    }
  })

  it('opens every page with the hero its h1 and deck are', () => {
    for (const slug of ALL_SLUGS) {
      const [hero] = mapped(slug).doc.sections
      expect(hero?._type, slug).toBe('heroSection')
      expect((hero as { headlineLines: string[] }).headlineLines[0], slug).toBe(
        mapped(slug).doc.title,
      )
    }
  })

  /**
   * The six industry pages are one shape, which is what makes them one mapper
   * arm rather than six hand-compositions.
   */
  it('gives all six industry pages the same band sequence', () => {
    const shapes = INDUSTRY_SLUGS.map((slug) =>
      mapped(slug).doc.sections.map((section) => section._type),
    )
    for (const shape of shapes) expect(shape).toEqual(shapes[0])
    expect(shapes[0]).toEqual([
      'heroSection',
      'railPanelsSection',
      'railPanelsSection',
      'ctaSection',
    ])
  })

  it('turns an industry page’s pain points into one panel each, copy intact', () => {
    const [, painPoints] = mapped('industries/construction').doc.sections as [
      unknown,
      { heading: string; intro: string; panels: { railLabel: string; body: string }[] },
    ]
    expect(painPoints.heading).toBe('Stop losing money on every project')
    expect(painPoints.intro).toBe(
      'AI can solve these persistent pain points and help you deliver more consistent results.',
    )
    expect(painPoints.panels).toHaveLength(4)
    expect(painPoints.panels[0]!.railLabel).toBe('Time-intensive estimation processes')
    expect(painPoints.panels[0]!.body).toMatch(/^Your estimating team spends weeks/)
  })

  /**
   * The process band is two phases of three steps. A phase is a panel and its
   * steps are that panel's `details` rows — the shape the rows layout already
   * draws, so nothing had to be invented for it.
   */
  it('turns the two-phase process into two panels of three steps', () => {
    const process = mapped('industries/construction').doc.sections[2] as {
      layout: string
      heading: string
      panels: {
        railLabel: string
        heading: string
        body: string
        details: { label: string; items: string[] }[]
      }[]
    }
    expect(process.layout).toBe('rows')
    expect(process.heading).toBe('From strategy to profitable delivery')
    expect(process.panels).toHaveLength(2)
    expect(process.panels[0]!.railLabel).toBe('Educate → Explore')
    expect(process.panels[0]!.heading).toBe('AI strategy process for construction')
    expect(process.panels[0]!.details.map((d) => d.label)).toEqual([
      'Educate + Align',
      'Evaluate + Plan',
      'Launch + Learn',
    ])
    expect(process.panels[1]!.railLabel).toBe('Execute → Adopt')
  })

  /**
   * "Related content" curates one case study and one insight per page. The
   * case studies are another ticket's documents, so referencing them here
   * would commit a dangling reference; and the new site derives related work,
   * which is the same call the WordPress `project_feed` widget already got.
   */
  it('drops the related-content band and says so', () => {
    const notes = mapped('industries/construction').notes ?? []
    expect(notes.map((note) => note.element)).toContain('related content')
  })

  it('closes every page but Contact with the ask o3xo.ai keeps in its footer', () => {
    for (const slug of ALL_SLUGS.filter((s) => s !== 'contact')) {
      const sections = mapped(slug).doc.sections
      const last = sections[sections.length - 1] as { _type: string; heading: string }
      expect(last._type, slug).toBe('ctaSection')
      expect(last.heading, slug).toBe('Stop guessing, start discovering')
    }
    const contact = mapped('contact').doc.sections
    expect(contact[contact.length - 1]!._type).not.toBe('ctaSection')
  })

  it('links each industry from the index, using the site’s own words', () => {
    const band = mapped('industries').doc.sections[1] as {
      panels: { railLabel: string; button?: { href: string } }[]
    }
    expect(band.panels).toHaveLength(6)
    expect(band.panels[0]!.railLabel).toBe('Construction')
    expect(band.panels[0]!.button?.href).toBe('/industries/construction')
  })

  /**
   * The homepage's stats are a real claim with a real figure, so they migrate
   * as stats rather than as prose.
   */
  it('keeps the homepage’s three metrics as a stat group', () => {
    const band = mapped('index').doc.sections[1] as {
      items: { _type: string; stats: { value: string; label: string }[] }[]
    }
    expect(band.items[0]!._type).toBe('statGroup')
    expect(band.items[0]!.stats.map((s) => s.value)).toEqual(['50%+', '10x', '<90 days'])
  })

  it('keeps the homepage’s testimonial as a quote with its attribution', () => {
    const quote = mapped('index').doc.sections.find((s) => s._type === 'quoteSection') as {
      quote: string
      attribution: string
    }
    expect(quote.quote).toMatch(/^["“]I was expecting the ROI/)
    expect(quote.attribution).toBe('Brett Norton, President, Buffalo Construction, Inc')
  })

  /** The label the kit draws as the band's pill (`4414:8100`). */
  it('keeps the label over the testimonial as the band’s eyebrow', () => {
    const quote = mapped('index').doc.sections.find((s) => s._type === 'quoteSection') as {
      eyebrow: string
    }
    expect(quote.eyebrow).toBe('Trusted by leading organizations')
  })

  /**
   * Eight questions and eight DIFFERENT answers (#248). The served HTML carries
   * one answer for all eight — Framer draws every row closed and the one
   * paragraph in the markup is the component's own default — so the extract
   * reads them out of the page's JavaScript instead
   * (`lib/framerAccordion.ts`). Publishing the same paragraph eight times is
   * the failure this asserts against.
   */
  it('carries the approach page’s FAQ, one answer per question', () => {
    const faq = mapped('about/approach').doc.sections.find(
      (section) => section._type === 'faqSection',
    ) as { heading: string; questions: { heading: string; body: string }[] }

    expect(faq.heading).toBe('AI Implementation FAQ')
    expect(faq.questions).toHaveLength(8)
    expect(faq.questions[0]!.heading).toBe('How do we start working with O3XO?')
    expect(new Set(faq.questions.map((question) => question.body)).size).toBe(8)
    for (const question of faq.questions) expect(question.body.length).toBeGreaterThan(40)
  })

  /** The kit draws the band on a photograph, and the extract already had it. */
  it('sits the FAQ band on the picture the source tags with its heading', () => {
    const faq = mapped('about/approach').doc.sections.find(
      (section) => section._type === 'faqSection',
    ) as { backgroundMedia?: { image: { _srcUrl: string }; tint: string } }

    expect(faq.backgroundMedia?.image._srcUrl).toContain('bvhrcj8dxlCVF8qGvOcECDSSZI')
    expect(faq.backgroundMedia?.tint).toBe('none')
  })

  it('marks every page provisional, saying what the migration could not carry', () => {
    for (const slug of ALL_SLUGS) {
      const { migration } = mapped(slug).doc
      expect(migration.locked, slug).toBe(false)
      expect(migration.sourceId, slug).toBe(`framer:page:${slug}`)
      expect(migration.provisional, slug).toBe(true)
      expect(migration.provisionalNote?.length, slug).toBeGreaterThan(40)
    }
  })

  it('gives every section and every array member a key unique in its page', () => {
    for (const slug of ALL_SLUGS) {
      const keys = JSON.stringify(mapped(slug).doc).match(/"_key":"[^"]+"/g) ?? []
      expect(new Set(keys).size, slug).toBe(keys.length)
    }
  })

  it('refuses a page it has no composition for, rather than emitting a stub', () => {
    const unknown = { ...record('about'), slug: 'careers', path: '/careers' }
    const result = mapFramerPage(unknown)
    expect(result.ok).toBe(false)
  })
})

describe('mapFramerPeople', () => {
  const people = mapFramerPeople(record('about'))

  it('emits one person per name the About page prints, with role and headshot', () => {
    expect(people.map((person) => person.name)).toEqual([
      'Mike Gadsby',
      'Josh Friedman',
      'Brady Halligan',
      'Diego Morales',
    ])
    expect(people[0]!._id).toBe('person-framer-mike-gadsby')
    expect(people[0]!.title).toBe('Co-Founder / Chief Innovation Officer')
    expect(people[0]!.headshot).toMatchObject({ _type: 'image' })
  })

  /** The third line of each triple — the paragraph the card draws under the role. */
  it('carries the biography printed under each name', () => {
    expect(people[0]!.bio).toBe(
      'Strategic leader with 25+ years driving digital transformation across industries, ' +
        'specializing in turning complex business challenges into actionable AI strategies.',
    )
    expect(people.every((person) => person.bio)).toBe(true)
  })

  it('is what the About page’s person grid references', () => {
    const grid = mapped('about').doc.sections.find((s) => s._type === 'personGridSection') as {
      people: { _ref: string }[]
    }
    expect(grid.people.map((ref) => ref._ref)).toEqual(people.map((person) => person._id))
  })
})

describe('mapFramerSiteSettings', () => {
  const settings = mapFramerSiteSettings(record('about').chrome)

  /**
   * The three facts about the O3XO entity that #217 recorded as missing: the
   * legal name, the privacy link, and the LinkedIn account the ld+json
   * declares. All three are on every page of o3xo.ai and none was extracted.
   */
  it('carries the entity facts the hand-seeded bootstrap could not', () => {
    expect(settings.legalName).toBe('O3 World, LLC')
    expect(settings.legalLinks?.[0]?.href).toBe('https://www.o3world.com/privacy-policy/')
    expect(settings.socialLinks).toEqual([
      {
        _type: 'socialLink',
        _key: 'social-linkedin',
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/company/o3xo',
      },
    ])
  })

  it('keeps the id the chrome query fetches, and the nav the site shows', () => {
    expect(settings._id).toBe('siteSettings')
    expect(settings.navItems.map((item) => item.label)).toEqual([
      'Industries',
      'Case studies',
      'Insights',
      'About',
    ])
    // Contact is the bar's button, not its fifth link — `4404:4036` draws it
    // as a filled Button and the live nav renders an `<a>` styled as one.
    expect(settings.primaryButton).toMatchObject({ label: 'Contact', href: '/contact' })
  })

  it('opens the three items the live nav opens, and leaves the fourth flat', () => {
    expect(settings.navItems.map((item) => [item._type, item.label])).toEqual([
      ['navGroup', 'Industries'],
      ['navGroup', 'Case studies'],
      ['button', 'Insights'],
      ['navGroup', 'About'],
    ])
  })

  it('gives each Industries card the line the panel draws under its title', () => {
    const group = settings.navItems[0]
    if (group?._type !== 'navGroup') throw new Error('Industries is not a group')
    expect(group.items.map((item) => [item.button.href, item.button.label, item.excerpt])).toEqual([
      ['/industries/construction', 'Construction', 'Project lifecycle automation'],
      ['/industries/industrial-services', 'Industrial services', 'Operational efficiency'],
      ['/industries/life-sciences', 'Life sciences', 'Research to revenue'],
      ['/industries/real-estate', 'Real estate', 'Lead gen + property mgmt optimization'],
      [
        '/industries/finance-insurance',
        'Finance + insurance',
        'Underwriting + advisory amplification',
      ],
      ['/industries/technology', 'Technology', 'Competitive advantage'],
    ])
    // The row that closes the panel. It is the group's own button because the
    // trigger cannot be it: a trigger that also navigates has two jobs.
    expect(group.button).toMatchObject({ label: 'View all industries', href: '/industries' })
  })

  it('carries an eyebrow only where the panel draws one', () => {
    const [industries, cases, , about] = settings.navItems
    if (industries?._type !== 'navGroup') throw new Error('Industries is not a group')
    if (cases?._type !== 'navGroup') throw new Error('Case studies is not a group')
    if (about?._type !== 'navGroup') throw new Error('About is not a group')

    // Industries names itself; a kicker over "Construction" saying
    // "Construction" is the label twice.
    expect(industries.items.every((item) => item.eyebrow === undefined)).toBe(true)
    // A case-study card is kickered with its industry, an About card with the
    // page it lands on. Stored in sentence case — the caps are the renderer's.
    expect(cases.items.map((item) => item.eyebrow)).toEqual([
      'Construction',
      'Industrial services',
      'Life sciences',
      'Industrial services',
      'Technology',
      'Finance + insurance',
    ])
    expect(about.items.map((item) => [item.eyebrow, item.button.label])).toEqual([
      ['About O3XO', 'Our story + mission'],
      ['Our approach', 'Strategy to activation'],
    ])
  })

  it('stops restating the nav as a footer column set', () => {
    // The kit's `Footer` (`4404:4148`) has no link columns at all — one row of
    // properties and the legal link, which `utilityNavItems` and `legalLinks`
    // already carry. The column the bootstrap invented had no reader left.
    expect(settings).not.toHaveProperty('footerGroups')
  })
})

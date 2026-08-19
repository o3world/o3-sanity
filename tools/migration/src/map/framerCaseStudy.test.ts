import { describe, expect, it } from 'vitest'

import type { FramerCaseStudyRecord } from './framerCaseStudy'
import { mapFramerCaseStudy, mapFramerClient } from './framerCaseStudy'

/**
 * o3xo.ai's case studies → the shared `caseStudy` model.
 *
 * The record below is what `lib/framer.ts` parses off a real page, cut to what
 * the mapping decisions turn on: the two authored bands, the results figure,
 * the quote, and the index card that carries the client's name.
 */
const RECORD: FramerCaseStudyRecord = {
  _meta: { type: 'caseStudy' },
  slug: 'buffalo-construction',
  path: '/case-studies/buffalo-construction',
  collectionItemId: 'CGj9neZAD',
  title: 'From “where do we start?” to AI across the project lifecycle',
  titleRendered: 'Buffalo Construction Case Study: AI-powered construction operations | O3XO',
  deck: 'Buffalo Construction had the ambition, but no clear path to AI adoption.',
  heroImage: {
    url: 'https://framerusercontent.com/images/hero.webp',
    alt: 'Construction team reviewing blueprints',
  },
  chapters: [
    {
      kicker: 'Opportunity',
      title: 'Strong ambition, no clear starting point',
      bodyHtml: '<p>Buffalo has built a solid reputation.</p><p>Teams each saw opportunities.</p>',
    },
    {
      kicker: 'Solution',
      title: 'Three AI solutions on the systems Buffalo already uses',
      bodyHtml: '<p>O3XO built three distinct AI tools.</p>',
    },
  ],
  stats: [{ value: '2X', label: 'Revenue capacity from 3 AI solutions' }],
  quote: {
    text: '“I was expecting the ROI next year, but we see it now.”',
    attribution: 'Brett Norton, President, Buffalo Construction, Inc',
  },
  card: {
    slug: 'buffalo-construction',
    client: 'Buffalo Construction',
    subject: 'AI-powered construction operations',
    headline: 'From “where do we start?” to AI across the project lifecycle',
    stat: { value: '2X', label: 'Revenue capacity from 3 AI solutions' },
    image: { url: 'https://framerusercontent.com/images/card.webp', alt: 'A construction team' },
  },
  seo: {
    canonicalRendered: 'https://www.o3xo.ai/case-studies/buffalo-construction',
    descriptionOverride: 'See how Buffalo Construction went from AI ambition to three solutions.',
    ogImage: 'https://framerusercontent.com/images/hero.webp?width=394',
  },
}

const OPTIONS = { caseStudyPrefix: '/case-studies' }

function mapped(record: FramerCaseStudyRecord = RECORD) {
  const result = mapFramerCaseStudy(record, OPTIONS)
  if (!result.ok) throw new Error(`did not map: ${JSON.stringify(result.issues)}`)
  return result
}

describe('mapFramerCaseStudy', () => {
  const { doc, notes } = mapped()

  it('gives the document a deterministic id naming its source', () => {
    expect(doc._id).toBe('caseStudy-framer-buffalo-construction')
    expect(doc.migration.sourceId).toBe('framer:caseStudy:CGj9neZAD')
    expect(doc.migration.locked).toBe(false)
  })

  it('serves the case study at the path o3xo.ai serves it at', () => {
    expect(doc.slug.current).toBe('buffalo-construction')
  })

  /**
   * The hero headline names the document; the deck under it is the
   * problem-framing sentence `narrativeHeadline` is for. The two are different
   * sentences on this site, so neither has to stand in for the other.
   */
  it('takes the headline as the title and the deck as the narrative headline', () => {
    expect(doc.title).toBe(RECORD.title)
    expect(doc.narrativeHeadline).toBe(RECORD.deck)
  })

  /**
   * The client's name is published on the collection index and nowhere else —
   * the detail page never prints it. `client` is required, so a source that did
   * not publish it would have to be refused rather than filled in.
   */
  it('points the required client reference at the name the index publishes', () => {
    expect(doc.client).toEqual({
      _type: 'reference',
      _ref: 'client-framer-buffalo-construction',
    })
    expect(mapFramerClient('Buffalo Construction')).toMatchObject({
      _id: 'client-framer-buffalo-construction',
      _type: 'client',
      name: 'Buffalo Construction',
    })
  })

  it('refuses a case study whose index card never named a client', () => {
    const result = mapFramerCaseStudy({ ...RECORD, card: { ...RECORD.card, client: '' } }, OPTIONS)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(JSON.stringify(result.issues)).toMatch(/client/)
  })

  it('carries the results band as stats and the hero photograph as hero media', () => {
    expect(doc.stats).toEqual([
      {
        _type: 'stat',
        _key: expect.any(String),
        value: '2X',
        label: 'Revenue capacity from 3 AI solutions',
      },
    ])
    expect(doc.heroMedia).toEqual({
      _type: 'figure',
      image: { _type: 'image', _srcUrl: 'https://framerusercontent.com/images/hero.webp' },
      alt: 'Construction team reviewing blueprints',
    })
  })

  /**
   * Opportunity and Solution are the two chapters the source authors, and the
   * quote is a band between the narrative and the end of the page — one
   * interleaved `story` array (ADR 0018).
   */
  it('interleaves the two chapters and the quote into one story', () => {
    expect(doc.story?.map((member) => member._type)).toEqual(['chapter', 'chapter', 'quoteSection'])
    expect(doc.story?.[0]).toMatchObject({
      _type: 'chapter',
      kicker: 'Opportunity',
      title: 'Strong ambition, no clear starting point',
    })
    expect(doc.story?.[2]).toMatchObject({
      _type: 'quoteSection',
      quote: 'I was expecting the ROI next year, but we see it now.',
      attribution: 'Brett Norton, President, Buffalo Construction, Inc',
      surface: 'bone',
    })
  })

  /**
   * The band draws the quotation marks — every seeded `quoteSection` in the
   * repo stores the words alone. o3xo.ai types them into the copy, in both
   * curly and straight forms, so leaving them in ships `““…””`.
   */
  it('strips the quotation marks the band draws itself, and says it did', () => {
    const quoted = mapped()
    expect((quoted.doc.story?.[2] as unknown as { quote: string }).quote).toBe(
      'I was expecting the ROI next year, but we see it now.',
    )
    expect(JSON.stringify(quoted.notes)).toMatch(/quotation marks/)

    const { doc: straight } = mapped({
      ...RECORD,
      quote: { text: '"Straight quotes too."', attribution: 'A reader' },
    })
    expect((straight.story?.[2] as unknown as { quote: string }).quote).toBe('Straight quotes too.')
  })

  it('leaves the story two chapters long when the page has no quote band', () => {
    const { doc: quiet } = mapped({ ...RECORD, quote: null })
    expect(quiet.story?.map((member) => member._type)).toEqual(['chapter', 'chapter'])
  })

  it('converts a chapter body to portable text rather than storing HTML', () => {
    const chapter = doc.story?.[0] as { body: { _type: string; _key: string }[] }
    expect(chapter.body).toHaveLength(2)
    expect(chapter.body[0]?._type).toBe('block')
    expect(new Set(chapter.body.map((block) => block._key)).size).toBe(2)
  })

  /** The `<title>` is the headline plus ` | O3XO`, which the app composes itself. */
  it('keeps only the meta description, never the served title or canonical', () => {
    expect(doc.seo).toEqual({
      description: 'See how Buffalo Construction went from AI ambition to three solutions.',
    })
  })

  /**
   * Three authored fields have no home in this model — the card's subject
   * label, the card's own sentence, and the card's photograph. They are not
   * invented into fields that mean something else, and they are not lost
   * quietly: the note names them on every run and the document says so.
   */
  it('reports the card fields the model cannot carry, on every run', () => {
    const reported = JSON.stringify(notes)
    expect(reported).toMatch(/AI-powered construction operations/)
    expect(reported).toMatch(/From “where do we start\?”/)
    expect(reported).toMatch(/card\.webp/)
  })

  it('marks the document provisional and says what would clear it', () => {
    expect(doc.migration.provisional).toBe(true)
    expect(doc.migration.provisionalNote).toMatch(/logo/)
  })
})

describe('mapFramerClient', () => {
  /**
   * `client.logo` is required in Studio and o3xo.ai publishes none — no client
   * mark appears anywhere on the site. The document loads and reads as invalid
   * in Studio, which is the correct signal, and it says why.
   */
  it('marks a client provisional for the logo the source has no field for', () => {
    const client = mapFramerClient('Global tech firm')
    expect(client._id).toBe('client-framer-global-tech-firm')
    expect(client.migration.provisional).toBe(true)
    expect(client.migration.provisionalNote).toMatch(/logo/)
  })
})

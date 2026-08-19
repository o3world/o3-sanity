import { describe, expect, it } from 'vitest'

import { CASE_STUDIES_PAGE_QUERY } from '@o3/sanity/queries'

import { buildIndexRoute } from '@o3/content-runtime/routes'
import {
  aCaseStudiesPage,
  aCaseStudyCard,
  renderRoute,
  siteSettings,
  withSettings,
  type FetchCall,
} from '@/test'

import { caseStudyIndex } from './collectionIndex'

/**
 * The case-study index — this brand's `/case-studies`, where O3 serves
 * `/work` under the name `Work` (ADR 0028). Prefix and title both come off
 * brand config, and this is where that is checked through a real render
 * rather than by reading the source (`src/brandBinding.test.ts` does that
 * half).
 */
const route = buildIndexRoute(caseStudyIndex)

function manyCases(count: number) {
  return Array.from({ length: count }, (_, i) =>
    aCaseStudyCard({ _id: `caseStudy-${i}`, title: `Case ${i}`, slug: `case-${i}` }),
  )
}

function render(data: unknown, searchParams?: Record<string, string>) {
  return renderRoute(route, {
    data: withSettings(data, siteSettings({ title: 'O3XO' })),
    searchParams,
  })
}

function feedCalls(calls: readonly FetchCall[]): readonly FetchCall[] {
  return calls.filter((call) => call.query === CASE_STUDIES_PAGE_QUERY)
}

/** One migrated case study, with every field the kit's card draws. */
function aBuffaloCase() {
  return aCaseStudyCard({
    _id: 'caseStudy-framer-buffalo-construction',
    slug: 'buffalo-construction',
    title: 'From “where do we start?” to AI across the project lifecycle',
    client: { name: 'Buffalo Construction', logo: null },
    narrativeHeadline: 'Buffalo Construction had the ambition, but no clear path to AI adoption.',
    headlineStat: {
      _key: 'k0011',
      _type: 'stat',
      value: '2X',
      label: 'Revenue capacity from 3 AI solutions in < 6 months',
    },
    heroMedia: {
      _type: 'figure',
      alt: 'Construction team reviewing architectural blueprints',
      image: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: 'image-5d901a6029df2e121bbe878301a3f1e043b0c6f4-394x250-webp',
        },
      },
    },
    industries: null,
    industryDetail: null,
  })
}

describe('the case-study index route', () => {
  it('takes its name from brand config', async () => {
    const { metadata } = await render(aCaseStudiesPage())
    expect(metadata.title).toBe('Case studies')
  })

  it('canonicalises at this brand’s prefix', async () => {
    const { metadata } = await render(aCaseStudiesPage())
    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/case-studies')
  })

  it('links every card at this brand’s prefix, and O3’s nowhere', async () => {
    const { html } = await render(aCaseStudiesPage(manyCases(3), 3))

    expect(html).toContain('href="/case-studies/case-0"')
    expect(html).toContain('href="/case-studies/case-2"')
    expect(html).not.toContain('href="/work/')
  })

  it('heads the page with the collection’s name, not O3’s', async () => {
    const { html } = await render(aCaseStudiesPage(manyCases(1), 1))
    expect(html).toContain('Case studies.')
    expect(html).not.toContain('>Work<')
  })

  /** Nine per page, not the builder's default twelve — see the entry. */
  it('slices the feed nine at a time', async () => {
    const { calls } = await render(aCaseStudiesPage(manyCases(9), 30), { page: '2' })
    expect(feedCalls(calls)[0]?.params).toMatchObject({ offset: 9, end: 18 })
  })

  it('keeps the prefix on both ends of the pager', async () => {
    const { html } = await render(aCaseStudiesPage(manyCases(9), 30), { page: '2' })

    // Page 1 is the unpaginated index, so Previous drops the parameter.
    expect(html).toContain('href="/case-studies"')
    expect(html).toContain('href="/case-studies?page=3"')
  })

  /**
   * The kit's card leads with the client, not with the case study's own
   * title — the title never appears on it (`4404:3072`, and the same is true
   * of O3's card, where it is only the narrative's fallback).
   */
  it('names the client at the head of each card', async () => {
    const { html } = await render(aCaseStudiesPage([aBuffaloCase()], 1))

    expect(html).toMatch(/<h3[^>]*>Buffalo Construction<\/h3>/)
    expect(html).not.toContain('From “where do we start?”')
  })

  it('draws the narrative and the headline stat under it', async () => {
    const { html } = await render(aCaseStudiesPage([aBuffaloCase()], 1))

    expect(html).toContain('Buffalo Construction had the ambition')
    expect(html).toContain('2X')
    expect(html).toContain('Revenue capacity from 3 AI solutions')
  })

  /**
   * The photograph is a band across the top of a light card, not the card's
   * own background under a scrim — which is what makes it an `<img>` with the
   * document's alt text rather than decoration.
   */
  it('heads the card with the hero photograph', async () => {
    const { html } = await render(aCaseStudiesPage([aBuffaloCase()], 1))

    expect(html).toMatch(/<img[^>]*alt="Construction team reviewing architectural blueprints"/)
  })

  /** The kit's card carries no button; the whole card is the link. */
  it('shows no faux CTA inside the card', async () => {
    const { html } = await render(aCaseStudiesPage([aBuffaloCase()], 1))
    expect(html).not.toContain('View our work')
  })

  it('says where you are by marking the page you are on', async () => {
    // The pager is numbered (#241), so "where you are" is `aria-current` on
    // one of the four numbers rather than a sentence beside two arrows.
    const { html } = await render(aCaseStudiesPage(manyCases(9), 30), { page: '2' })

    const current = html.match(/<a[^>]*aria-current="page"[^>]*>/)?.[0] ?? ''
    expect(current).toContain('href="/case-studies?page=2"')
    expect([...html.matchAll(/aria-current="page"/g)]).toHaveLength(1)
  })
})

/**
 * The route half of the #40 provisional mechanism (ADR 0007). A collection
 * index has no document (CONTEXT.md), so the marker lives on the route entry.
 *
 * This index borrows O3's Work frame and holds a placeholder heading until
 * O3XO's own case studies land and the delta evaluation settles the copy.
 */
describe('case-study index provenance', () => {
  it('says what would clear it while it is provisional', () => {
    expect(caseStudyIndex.migration?.provisional).toBe(true)
    expect(caseStudyIndex.migration?.provisionalNote?.trim()).toBeTruthy()
  })

  it('claims no frame of its own while it is provisional', () => {
    // Mutually exclusive by definition: `figmaNode` says the composition was
    // transcribed from a frame drawn for this route, `provisional` says none
    // was. The borrowed frame is named in the note, not in the field.
    expect(caseStudyIndex.migration?.figmaNode).toBeUndefined()
  })
})

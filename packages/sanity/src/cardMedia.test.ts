import { evaluate, parse } from 'groq-js'
import { describe, expect, it } from 'vitest'

import { CASE_STUDIES_QUERY, LATEST_INSIGHTS_QUERY } from './queries'

/**
 * THE CARD-SIDE FALLBACK (#416).
 *
 * A document carries two figures with one job each, and neither is required:
 * a card draws `cardMedia` and falls back to `heroMedia`. The chain resolves
 * in the card projection rather than in each card renderer, so that every
 * feed, band and carousel inherits it — which puts it here rather than in a
 * rendered page, beside `feedOrder.test.ts` for the same reason: `groq-js` is
 * Sanity's own evaluator, so the query under test is the exact string the
 * dataset answers.
 *
 * The hero side of the chain is the view's, and is asserted through a
 * rendered page in each app's detail render test.
 */
async function cards(dataset: unknown[]) {
  const result = await evaluate(parse(CASE_STUDIES_QUERY), { dataset })
  return (await result.get()) as Array<{ cardMedia: { alt?: string } | null }>
}

function figure(alt: string) {
  return {
    _type: 'figure',
    alt,
    image: { _type: 'image', asset: { _type: 'reference', _ref: `image-${alt}` } },
  }
}

async function insightCards(dataset: unknown[]) {
  const params = { categoryId: null, limit: 10 }
  const result = await evaluate(parse(LATEST_INSIGHTS_QUERY, { params }), { dataset, params })
  return (await result.get()) as Array<{ cardMedia: { alt?: string } | null }>
}

function caseStudy(fields: Record<string, unknown>) {
  return {
    _id: 'caseStudy-one',
    _type: 'caseStudy',
    title: 'One',
    slug: { _type: 'slug', current: 'one' },
    ...fields,
  }
}

describe('the picture a case-study card draws', () => {
  it('draws the card picture when there is one', async () => {
    const [card] = await cards([
      caseStudy({ cardMedia: figure('the-tile'), heroMedia: figure('the-lead') }),
    ])
    expect(card?.cardMedia?.alt).toBe('the-tile')
  })

  it('falls back to the lead picture when no card picture was chosen', async () => {
    const [card] = await cards([caseStudy({ heroMedia: figure('the-lead') })])
    expect(card?.cardMedia?.alt).toBe('the-lead')
  })

  it('draws nothing when the document has neither', async () => {
    const [card] = await cards([caseStudy({})])
    expect(card?.cardMedia).toBeNull()
  })

  /** A card never draws a hero, so a card payload never carries one. */
  it('carries no hero picture into the card payload', async () => {
    const [card] = await cards([caseStudy({ heroMedia: figure('the-lead') })])
    expect(card).not.toHaveProperty('heroMedia')
  })
})

function insight(fields: Record<string, unknown>) {
  return {
    _id: 'insight-wp-1',
    _type: 'insight',
    title: 'One',
    slug: { _type: 'slug', current: 'one' },
    publishedAt: '2026-05-04T13:20:00Z',
    body: [],
    ...fields,
  }
}

describe('the picture an insight card draws', () => {
  it('draws the card picture when there is one', async () => {
    const [card] = await insightCards([
      insight({ cardMedia: figure('the-tile'), heroMedia: figure('the-lead') }),
    ])
    expect(card?.cardMedia?.alt).toBe('the-tile')
  })

  it('falls back to the lead picture when no card picture was chosen', async () => {
    const [card] = await insightCards([insight({ heroMedia: figure('the-lead') })])
    expect(card?.cardMedia?.alt).toBe('the-lead')
  })

  /** The one insight with no picture at all renders none, exactly as before. */
  it('draws nothing when the document has neither', async () => {
    const [card] = await insightCards([insight({})])
    expect(card?.cardMedia).toBeNull()
  })

  it('carries no hero picture into the card payload', async () => {
    const [card] = await insightCards([insight({ heroMedia: figure('the-lead') })])
    expect(card).not.toHaveProperty('heroMedia')
  })
})

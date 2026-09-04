import { describe, expect, it } from 'vitest'

import { buildDetailRoute } from '@o3/content-runtime/routes'
import { aCaseStudy, aCaseStudyCard, renderRoute, siteSettings, withSettings } from '@/test'

import { caseStudy } from './entry'

/**
 * THE TWO PICTURES, THROUGH THE REAL ROUTE (#417).
 *
 * A case study carries a lead figure and a card figure with one job each, and
 * neither is required. This is the hero half of the chain — the view draws
 * `heroMedia` and falls back to `cardMedia` — plus what the next-case band at
 * the foot of the page draws, which is the card projection's answer and so
 * already resolved by the time it arrives.
 *
 * The card half of the chain lives in the projection (`CARD_MEDIA`) because
 * every feed and band consumes it; it is asserted against a real GROQ
 * evaluator in `packages/sanity/src/cardMedia.test.ts`.
 */
const route = buildDetailRoute(caseStudy)

const HERO_ID = '4444444444444444444444444444444444444444'
const CARD_ID = '5555555555555555555555555555555555555555'

function figure(id: string, alt: string) {
  return {
    _type: 'figure',
    image: { _type: 'image', asset: { _type: 'reference', _ref: `image-${id}-2000x1200-jpg` } },
    alt,
  }
}

function render(overrides: Parameters<typeof aCaseStudy>[0]) {
  return renderRoute(route, {
    data: withSettings(aCaseStudy(overrides), siteSettings()),
    params: { slug: 'a-case-study' },
  })
}

/** The page down to the next-case band, which draws a picture of its own. */
function heroBand(html: string) {
  const foot = html.indexOf('Next project')
  return foot === -1 ? html : html.slice(0, foot)
}

describe('the case-study hero picture', () => {
  it('draws the lead figure when the editor has chosen one', async () => {
    const { html } = await render({
      heroMedia: figure(HERO_ID, 'The lead photograph') as never,
      cardMedia: figure(CARD_ID, 'The tile') as never,
    })
    expect(heroBand(html)).toContain(HERO_ID)
    expect(heroBand(html)).not.toContain(CARD_ID)
  })

  it('falls back to the card figure when no lead figure was chosen', async () => {
    const { html } = await render({
      heroMedia: null,
      cardMedia: figure(CARD_ID, 'The tile') as never,
    })
    expect(heroBand(html)).toContain(CARD_ID)
  })

  it('draws no picture when the document has neither', async () => {
    const { html } = await render({ heroMedia: null, cardMedia: null })
    expect(heroBand(html)).not.toContain(HERO_ID)
    expect(heroBand(html)).not.toContain(CARD_ID)
  })
})

describe('the next-case band', () => {
  it('draws the neighbour’s card picture', async () => {
    const { html } = await render({
      next: aCaseStudyCard({
        _id: 'caseStudy-the-one-after',
        title: 'The one after',
        slug: 'the-one-after',
        client: { name: 'IRONMAN', logo: null },
        cardMedia: figure(CARD_ID, 'The tile') as never,
      }),
    })
    expect(html.slice(html.indexOf('Next project'))).toContain(CARD_ID)
  })
})

describe('the share preview', () => {
  it('follows the card chain', async () => {
    const { metadata } = await render({
      heroMedia: figure(HERO_ID, 'The lead photograph') as never,
      cardMedia: figure(CARD_ID, 'The tile') as never,
    })
    const images = JSON.stringify(metadata.openGraph?.images)
    expect(images).toContain(CARD_ID)
    expect(images).not.toContain(HERO_ID)
  })

  /**
   * The projection hands the entry an already-resolved `cardMedia`, so a
   * study with only a lead figure still gets a preview — this asserts the
   * entry passes the chain on rather than dropping it.
   */
  it('uses the lead figure when that is all the card chain resolved to', async () => {
    const { metadata } = await render({
      cardMedia: figure(HERO_ID, 'The lead photograph') as never,
    })
    expect(JSON.stringify(metadata.openGraph?.images)).toContain(HERO_ID)
  })
})

import { describe, expect, it } from 'vitest'

import { defineCardRender, getCard } from './card-registry'

function KitCaseStudyCard() {
  return null
}

function AppPageCard() {
  return null
}

/**
 * The card tier's binding point: an app hands a section its own card table and
 * everything it does not bind keeps the shared card.
 *
 * `caseStudy` has no shared card to keep — it is app-first
 * (`APP_FIRST_RENDERERS`), so its binding is required rather than a re-point,
 * and calling `getCard('caseStudy')` with nothing bound does not compile.
 */
describe('getCard', () => {
  const cards = { caseStudy: KitCaseStudyCard }

  it('draws the app’s card for a type it binds', () => {
    expect(getCard('caseStudy', cards)).toBe(KitCaseStudyCard)
  })

  it('falls back to the shared card for a type it does not', () => {
    expect(getCard('insight', cards)).not.toBe(KitCaseStudyCard)
    expect(getCard('page', cards)).toBe(getCard('page'))
  })

  it('draws the app’s card for a shared type it re-points', () => {
    expect(getCard('page', { page: AppPageCard })).toBe(AppPageCard)
  })
})

describe('defineCardRender', () => {
  it('keys the binding by the card type it names', () => {
    expect(defineCardRender('caseStudy', { component: KitCaseStudyCard })).toEqual({
      type: 'caseStudy',
      component: KitCaseStudyCard,
    })
  })
})

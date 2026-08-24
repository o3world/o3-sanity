import { describe, expect, it } from 'vitest'

import { defineCardRender, getCard } from './card-registry'

function KitCaseStudyCard() {
  return null
}

/**
 * The card tier's binding point: an app hands a section its own card table and
 * everything it does not bind keeps the shared card.
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

  it('draws the shared card when an app binds nothing at all', () => {
    expect(getCard('caseStudy')).toBe(getCard('caseStudy', {}))
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

import { describe, expect, it } from 'vitest'

import { CARD_TYPES, getCard } from './card-registry'

describe('getCard', () => {
  it.each(CARD_TYPES)('draws a card for %s', (type) => {
    expect(getCard(type)).toBeDefined()
  })

  it('draws a different card per type', () => {
    expect(new Set(CARD_TYPES.map((type) => getCard(type))).size).toBe(CARD_TYPES.length)
  })
})

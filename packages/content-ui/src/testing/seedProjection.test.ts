import { expect, it } from 'vitest'

import { projectCard } from './seedProjection'

it('projects card imagery with the same explicit-card then hero fallback as CARD_MEDIA', () => {
  const heroMedia = { image: { asset: { _ref: 'image-hero-1600x900-jpg' } }, alt: 'Hero' }
  const cardMedia = { image: { asset: { _ref: 'image-card-1600x900-jpg' } }, alt: 'Card' }
  expect(projectCard({ heroMedia }, () => null)?.cardMedia).toEqual(heroMedia)
  expect(projectCard({ heroMedia, cardMedia }, () => null)?.cardMedia).toEqual(cardMedia)
  expect(projectCard({}, () => null)?.cardMedia).toBeNull()
})

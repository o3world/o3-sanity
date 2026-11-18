import { expect, it } from 'vitest'

import { planServiceOfferSeed, type ExistingOffer, type SeedOffer } from './serviceOfferSeedPlan'

const seed = (): SeedOffer => ({
  _id: 'serviceOffer-seed-ai-visibility-review',
  _type: 'serviceOffer',
  title: 'AI Visibility Review',
  slug: { _type: 'slug', current: 'ai-visibility-review' },
})

it('creates the seeded offer when the dataset holds nothing at its id or slug', () => {
  const plan = planServiceOfferSeed(seed(), [])
  expect(plan).toEqual({ kind: 'create', document: seed() })
})

it('writes nothing when the offer is already there, published or as a draft', () => {
  for (const existing of [
    { _id: 'serviceOffer-seed-ai-visibility-review', slug: 'ai-visibility-review' },
    { _id: 'drafts.serviceOffer-seed-ai-visibility-review', slug: 'ai-visibility-review' },
  ] satisfies ExistingOffer[]) {
    expect(planServiceOfferSeed(seed(), [existing])).toEqual({
      kind: 'skip',
      reason: `${existing._id} already exists`,
    })
  }
})

it('writes nothing when another offer already claims the slug the route fetches', () => {
  const plan = planServiceOfferSeed(seed(), [{ _id: 'a1b2c3', slug: 'ai-visibility-review' }])
  expect(plan).toEqual({
    kind: 'skip',
    reason: 'a1b2c3 already claims slug "ai-visibility-review"',
  })
})

it('refuses a seed that is not a service offer', () => {
  expect(() =>
    planServiceOfferSeed({ ...seed(), _type: 'page' } as unknown as SeedOffer, []),
  ).toThrow(/not a serviceOffer/)
})

it('hands back a copy, so the seed read from disk is never changed', () => {
  const original = seed()
  const plan = planServiceOfferSeed(original, [])
  expect(plan.kind === 'create' && plan.document).not.toBe(original)
})

import { describe, expect, it } from 'vitest'

import { capToBudget, prerenderBudget } from './prerenderBudget'

const SLUGS = ['a', 'b', 'c', 'd', 'e']

describe('prerenderBudget', () => {
  it('gives the production build every slug', () => {
    expect(prerenderBudget({ VERCEL_ENV: 'production' })).toBe(Infinity)
  })

  it('caps a preview build, which is what the traffic was', () => {
    expect(prerenderBudget({ VERCEL_ENV: 'preview' })).toBeLessThan(SLUGS.length)
  })

  it('caps a build that is on no deployment at all — a laptop is not free either', () => {
    expect(prerenderBudget({})).toBeLessThan(SLUGS.length)
  })

  it('honours the escape hatch, whatever the deployment says', () => {
    expect(prerenderBudget({ O3_PRERENDER_ALL: '1' })).toBe(Infinity)
    expect(prerenderBudget({ VERCEL_ENV: 'preview', O3_PRERENDER_ALL: '1' })).toBe(Infinity)
  })
})

describe('capToBudget', () => {
  it('hands back the whole list when the budget covers it', () => {
    expect(capToBudget(SLUGS, Infinity)).toEqual(SLUGS)
    expect(capToBudget(SLUGS, 5)).toEqual(SLUGS)
  })

  it('takes the first n, in the order the dataset gave them', () => {
    expect(capToBudget(SLUGS, 2)).toEqual(['a', 'b'])
  })

  it('never returns nothing for a collection that has documents', () => {
    // An empty generateStaticParams is EmptyGenerateStaticParamsError under
    // Cache Components — a failed build, not a cheaper one.
    expect(capToBudget(SLUGS, 0)).toEqual(['a'])
    expect(capToBudget(SLUGS, -1)).toEqual(['a'])
  })

  it('leaves an empty collection empty — there is nothing to prerender', () => {
    expect(capToBudget([], 3)).toEqual([])
  })
})

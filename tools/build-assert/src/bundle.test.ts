import { describe, expect, it } from 'vitest'

import { checkJsBudget, describeBudgetProblem, headroom } from './bundle'
import type { JsBudget, RouteBundle } from './bundle'

/**
 * Trimmed from `apps/web/.next/diagnostics/route-bundle-stats.json` after a
 * real `next build` (Next 16.2, 2026-08-21). The chunk paths are what the file
 * carries and nothing under test reads them; the byte counts are the ones the
 * audit in #269 measured.
 */
const bundles: RouteBundle[] = [
  { route: '/', firstLoadUncompressedJsBytes: 667_149, firstLoadChunkPaths: [] },
  { route: '/insights/[slug]', firstLoadUncompressedJsBytes: 667_149, firstLoadChunkPaths: [] },
  { route: '/_not-found', firstLoadUncompressedJsBytes: 520_264, firstLoadChunkPaths: [] },
  {
    route: '/studio/[[...tool]]',
    firstLoadUncompressedJsBytes: 7_849_537,
    firstLoadChunkPaths: [],
  },
]

const budget: JsBudget = {
  defaultBytes: 730_000,
  maxIncreaseBytes: 10_000,
  routes: [{ route: '/studio/[[...tool]]', bytes: 8_635_000, reason: 'an editing application' }],
}

describe('checkJsBudget', () => {
  it('rejects a 20 KB route increase even below the absolute ceiling', () => {
    const baseline = [
      { route: '/', firstLoadUncompressedJsBytes: 696_786, firstLoadChunkPaths: [] },
    ]
    const current = [{ ...baseline[0]!, firstLoadUncompressedJsBytes: 716_786 }]

    expect(checkJsBudget(current, { ...budget, routes: [] }, baseline)).toEqual([
      {
        kind: 'over-growth',
        route: '/',
        baselineBytes: 696_786,
        bytes: 716_786,
        increaseBytes: 20_000,
        maxIncreaseBytes: 10_000,
      },
    ])
  })

  it('permits unchanged, smaller and exactly 10 KB larger routes', () => {
    const baseline = [
      { route: '/', firstLoadUncompressedJsBytes: 696_786, firstLoadChunkPaths: [] },
    ]
    for (const bytes of [696_786, 650_000, 706_786]) {
      expect(
        checkJsBudget(
          [{ ...baseline[0]!, firstLoadUncompressedJsBytes: bytes }],
          { ...budget, routes: [] },
          baseline,
        ),
      ).toEqual([])
    }
  })

  it('holds new routes to the absolute ceiling and ignores removed routes', () => {
    const baseline = [
      { route: '/removed', firstLoadUncompressedJsBytes: 696_786, firstLoadChunkPaths: [] },
    ]
    const current = [
      { route: '/new', firstLoadUncompressedJsBytes: 730_000, firstLoadChunkPaths: [] },
    ]
    expect(checkJsBudget(current, { ...budget, routes: [] }, baseline)).toEqual([])
    expect(
      checkJsBudget(
        [{ ...current[0]!, firstLoadUncompressedJsBytes: 730_001 }],
        { ...budget, routes: [] },
        baseline,
      ),
    ).toEqual([{ kind: 'over-budget', route: '/new', bytes: 730_001, budgetBytes: 730_000 }])
  })

  it('still enforces the absolute ceiling when growth is small', () => {
    const baseline = [
      { route: '/', firstLoadUncompressedJsBytes: 729_000, firstLoadChunkPaths: [] },
    ]
    expect(
      checkJsBudget(
        [{ ...baseline[0]!, firstLoadUncompressedJsBytes: 731_000 }],
        { ...budget, routes: [] },
        baseline,
      ),
    ).toEqual([{ kind: 'over-budget', route: '/', bytes: 731_000, budgetBytes: 730_000 }])
  })

  it('passes when every route is inside its budget', () => {
    expect(checkJsBudget(bundles, budget)).toEqual([])
  })

  it('names a route that outgrew the default, with both numbers', () => {
    const grown = bundles.map((bundle) =>
      bundle.route === '/' ? { ...bundle, firstLoadUncompressedJsBytes: 900_000 } : bundle,
    )

    expect(checkJsBudget(grown, budget)).toEqual([
      { kind: 'over-budget', route: '/', bytes: 900_000, budgetBytes: 730_000 },
    ])
  })

  it('holds a route with an entry to that entry rather than the default', () => {
    // The Studio is eight times the default and passes; the same bytes on a
    // route with no entry would not.
    const overrun = bundles.map((bundle) =>
      bundle.route === '/studio/[[...tool]]'
        ? { ...bundle, firstLoadUncompressedJsBytes: 9_000_000 }
        : bundle,
    )

    expect(checkJsBudget(overrun, budget)).toEqual([
      {
        kind: 'over-budget',
        route: '/studio/[[...tool]]',
        bytes: 9_000_000,
        budgetBytes: 8_635_000,
      },
    ])
  })

  it('names an entry for a route the build has never heard of', () => {
    // The same rule the rendering allowlist holds: an entry that outlived its
    // route is a permission nobody reviewed.
    const renamed: JsBudget = {
      ...budget,
      routes: [...budget.routes, { route: '/studio', bytes: 8_635_000, reason: 'moved' }],
    }

    expect(checkJsBudget(bundles, renamed)).toEqual([{ kind: 'unknown-budget', route: '/studio' }])
  })

  it('is a ceiling, not an exact set — coming in under is the point', () => {
    const trimmed = bundles.map((bundle) => ({
      ...bundle,
      firstLoadUncompressedJsBytes: 1_000,
    }))

    expect(checkJsBudget(trimmed, budget)).toEqual([])
  })
})

describe('describeBudgetProblem', () => {
  it('names the route, what it ships and what it may ship', () => {
    const message = describeBudgetProblem({
      kind: 'over-budget',
      route: '/work/[slug]',
      bytes: 900_000,
      budgetBytes: 730_000,
    })

    expect(message).toContain('/work/[slug]')
    expect(message).toContain('900,000')
    expect(message).toContain('730,000')
  })

  it('names the route of an entry the build has outlived', () => {
    expect(describeBudgetProblem({ kind: 'unknown-budget', route: '/studio' })).toContain('/studio')
  })
})

describe('headroom', () => {
  // What the run prints for a passing route: an entry with room to spare is
  // the shape a spent exception takes, and it should be visible without a
  // failure.
  it('reports what is left of a route budget', () => {
    expect(headroom(bundles[0]!, budget)).toEqual({ budgetBytes: 730_000, leftBytes: 62_851 })
  })

  it('reads an entry rather than the default when the route has one', () => {
    expect(headroom(bundles[3]!, budget).budgetBytes).toBe(8_635_000)
  })
})

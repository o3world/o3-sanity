import { describe, expect, it } from 'vitest'

import { checkRenderingStrategy, describeProblem, perRequestRoutes } from './rendering'
import type { BuildOutput, RenderingPolicy } from './rendering'

/**
 * Manifests trimmed from a real `next build` of `apps/web` (Next 16.2,
 * 2026-08-21): the keys and the route-group prefixes are as Next writes them.
 * The prerender entries keep their `srcRoute` back-reference to stay faithful
 * to the real file, and nothing under test reads it.
 */
const build: BuildOutput = {
  cacheComponents: false,
  appPathRoutes: {
    '/(site)/[...segments]/page': '/[...segments]',
    '/(site)/insights/[slug]/page': '/insights/[slug]',
    '/(site)/insights/page': '/insights',
    '/(site)/page': '/',
    '/api/revalidate/route': '/api/revalidate',
    '/robots.txt/route': '/robots.txt',
    '/studio/[[...tool]]/page': '/studio/[[...tool]]',
  },
  prerender: {
    routes: {
      '/': { srcRoute: '/' },
      '/about': { srcRoute: '/[...segments]' },
      '/insights/the-design-team-moved-the-file': { srcRoute: '/insights/[slug]' },
      '/robots.txt': { srcRoute: '/robots.txt' },
    },
    dynamicRoutes: {
      '/[...segments]': {},
      '/insights/[slug]': {},
    },
  },
}

const policy: RenderingPolicy = {
  perRequest: [
    { route: '/api/revalidate', kind: 'inherent', reason: 'a POST handler' },
    { route: '/studio/[[...tool]]', kind: 'inherent', reason: 'the Studio app shell' },
    { route: '/insights', kind: 'migrating', reason: 'reads searchParams' },
  ],
}

describe('perRequestRoutes', () => {
  it('names the routes the build prerendered nothing for', () => {
    expect(perRequestRoutes(build)).toEqual(['/api/revalidate', '/insights', '/studio/[[...tool]]'])
  })

  it('sees through a parameterised route whose paths only partly survived', () => {
    // One path bailing out of prerendering (`revalidate: 0`) costs the whole
    // route its `dynamicRoutes` entry while its siblings stay in `routes`
    // under the same `srcRoute`. Next prints that route as `ƒ`, so the
    // surviving paths must not read as prerendered.
    const bailed: BuildOutput = {
      ...build,
      prerender: {
        routes: build.prerender.routes,
        dynamicRoutes: { '/[...segments]': {} },
      },
    }

    expect(perRequestRoutes(bailed)).toContain('/insights/[slug]')
  })
})

describe('checkRenderingStrategy', () => {
  it('passes when the per-request routes are exactly the allowlist', () => {
    expect(checkRenderingStrategy(build, policy)).toEqual([])
  })

  it('names a route that regressed to per-request rendering', () => {
    // A route the build prerendered nothing for at all — what a dynamic API
    // read in a shared layout leaves behind.
    const regressed: BuildOutput = {
      ...build,
      appPathRoutes: { ...build.appPathRoutes, '/(site)/work/[slug]/page': '/work/[slug]' },
    }

    expect(checkRenderingStrategy(regressed, policy)).toEqual([
      { kind: 'unexpected', route: '/work/[slug]' },
    ])
  })

  it('names an allowlist entry the build now prerenders', () => {
    const stale: RenderingPolicy = {
      perRequest: [
        ...policy.perRequest,
        { route: '/', kind: 'migrating', reason: 'fixed a release ago' },
      ],
    }

    expect(checkRenderingStrategy(build, stale)).toEqual([{ kind: 'stale', route: '/' }])
  })

  it('names an allowlist entry for a route the build has never heard of', () => {
    const renamed: RenderingPolicy = {
      perRequest: [
        ...policy.perRequest,
        { route: '/api/preview', kind: 'inherent', reason: 'renamed to /api/draft-mode/enable' },
      ],
    }

    expect(checkRenderingStrategy(build, renamed)).toEqual([
      { kind: 'unknown', route: '/api/preview' },
    ])
  })
})

describe('describeProblem', () => {
  // Diagnosing a regression has to start from the route, not from the bill.
  it.each([
    { kind: 'unexpected', route: '/work/[slug]' },
    { kind: 'stale', route: '/insights' },
    { kind: 'unknown', route: '/api/preview' },
    { kind: 'no-shell', route: '/work' },
  ] as const)('names the route in a $kind report', (problem) => {
    expect(describeProblem(problem)).toContain(problem.route)
  })
})

/**
 * Cache Components is the next ticket in the map. Under it a route with
 * dynamic holes still prerenders a shell, so the same absence from the
 * prerender manifest means something stronger: no shell at all.
 */
describe('checkRenderingStrategy under Cache Components', () => {
  it('stops excusing a route the allowlist only permitted until the migration', () => {
    const migrated: BuildOutput = { ...build, cacheComponents: true }

    expect(checkRenderingStrategy(migrated, policy)).toEqual([
      { kind: 'no-shell', route: '/insights' },
    ])
  })

  it('accepts a shell with a streamed hole in it', () => {
    // A partially static route is an ordinary prerender entry — the shell is
    // on disk, the hole streams in per request.
    const migrated: BuildOutput = {
      ...build,
      cacheComponents: true,
      prerender: {
        ...build.prerender,
        routes: { ...build.prerender.routes, '/insights': { srcRoute: '/insights' } },
      },
    }

    // The shell exists, so the migration entry has done its job and the file
    // should lose it — which is how the allowlist empties.
    expect(checkRenderingStrategy(migrated, policy)).toEqual([
      { kind: 'stale', route: '/insights' },
    ])
  })
})

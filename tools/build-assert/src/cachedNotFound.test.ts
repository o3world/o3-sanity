import { describe, expect, it } from 'vitest'

import { checkCachedNotFound } from './cachedNotFound'
import type { RenderingOutput } from './rendering'

/**
 * Trimmed from a real `next build` of `apps/web` (Next 16.2, 2026-08-21).
 * `fallback: null` is what the content routes carry; `/studio/[[...tool]]`
 * carries a fallback shell path, which is the case that must not be swept up.
 */
const build: RenderingOutput = {
  cacheComponents: true,
  appPathRoutes: {
    '/(site)/[...segments]/page': '/[...segments]',
    '/(site)/insights/[slug]/page': '/insights/[slug]',
    '/(site)/work/[slug]/page': '/work/[slug]',
    '/(site)/page': '/',
    '/studio/[[...tool]]/page': '/studio/[[...tool]]',
  },
  prerender: {
    routes: { '/': { srcRoute: '/' } },
    dynamicRoutes: {
      '/[...segments]': { fallback: null },
      '/insights/[slug]': { fallback: null },
      '/work/[slug]': { fallback: null },
      '/studio/[[...tool]]': { fallback: '/studio/[[...tool]]' },
    },
  },
}

function withFallback(route: string, fallback: unknown): RenderingOutput {
  return {
    ...build,
    prerender: {
      routes: build.prerender.routes,
      dynamicRoutes: { ...build.prerender.dynamicRoutes, [route]: { fallback } },
    },
  }
}

describe('checkCachedNotFound', () => {
  it('passes on a build whose content routes all block', () => {
    expect(checkCachedNotFound(build)).toEqual([])
  })

  it('names the route when one stops answering unknown slugs at all', () => {
    const [problem, ...rest] = checkCachedNotFound(withFallback('/insights/[slug]', false))

    expect(rest).toEqual([])
    expect(problem).toContain('/insights/[slug]')
    expect(problem).toContain('publish')
  })

  it('names the route when one grows a fallback shell instead', () => {
    const [problem, ...rest] = checkCachedNotFound(
      withFallback('/work/[slug]', '/work/[slug].html'),
    )

    expect(rest).toEqual([])
    expect(problem).toContain('/work/[slug]')
  })

  it('leaves the Studio alone — its fallback shell is not a content route', () => {
    expect(checkCachedNotFound(build)).toEqual([])
    expect(checkCachedNotFound(withFallback('/studio/[[...tool]]', false))).toEqual([])
  })

  it('names a declared route the build no longer has', () => {
    const renamed: RenderingOutput = {
      ...build,
      appPathRoutes: Object.fromEntries(
        Object.entries(build.appPathRoutes).filter(([, route]) => route !== '/work/[slug]'),
      ),
    }

    expect(checkCachedNotFound(renamed)).toEqual([
      expect.stringContaining('/work/[slug] is declared'),
    ])
  })

  it('says nothing about a route the rendering assertion already names', () => {
    // No `dynamicRoutes` entry at all is the per-request regression, and
    // `checkRenderingStrategy` reports it with a better message. Two failures
    // for one cause would send the reader to the wrong file.
    const noEntry: RenderingOutput = {
      ...build,
      prerender: {
        routes: build.prerender.routes,
        dynamicRoutes: Object.fromEntries(
          Object.entries(build.prerender.dynamicRoutes).filter(
            ([route]) => route !== '/insights/[slug]',
          ),
        ),
      },
    }

    expect(checkCachedNotFound(noEntry)).toEqual([])
  })
})

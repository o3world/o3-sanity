import { createRequire } from 'node:module'
import { match } from 'path-to-regexp'
import { describe, expect, it } from 'vitest'

import { mainDocumentRoutes } from './presentationRoutes'

/**
 * The smoke test for Presentation's route patterns.
 *
 * Studio 6.8 shipped path-to-regexp 8, which removed the `:name*` modifier.
 * The catch-all route was spelled `/:slug*`, and the new parser does not
 * ignore it — it throws, out of the effect behind `useMainDocument`, taking
 * the entire Presentation tool down on every URL that reached the pattern.
 * Nothing in typecheck, lint, or build sees a route pattern, so the only
 * signal was the tool falling over in the browser.
 *
 * These tests parse the real patterns with the real parser.
 */

const require = createRequire(import.meta.url)

const routes = mainDocumentRoutes.map((resolver) => resolver.route)

describe('Presentation main-document routes', () => {
  /**
   * The guard on the guard. `path-to-regexp` is a devDependency of this app
   * only so this file can reach it, and it is worth nothing once it drifts
   * from the copy `sanity` actually parses with — a Studio bump to
   * path-to-regexp 9 would otherwise leave these tests passing against last
   * year's grammar, which is precisely the failure that got us here.
   *
   * Declared ranges rather than resolved versions: path-to-regexp's `exports`
   * map hides its own `package.json`, and the range is the thing we control.
   */
  it('is pinned to the same path-to-regexp major that Studio bundles', () => {
    // A missing range on either side means the pinning is gone, so read it
    // strictly — silently comparing `undefined` to `undefined` would pass.
    const dep = (pkg: string, field: 'dependencies' | 'devDependencies'): string => {
      const manifest = require(pkg) as Partial<
        Record<typeof field, Record<string, string | undefined>>
      >
      const range = manifest[field]?.['path-to-regexp']
      if (!range) throw new Error(`${pkg} no longer declares path-to-regexp under ${field}`)
      return range
    }

    const major = (spec: string) => spec.replace(/^\D*/, '').split('.')[0]

    expect(major(dep('../../package.json', 'devDependencies'))).toBe(
      major(dep('sanity/package.json', 'dependencies')),
    )
  })

  it.each(routes)('compiles %s', (route) => {
    // The assertion IS that this does not throw — `getRouteContext` re-throws
    // anything `match()` rejects, and that is what breaks the tool.
    expect(() => match(String(route), { decode: decodeURIComponent })).not.toThrow()
  })

  /**
   * Presentation walks the resolvers in order and takes the first match, so
   * these expectations are about the list as a whole, not any one pattern:
   * the catch-all must not shadow the collections above it.
   */
  it.each([
    ['/', '/'],
    ['/work/acme-rebrand', '/work/:slug'],
    ['/insights/hello-world', '/insights/:slug'],
    ['/about', '/*slug'],
    ['/services/ux-audit', '/*slug'],
  ])('resolves %s through %s', (url, expected) => {
    const hit = routes.find((route) => match(String(route), { decode: decodeURIComponent })(url))
    expect(hit).toBe(expected)
  })

  /** The bug's blast radius: a multi-segment page must reach a real filter. */
  it('hands the catch-all its segments as a joinable array', () => {
    const catchAll = mainDocumentRoutes.at(-1)
    const result = match(String(catchAll?.route), { decode: decodeURIComponent })(
      '/services/ux-audit',
    )

    expect(result).not.toBe(false)
    expect(result && result.params).toEqual({ slug: ['services', 'ux-audit'] })

    // ...and the resolver turns those segments back into the stored slug.
    const resolved =
      typeof catchAll?.resolve === 'function'
        ? catchAll.resolve({
            params: (result as { params: Record<string, unknown> }).params,
          } as Parameters<NonNullable<typeof catchAll.resolve>>[0])
        : undefined

    expect(resolved).toMatchObject({ params: { slug: 'services/ux-audit' } })
  })
})

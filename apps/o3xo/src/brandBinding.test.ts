import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'

import { brandConfig, type CollectionType } from '@o3/sanity/brand'

/**
 * What binds this app to its brand, checked where a compiler cannot see it.
 *
 * Three of these fail silently and only in the browser, which is why they are
 * worth a test at all: an app that never receives `NEXT_PUBLIC_BRAND` resolves
 * `o3` and serves the other brand's project with no error anywhere; a missing
 * `data-brand` renders every page in O3's paint; a missing `@source` line makes
 * Tailwind emit nothing for the shared components, which reads as a broken
 * component rather than a missing line. The fourth — a route directory that
 * disagrees with the prefix brand config hands the links — is a 404 on a page
 * whose own canonical points at it.
 *
 * Asserted against `brandConfig('o3xo')` by name rather than the running brand:
 * this suite runs with no `NEXT_PUBLIC_BRAND` set, and a test that read the
 * process's brand would pass by agreeing with the same default the app must not
 * fall back to.
 */
const APP = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(APP, 'src')
const config = brandConfig('o3xo')

function read(path: string): string {
  return readFileSync(join(APP, path), 'utf8')
}

/** Every `.ts`/`.tsx` under `src/`, this test excluded. */
function sourceFiles(dir = SRC): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    if (!/\.tsx?$/.test(path) || path === fileURLToPath(import.meta.url)) return []
    return [path]
  })
}

describe('brand', () => {
  it('is declared in next.config.ts, where dev and build both read it', () => {
    const nextConfig = read('next.config.ts')
    expect(nextConfig).toMatch(/env:\s*\{[^}]*NEXT_PUBLIC_BRAND/s)
    expect(read('brand.ts')).toContain(`'o3xo'`)
  })

  it('is asserted at boot rather than assumed', () => {
    // `src/env.ts` is imported by the root layout for its side effect. An
    // unset brand is a *valid* brand here, so nothing downstream throws.
    expect(read('src/env.ts')).toContain('currentBrand()')
  })
})

describe('tokens', () => {
  const globals = read('src/app/globals.css')

  it('layers the o3xo theme over the base theme, in that order', () => {
    const base = globals.indexOf("@import '@o3/tailwind-config/theme.css'")
    const brand = globals.indexOf("@import '@o3/tailwind-config-o3xo/theme.css'")
    expect(base).toBeGreaterThan(-1)
    expect(brand).toBeGreaterThan(base)
  })

  it.each(['packages/ui', 'packages/content-ui'])('declares %s as a Tailwind source', (pkg) => {
    expect(globals).toContain(`${pkg}/src/**/*.{ts,tsx}`)
  })

  it('sets data-brand on the html element', () => {
    expect(read('src/app/layout.tsx')).toContain('data-brand="o3xo"')
  })
})

describe('collection prefixes', () => {
  const collections = Object.entries(config.collections) as [CollectionType, { prefix: string }][]

  it.each(collections)('%s serves at its brand prefix, and that route exists', (_type, facts) => {
    // `/case-studies` → `src/app/(site)/case-studies`. A prefix nothing routes
    // is a 404 behind every link and canonical built from brand config.
    expect(existsSync(join(SRC, 'app/(site)', facts.prefix, 'page.tsx'))).toBe(true)
  })

  it('writes neither prefix nor collection title as a literal', () => {
    // o3's answers, which a file copied from apps/web brings with it. The
    // titles are what an editor and a visitor read; the prefixes are what every
    // link is built from, and brand config is the only place either belongs.
    const o3 = brandConfig('o3')
    const banned = [
      `'${o3.collections.caseStudy.prefix}'`,
      `"${o3.collections.caseStudy.prefix}"`,
      `'${o3.collections.caseStudy.title}'`,
      `"${o3.collections.caseStudy.title}"`,
    ]
    const offenders = sourceFiles()
      .map((path) => [relative(APP, path), readFileSync(path, 'utf8')] as const)
      .filter(([, source]) => banned.some((literal) => source.includes(literal)))
      .map(([path]) => path)

    expect(offenders).toEqual([])
  })
})

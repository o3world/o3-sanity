import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'

/**
 * The brand ramp seam (#238, ADR 0028).
 *
 * `brand-token-seam.test.ts` next door guards what a shared component may
 * NAME. This one guards what a brand's token package may MOVE, and the two
 * failure modes are opposite:
 *
 *   - A type token re-pointed in a `@theme` block instead of the brand block
 *     lands at `:root` for every brand that loads the file. Storybook loads
 *     both packages, so O3's stories would silently wear O3XO's ramp.
 *   - A breakpoint declared in the brand block instead of `@theme` does
 *     nothing at all. Tailwind compiles `sm:` to a literal media query and no
 *     media query can read a custom property.
 *
 * So the seam is the compiled stylesheet an app ships, and the test compiles
 * it the way the app's `globals.css` does: `apps/web` loads the base theme,
 * `apps/o3xo` loads the base theme and then the overlay.
 */
const PACKAGES = fileURLToPath(new URL('../../', import.meta.url))
const TAILWIND = createRequire(import.meta.url).resolve('tailwindcss/index.css')

const BASE = resolve(PACKAGES, 'tailwind-config/theme.css')
const O3XO = resolve(PACKAGES, 'tailwind-config-o3xo/theme.css')

/** The kit's Typography canvas (`462:833`), desktop and mobile modes. */
const KIT_H1 = { desktop: '60px', mobile: '48px' }

/** The kit's Layouts canvas (`4214:3643`) — Radix widths, min-width based. */
const KIT_BREAKPOINTS = { sm: '520px', xl: '1280px', '2xl': '1640px' }

/**
 * One app's stylesheet, compiled from the theme files it imports and the
 * utilities named. Only the tokens a named utility reaches are emitted, which
 * is exactly the app's own behaviour.
 */
async function build(themes: string[], utilities: string[]): Promise<string> {
  const source = ['@import "tailwindcss";', ...themes.map((file) => `@import "${file}";`)].join(
    '\n',
  )

  const compiler = await compile(source, {
    base: PACKAGES,
    loadStylesheet: async (id: string, from: string) => {
      const path = id === 'tailwindcss' ? TAILWIND : resolve(from, id)
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
    },
  })

  return compiler.build(utilities)
}

/** The block a selector opens, up to its closing brace. */
function block(css: string, selector: string): string {
  const start = css.indexOf(selector)
  if (start === -1) return ''
  const open = css.indexOf('{', start)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i)
  }
  return ''
}

/** `--text-hero: clamp(48px, …, 60px)` → `clamp(48px, …, 60px)`. */
function declared(css: string, property: string): string | undefined {
  return css.match(new RegExp(`(?<![\\w-])${property}\\s*:\\s*([^;}]+)`))?.[1]?.trim()
}

/** The width every `@media` rule in a stylesheet fires at, in source order. */
function mediaWidths(css: string): string[] {
  return [...css.matchAll(/@media\s*\(width >= ([^)]+)\)/g)].map(([, width = '']) => width)
}

describe('the O3XO type ramp', () => {
  it("re-points the display steps to the kit's ramp under the brand attribute", async () => {
    const css = await build([BASE, O3XO], ['text-hero'])
    const brand = block(css, ":root[data-brand='o3xo']")

    const hero = declared(brand, '--text-hero')
    expect(hero).toContain(KIT_H1.mobile)
    expect(hero).toContain(KIT_H1.desktop)
  })

  it('leaves the base theme carrying O3, so a two-brand host still paints two ramps', async () => {
    const css = await build([BASE, O3XO], ['text-hero'])
    const root = block(css, ':root, :host')

    expect(declared(root, '--text-hero')).toContain('64px')
  })
})

describe('the O3XO breakpoints', () => {
  it("fires the responsive variants at the kit's widths", async () => {
    const css = await build([BASE, O3XO], ['sm:px-gutter', 'xl:px-gutter', '2xl:px-gutter'])

    expect(mediaWidths(css)).toEqual([
      KIT_BREAKPOINTS.sm,
      KIT_BREAKPOINTS.xl,
      KIT_BREAKPOINTS['2xl'],
    ])
  })

  it("leaves O3's own stylesheet on Tailwind's scale", async () => {
    const css = await build([BASE], ['sm:px-gutter', 'xl:px-gutter', '2xl:px-gutter'])

    expect(mediaWidths(css)).toEqual(['40rem', '80rem', '96rem'])
  })
})

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

/** O3's #429 product geometry and the retired app's retained kit geometry. */
const O3_LAYOUT = { gutterMobile: '20px', gutterDesktop: '75px', stage: '108rem', half: '54rem' }
const O3XO_LAYOUT = { gutterDesktop: '96px', stage: '78rem', half: '39rem' }

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

/**
 * What a selector declares — every block it opens, in source order.
 *
 * Both halves matter. A brand's declarations are one merged rule only while
 * nothing sits between them, and the light-surface block in `color.css` splits
 * O3XO's into a colour half and a type half. And a selector can sit inside a
 * longer one on either side — `:root[data-brand='o3xo']` is a prefix of
 * `:root[data-brand='o3xo'] [data-surface='white']`, and `[data-surface='white']`
 * is its suffix — so a block is this selector's only when the `{` follows it
 * through whitespace alone AND what precedes it is a rule boundary (start of
 * sheet, `}`, `{`, `;`) or a `,` in a selector list.
 */
function block(css: string, selector: string): string {
  const boundary = (at: number): boolean => {
    let i = at - 1
    while (i >= 0 && /\s/.test(css[i] as string)) i--
    return i < 0 || ['}', '{', ';', ','].includes(css[i] as string)
  }
  let declared = ''
  for (let at = css.indexOf(selector); at !== -1; at = css.indexOf(selector, at + 1)) {
    if (!boundary(at)) continue
    const open = css.indexOf('{', at)
    if (open === -1 || css.slice(at + selector.length, open).trim() !== '') continue

    let depth = 0
    for (let i = open; i < css.length; i++) {
      if (css[i] === '{') depth++
      if (css[i] === '}' && --depth === 0) {
        declared += css.slice(open + 1, i)
        break
      }
    }
  }
  return declared
}

/**
 * `--text-hero: clamp(48px, …, 60px)` → `clamp(48px, …, 60px)`. The LAST
 * declaration wins, because that is what the cascade does with equal
 * specificity — `block` can hand back more than one rule's worth.
 */
function declared(css: string, property: string): string | undefined {
  const matches = [...css.matchAll(new RegExp(`(?<![\\w-])${property}\\s*:\\s*([^;}]+)`, 'g'))]
  return matches.at(-1)?.[1]?.trim()
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

describe('the brand layout seam', () => {
  const layoutUtilities = ['px-gutter', 'px-gutter-tight', 'max-w-section', 'max-w-section-half']

  it('compiles O3 with the 75px edge and 1728px structural stage', async () => {
    const css = await build([BASE], layoutUtilities)
    const root = block(css, ':root, :host')

    expect(declared(root, '--spacing-gutter')).toContain(O3_LAYOUT.gutterMobile)
    expect(declared(root, '--spacing-gutter')).toContain(O3_LAYOUT.gutterDesktop)
    expect(declared(root, '--container-section')).toBe(O3_LAYOUT.stage)
    expect(declared(root, '--container-section-half')).toBe(O3_LAYOUT.half)
  })

  it('keeps the retired O3XO app on its existing explicit geometry override', async () => {
    const css = await build([BASE, O3XO], layoutUtilities)
    const brand = block(css, ":root[data-brand='o3xo']")

    expect(declared(brand, '--spacing-gutter')).toContain(O3XO_LAYOUT.gutterDesktop)
    expect(declared(brand, '--spacing-gutter-tight')).toContain(O3XO_LAYOUT.gutterDesktop)
    expect(declared(brand, '--container-section')).toBe(O3XO_LAYOUT.stage)
    expect(declared(brand, '--container-section-half')).toBe(O3XO_LAYOUT.half)
  })
})

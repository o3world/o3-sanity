import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'

/**
 * The brand ramp seam (#238).
 *
 * `brand-token-seam.test.ts` next door guards what a shared component may
 * NAME. This one guards what the token package ships: the type ramp, the
 * breakpoints and the layout geometry, read off the compiled stylesheet the
 * way `apps/web`'s `globals.css` builds it.
 *
 * A breakpoint has to be declared in `@theme`: Tailwind compiles `sm:` to a
 * literal media query and no media query can read a custom property, so a
 * breakpoint moved anywhere else does nothing at all.
 */
const PACKAGES = fileURLToPath(new URL('../../', import.meta.url))
const TAILWIND = createRequire(import.meta.url).resolve('tailwindcss/index.css')

const BASE = resolve(PACKAGES, 'tailwind-config/theme.css')

/** O3's #429 product geometry. */
const O3_LAYOUT = { gutterMobile: '20px', gutterDesktop: '75px', stage: '108rem', half: '54rem' }

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
 * A selector can sit inside a longer one on either side, so a block is this
 * selector's only when the `{` follows it through whitespace alone AND what
 * precedes it is a rule boundary (start of sheet, `}`, `{`, `;`) or a `,` in a
 * selector list.
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

describe('the type ramp', () => {
  it('carries the display steps in the base theme', async () => {
    const css = await build([BASE], ['text-hero'])
    const root = block(css, ':root, :host')

    expect(declared(root, '--text-hero')).toContain('64px')
  })
})

describe('the breakpoints', () => {
  it("fire on Tailwind's scale", async () => {
    const css = await build([BASE], ['sm:px-gutter', 'xl:px-gutter', '2xl:px-gutter'])

    expect(mediaWidths(css)).toEqual(['40rem', '80rem', '96rem'])
  })
})

describe('the layout geometry', () => {
  const layoutUtilities = ['px-gutter', 'px-gutter-tight', 'max-w-section', 'max-w-section-half']

  it('compiles with the 75px edge and 1728px structural stage', async () => {
    const css = await build([BASE], layoutUtilities)
    const root = block(css, ':root, :host')

    expect(declared(root, '--spacing-gutter')).toContain(O3_LAYOUT.gutterMobile)
    expect(declared(root, '--spacing-gutter')).toContain(O3_LAYOUT.gutterDesktop)
    expect(declared(root, '--container-section')).toBe(O3_LAYOUT.stage)
    expect(declared(root, '--container-section-half')).toBe(O3_LAYOUT.half)
  })
})

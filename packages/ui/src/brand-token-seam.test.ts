import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * The brand token seam (#222, ADR 0028).
 *
 * Each brand has its own token package and the role NAMES are shared: `bg-ink`
 * paints O3's warm black or O3XO's azure depending only on `data-brand`. Where
 * the vocabularies diverge, the role belongs to one brand alone — today that is
 * O3XO's `accent` — and a shared component that names one has quietly become a
 * component only one brand can render.
 *
 * Nothing in CSS stops it. Tailwind compiles `bg-accent` to
 * `var(--color-accent, #ffbe00)` with the declared value baked in as the
 * fallback, so the utility paints yellow under `data-brand="o3"` too, where a
 * missing token would at least have rendered as nothing. That is why this is a
 * filesystem lint and not an arrangement of stylesheets.
 *
 * The vocabulary is DERIVED from the token packages rather than listed here: a
 * role both packages declare is shared the moment it lands, and a role only one
 * declares is forbidden the moment it lands.
 */
const PACKAGES = fileURLToPath(new URL('../../', import.meta.url))

/** After #212's move, these two hold every component both brands render. */
const SHARED_COMPONENTS = ['ui/src', 'content-ui/src']

type BrandTokens = { brand: string; css: string[] }
type Vocabulary = { shared: Set<string>; brandOnly: Map<string, string> }
type Forbidden = { role: string; brand: string; values: string[] }
type Offence = { line: number; role: string; brand: string; text: string }

/**
 * The roles a shared component may not name, each with the colour it paints.
 *
 * A value is harvested only where the whole declaration IS one colour literal:
 * the hexes inside a composite fill are the shapes of a gradient, and #000000
 * lifted out of one would fail every component that draws a black.
 */
function forbiddenRoles(brands: BrandTokens[]): Forbidden[] {
  const all = brands.flatMap(({ css }) => css.flatMap(declarations))
  const { shared, brandOnly } = sharedVocabulary(brands)

  const sharedHexes = new Set(
    all.filter(([role]) => shared.has(role)).flatMap(([, value]) => hexes(value)),
  )

  return [...brandOnly].map(([role, brand]) => ({
    role,
    brand,
    values: [
      ...new Set(
        all
          .filter(([name]) => name === role)
          .flatMap(([, value]) => (isColourLiteral(value) ? hexes(value) : []))
          .filter((hex) => !sharedHexes.has(hex)),
      ),
    ],
  }))
}

/**
 * Where a shared component reaches for a brand-only role. Comments are blanked
 * first — naming the role in prose is how a component explains why it doesn't
 * paint with it.
 */
function offences(source: string, forbidden: Forbidden[]): Offence[] {
  const lines = source.split('\n')
  const code = stripCodeComments(source).split('\n')

  return forbidden.flatMap(({ role, brand, values }) => {
    const patterns = referencePatterns(role, values)
    return code.flatMap((line, i) =>
      patterns.some((pattern) => pattern.test(line))
        ? [{ line: i + 1, role, brand, text: (lines[i] ?? '').trim() }]
        : [],
    )
  })
}

/** `--color-accent` → the role name, `accent`. */
function roleName(role: string): string {
  return role.replace(/^--[a-z]+-/, '')
}

/**
 * Every way a `.ts`/`.tsx`/`.css` file can reach a role: the custom property by
 * name (which covers `var()`, an arbitrary value, and Tailwind's
 * `bg-(image:--role)` form alike), a colour utility built from it, and the raw
 * value pasted in place of the token.
 *
 * The utility prefixes are the shadcn seam's list — the same set of properties
 * Tailwind generates from `--color-*`.
 */
function referencePatterns(role: string, values: string[]): RegExp[] {
  const patterns = [new RegExp(`(?<![\\w-])${role}(?![\\w-])`)]

  if (role.startsWith('--color-')) {
    const utilities =
      'bg|text|border|ring|ring-offset|inset-ring|fill|stroke|from|via|to|outline|divide|shadow|text-shadow|accent|caret|decoration|placeholder'
    patterns.push(new RegExp(`(?<![\\w-])(?:${utilities})-${roleName(role)}(?![\\w-])`))
  }

  for (const value of values) {
    const forms = [value, shorthandHex(value)].filter((form) => form !== null)
    patterns.push(new RegExp(`(?<![\\w#])(?:${forms.join('|')})(?:[0-9a-f]{2})?(?![0-9a-f])`, 'i'))
  }
  return patterns
}

/** `#ffbe00` has no shorthand; `#ffffff` is also written `#fff`. */
function shorthandHex(hex: string): string | null {
  const [, r1, r2, g1, g2, b1, b2] = hex.match(/^#(.)(.)(.)(.)(.)(.)$/) ?? []
  return r1 === r2 && g1 === g2 && b1 === b2 ? `#${r1}${g1}${b1}` : null
}

function hexes(value: string): string[] {
  return [...value.matchAll(/#[0-9a-f]{3,8}\b/gi)].map(([hex]) => hex.toLowerCase())
}

function isColourLiteral(value: string): boolean {
  return /^#[0-9a-f]{3,8}$/i.test(value.trim())
}

/** Every `--custom-property: value` pair a stylesheet declares, in file order. */
function declarations(css: string): [string, string][] {
  const found = stripCssComments(css).matchAll(/(?<![\w-])(--[a-z0-9-]+)\s*:\s*([^;}]*)/gi)
  return [...found].map(({ 1: role = '', 2: value = '' }) => [role.toLowerCase(), value.trim()])
}

/**
 * Blanks comments in a `.ts`/`.tsx` source, keeping the line count. Line-based
 * rather than string-aware on purpose: an apostrophe in JSX prose ("don't")
 * would leave a string scanner mid-string for the rest of the file, and the
 * comments this has to reach are the multi-line doc blocks where a component
 * explains which token it uses and why.
 */
function stripCodeComments(source: string): string {
  let inBlock = false
  return source
    .split('\n')
    .map((line) => {
      let out = line
      if (inBlock) {
        const end = out.indexOf('*/')
        if (end === -1) return ' '.repeat(out.length)
        inBlock = false
        out = ' '.repeat(end + 2) + out.slice(end + 2)
      }
      out = out.replace(/\/\*.*?\*\//g, (block) => ' '.repeat(block.length))
      const open = out.indexOf('/*')
      if (open !== -1) {
        inBlock = true
        out = out.slice(0, open)
      }
      // `(?<!:)` keeps a URL in a string from blanking the rest of its line.
      return out.replace(/(?<!:)\/\/.*$/, '')
    })
    .join('\n')
}

const NOT_SOURCE = new Set(['node_modules', 'dist', '.next', 'storybook-static'])

/**
 * Every source file under a directory. Test files are left out: a test names
 * the tokens it is about, and this one names every role it forbids.
 */
function sourceFiles(dir: string, extensions: string[]): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return NOT_SOURCE.has(entry.name) ? [] : sourceFiles(path, extensions)
    const wanted = extensions.some((ext) => entry.name.endsWith(ext))
    return wanted && !entry.name.includes('.test.') ? [path] : []
  })
}

/**
 * The brands as their token packages define them. `@o3/tailwind-config` is O3's
 * paint and every other brand's foundation, so an overlay package's vocabulary
 * is the base theme's plus whatever it declares itself — which is exactly why a
 * role the base theme alone declares is shared rather than O3-only.
 */
function brandTokenPackages(): BrandTokens[] {
  const base = 'tailwind-config'
  const baseCss = sourceFiles(join(PACKAGES, base), ['.css']).map((file) =>
    readFileSync(file, 'utf8'),
  )

  const overlays = readdirSync(PACKAGES, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${base}-`))
    .map((entry) => ({
      brand: entry.name.slice(base.length + 1),
      css: [
        ...baseCss,
        ...sourceFiles(join(PACKAGES, entry.name), ['.css']).map((file) =>
          readFileSync(file, 'utf8'),
        ),
      ],
    }))

  return [{ brand: 'o3', css: baseCss }, ...overlays]
}

/** Blanks CSS comments, keeping every other character where it was. */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
}

/**
 * The custom properties a stylesheet DECLARES. A property is declared where its
 * name is followed by a colon; `var(--color-ink, #0a0a0b)` reads a role rather
 * than declaring one, and a role a brand only reads is not a role it defines.
 */
function declaredRoles(css: string): Set<string> {
  return new Set(declarations(css).map(([role]) => role))
}

/**
 * Splits the roles the token packages declare into the vocabulary shared
 * components may reach for and the roles that belong to one brand alone.
 */
function sharedVocabulary(brands: BrandTokens[]): Vocabulary {
  const perBrand = brands.map((brand) => ({
    brand: brand.brand,
    roles: new Set(brand.css.flatMap((css) => [...declaredRoles(css)])),
  }))

  const shared = new Set<string>()
  const brandOnly = new Map<string, string>()
  for (const role of new Set(perBrand.flatMap(({ roles }) => [...roles]))) {
    const owners = perBrand.filter(({ roles }) => roles.has(role))
    if (owners.length === perBrand.length) shared.add(role)
    else brandOnly.set(role, owners.map(({ brand }) => brand).join(', '))
  }
  return { shared, brandOnly }
}

describe('the shared token vocabulary', () => {
  it('reads a role from a declaration and not from a reference to one', () => {
    const css = `
      @theme {
        --color-ink: #0a0a0b;
        --color-fg: var(--color-ink, #0a0a0b);
      }
    `
    expect(declaredRoles(css)).toEqual(new Set(['--color-ink', '--color-fg']))
  })

  it('counts a role every brand paints as shared, and a role one brand paints as its own', () => {
    const base = '@theme { --color-ink: #0a0a0b; --color-white: #fff; }'
    const overlay = `
      @theme reference { --color-accent: #ffbe00; }
      :root[data-brand='o3xo'] { --color-ink: #111827; --color-accent: #ffbe00; }
    `

    const vocabulary = sharedVocabulary([
      { brand: 'o3', css: [base] },
      { brand: 'o3xo', css: [base, overlay] },
    ])

    expect(vocabulary.shared).toEqual(new Set(['--color-ink', '--color-white']))
    expect(vocabulary.brandOnly).toEqual(new Map([['--color-accent', 'o3xo']]))
  })
})

describe('reaching for a brand-only role', () => {
  const BRANDS: BrandTokens[] = [
    {
      brand: 'o3',
      css: ['@theme { --color-ink: #0a0a0b; --color-brand: #eb1000; --color-fg-accent: #232323; }'],
    },
    {
      brand: 'o3xo',
      css: [
        '@theme { --color-ink: #0a0a0b; --color-brand: #eb1000; --color-fg-accent: #232323; }',
        `@theme reference { --color-accent: #ffbe00; }
         :root[data-brand='o3xo'] {
           --color-accent: #ffbe00;
           --gradient-xo-plate: linear-gradient(180deg, #ffbe00 0%, #000000 100%);
         }`,
      ],
    },
  ]

  const forbidden = () => forbiddenRoles(BRANDS)

  it('carries the role and the value it paints', () => {
    expect(forbidden()).toEqual([
      { role: '--color-accent', brand: 'o3xo', values: ['#ffbe00'] },
      { role: '--gradient-xo-plate', brand: 'o3xo', values: [] },
    ])
  })

  it.each([
    ['a utility class', '<div className="bg-accent" />'],
    ['an opacity modifier', '<div className="bg-accent/40" />'],
    ['a variant prefix', '<div className="hover:text-accent" />'],
    [
      'a cva variant value',
      "  const v = cva('', { variants: { tone: { warn: 'border-accent' } } })",
    ],
    ['a var() reference', "<div style={{ color: 'var(--color-accent)' }} />"],
    ['an arbitrary value', '<div className="bg-[var(--color-accent)]" />'],
    ['a custom-property class', '<div className="bg-(image:--gradient-xo-plate)" />'],
    ['the raw hex', '<circle fill="#FFBE00" />'],
  ])('is an offence written as %s', (_written, source) => {
    expect(offences(source, forbidden())).toHaveLength(1)
  })

  it.each([
    ['a shared role', '<div className="bg-ink text-fg-accent" />'],
    ['the accent-color utility on a shared role', '<input className="accent-brand" />'],
    ['a shared value', '<circle fill="#EB1000" />'],
    ['a line comment', "// bg-accent is O3XO's alone — never here"],
    [
      'a doc comment',
      ['/**', ' * `--color-accent` is #FFBE00, which shared code may not name.', ' */'].join('\n'),
    ],
  ])('is no offence written as %s', (_written, source) => {
    expect(offences(source, forbidden())).toEqual([])
  })

  it('reports the line, the role and whose it is, so the failure names the fix', () => {
    const source = ['const a = 1', '', 'const tile = "bg-accent p-4"'].join('\n')
    expect(offences(source, forbidden())).toEqual([
      { line: 3, role: '--color-accent', brand: 'o3xo', text: 'const tile = "bg-accent p-4"' },
    ])
  })
})

describe('the shared components', () => {
  const brands = brandTokenPackages()
  const vocabulary = sharedVocabulary(brands)
  const forbidden = forbiddenRoles(brands)

  it('are checked against every brand that has a token package', () => {
    expect(brands.length).toBeGreaterThan(1)
  })

  /**
   * A broken parse would empty both sets and pass everything, so the derivation
   * is asserted against what the packages say today: the surfaces every brand
   * paints are shared, and O3XO's `accent` is the one divergence. A role that
   * becomes shared belongs in the first list, not out of the second.
   */
  it('may reach for the roles every brand paints', () => {
    expect([...vocabulary.shared]).toEqual(
      expect.arrayContaining(['--color-ink', '--color-bone', '--color-white', '--color-fg']),
    )
  })

  it('may not reach for a role one brand paints alone', () => {
    expect(forbidden).toContainEqual({ role: '--color-accent', brand: 'o3xo', values: ['#ffbe00'] })
  })

  it.each(SHARED_COMPONENTS)('never lets a brand-only role reach %s', (root) => {
    const files = sourceFiles(join(PACKAGES, root), ['.ts', '.tsx', '.css'])
    expect(files.length).toBeGreaterThan(0)

    const found = files.flatMap((file) =>
      offences(readFileSync(file, 'utf8'), forbidden).map(
        ({ line, role, brand, text }) =>
          `${relative(PACKAGES, file)}:${line} — ${role} is ${brand}'s alone — ${text}`,
      ),
    )

    expect(
      found,
      `A shared component may only name roles every brand's token package defines (ADR 0028).\n` +
        `A brand-only role paints its own brand's value under every brand, so this renders wrong rather than not at all:\n  ${found.join('\n  ')}`,
    ).toEqual([])
  })
})

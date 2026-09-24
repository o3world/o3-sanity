import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * The brand token seam (#222).
 *
 * A shared component may only name a token role `@o3/tailwind-config`
 * declares. Nothing in CSS stops the other kind: Tailwind compiles an
 * undeclared `var(--color-x)` to nothing at all, and a role pasted from
 * another design system (shadcn's `--color-background`, a kit's
 * `--color-accent`) renders as a transparent fill rather than an error. That is
 * why this is a filesystem lint and not an arrangement of stylesheets.
 *
 * The vocabulary is DERIVED from the token package rather than listed here: a
 * role is usable the moment it is declared there.
 */
const PACKAGES = fileURLToPath(new URL('../../', import.meta.url))

/** These two hold every shared component. */
const SHARED_COMPONENTS = ['ui/src', 'content-ui/src']

/** The token namespaces a role lives in. Tailwind's own (`--spacing`, `--tw-*`) are not roles. */
const ROLE = /(?<![\w-])--(?:color|gradient)-[a-z0-9-]+(?![\w-])/gi

type Offence = { line: number; role: string; text: string }

/** Every `--custom-property: value` pair a stylesheet declares, in file order. */
function declarations(css: string): [string, string][] {
  const found = stripCssComments(css).matchAll(/(?<![\w-])(--[a-z0-9-]+)\s*:\s*([^;}]*)/gi)
  return [...found].map(({ 1: role = '', 2: value = '' }) => [role.toLowerCase(), value.trim()])
}

/**
 * The custom properties a stylesheet DECLARES. A property is declared where its
 * name is followed by a colon; `var(--color-ink, #0a0a0b)` reads a role rather
 * than declaring one.
 */
function declaredRoles(css: string): Set<string> {
  return new Set(declarations(css).map(([role]) => role))
}

/** Blanks CSS comments, keeping every other character where it was. */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
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

/**
 * Where a shared source reaches for a role the token package does not declare.
 * Comments are blanked first — naming a role in prose is how a component
 * explains why it doesn't paint with it. A role the file declares itself (a
 * scoped custom property set inline) counts as declared.
 */
function offences(source: string, declared: Set<string>): Offence[] {
  const lines = source.split('\n')
  const code = stripCodeComments(source)
  // A key in a style object is quoted, so the colon may follow a quote.
  const local = new Set(
    [...code.matchAll(/(?<![\w-])(--[a-z0-9-]+)['"]?\s*:/gi)].map(([, role = '']) =>
      role.toLowerCase(),
    ),
  )
  return code.split('\n').flatMap((line, i) =>
    [...line.matchAll(ROLE)]
      .map(([role]) => role.toLowerCase())
      .filter((role) => !declared.has(role) && !local.has(role))
      .map((role) => ({ line: i + 1, role, text: (lines[i] ?? '').trim() })),
  )
}

const NOT_SOURCE = new Set(['node_modules', 'dist', '.next', 'storybook-static'])

/**
 * Every source file under a directory. Test files are left out: a test names
 * the tokens it is about, and this one names roles it forbids.
 */
function sourceFiles(dir: string, extensions: string[]): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return NOT_SOURCE.has(entry.name) ? [] : sourceFiles(path, extensions)
    const wanted = extensions.some((ext) => entry.name.endsWith(ext))
    return wanted && !entry.name.includes('.test.') ? [path] : []
  })
}

/** Every role the token package declares. */
function tokenRoles(): Set<string> {
  return new Set(
    sourceFiles(join(PACKAGES, 'tailwind-config'), ['.css']).flatMap((file) => [
      ...declaredRoles(readFileSync(file, 'utf8')),
    ]),
  )
}

describe('the token vocabulary', () => {
  it('reads a role from a declaration and not from a reference to one', () => {
    const css = `
      @theme {
        --color-ink: #0a0a0b;
        --color-fg: var(--color-ink, #0a0a0b);
      }
    `
    expect(declaredRoles(css)).toEqual(new Set(['--color-ink', '--color-fg']))
  })

  /**
   * A broken parse would empty the set and fail everything, or a broken scan
   * would pass everything; this pins what the package says today.
   */
  it('carries the surfaces the site paints', () => {
    expect([...tokenRoles()]).toEqual(
      expect.arrayContaining(['--color-ink', '--color-bone', '--color-white', '--color-fg']),
    )
  })
})

describe('reaching for an undeclared role', () => {
  const declared = new Set(['--color-ink', '--color-brand', '--gradient-card-scrim'])

  it.each([
    ['a var() reference', "<div style={{ color: 'var(--color-accent)' }} />"],
    ['an arbitrary value', '<div className="bg-[var(--color-accent)]" />'],
    ['a custom-property class', '<div className="bg-(image:--gradient-plate)" />'],
  ])('is an offence written as %s', (_written, source) => {
    expect(offences(source, declared)).toHaveLength(1)
  })

  it.each([
    ['a declared role', "<div style={{ color: 'var(--color-ink)' }} />"],
    ['a declared gradient', '<div className="bg-(image:--gradient-card-scrim)" />'],
    ['a line comment', '// --color-accent is not ours — never here'],
    ['a doc comment', ['/**', ' * `--color-accent` is not declared here.', ' */'].join('\n')],
    [
      'a role the file declares itself',
      "const s = { '--color-local': '#fff' }\nvar(--color-local)",
    ],
  ])('is no offence written as %s', (_written, source) => {
    expect(offences(source, declared)).toEqual([])
  })

  it('reports the line and the role, so the failure names the fix', () => {
    const source = ['const a = 1', '', 'const tile = "bg-[var(--color-accent)] p-4"'].join('\n')
    expect(offences(source, declared)).toEqual([
      { line: 3, role: '--color-accent', text: 'const tile = "bg-[var(--color-accent)] p-4"' },
    ])
  })
})

describe('the shared components', () => {
  const declared = tokenRoles()

  it.each(SHARED_COMPONENTS)('name only roles the token package declares in %s', (root) => {
    const files = sourceFiles(join(PACKAGES, root), ['.ts', '.tsx', '.css'])
    expect(files.length).toBeGreaterThan(0)

    const found = files.flatMap((file) =>
      offences(readFileSync(file, 'utf8'), declared).map(
        ({ line, role, text }) => `${relative(PACKAGES, file)}:${line} — ${role} — ${text}`,
      ),
    )

    expect(
      found,
      `A shared component may only name roles @o3/tailwind-config declares.\n` +
        `An undeclared role renders as nothing:\n  ${found.join('\n  ')}`,
    ).toEqual([])
  })
})

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  colorVocabulary,
  dependencyViolations,
  importViolations,
  missingPaths,
  parseImports,
  partitionPermitted,
  resolveSpecifier,
  staleImpurities,
  tokenOffences,
  uncoveredDirs,
  verdictOf,
  type Roster,
  type WorkspacePackage,
} from './purity'

/**
 * The engine-purity seam (#287). `data/roster.json` is the one declaration of
 * the engine/product boundary (#285); this suite is its enforcement. The pure
 * functions are unit-tested on synthetic input first, then run against the
 * real repo.
 */
const REPO = fileURLToPath(new URL('../../../', import.meta.url))

/** The three roots the workspace globs cover; every subdirectory needs a row. */
const ROSTER_ROOTS = ['apps', 'packages', 'tools']

function roster(): Roster {
  return JSON.parse(
    readFileSync(fileURLToPath(new URL('../data/roster.json', import.meta.url)), 'utf8'),
  ) as Roster
}

function rosterDirs(): string[] {
  return ROSTER_ROOTS.flatMap((root) =>
    readdirSync(join(REPO, root), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => `${root}/${entry.name}`),
  )
}

describe('the closed roster', () => {
  it('reports a directory the roster does not name', () => {
    const declared: Roster = { rows: [{ path: 'packages/a', verdict: 'engine', why: '' }] }
    expect(uncoveredDirs(declared, ['packages/a', 'packages/b'])).toEqual(['packages/b'])
  })

  it('reports a row or override whose path is gone from disk', () => {
    const declared: Roster = {
      rows: [
        {
          path: 'packages/a',
          verdict: 'product-shared',
          why: '',
          overrides: [{ path: 'src/gone.ts', verdict: 'engine', why: '' }],
        },
        { path: 'packages/vanished', verdict: 'engine', why: '' },
      ],
    }
    const onDisk = new Set(['packages/a'])
    expect(missingPaths(declared, (path) => onDisk.has(path))).toEqual([
      'packages/a/src/gone.ts',
      'packages/vanished',
    ])
  })
})

describe('a file’s verdict', () => {
  const declared: Roster = {
    rows: [
      { path: 'packages/machine', verdict: 'engine', why: '' },
      {
        path: 'packages/model',
        verdict: 'product-shared',
        why: '',
        overrides: [{ path: 'src/pure.ts', verdict: 'engine', why: '' }],
      },
      {
        path: 'tools/pipeline',
        verdict: 'product-shared',
        why: '',
        overrides: [{ path: 'src/core', verdict: 'engine', why: '' }],
      },
    ],
  }

  it('is the workspace row’s by default', () => {
    expect(verdictOf(declared, 'packages/machine/src/anything.ts')).toBe('engine')
    expect(verdictOf(declared, 'packages/model/src/schema.ts')).toBe('product-shared')
  })

  it('is the override’s for a path the override names, file or directory', () => {
    expect(verdictOf(declared, 'packages/model/src/pure.ts')).toBe('engine')
    expect(verdictOf(declared, 'tools/pipeline/src/core/state.ts')).toBe('engine')
  })

  it('does not let one path prefix another’s name', () => {
    expect(verdictOf(declared, 'packages/model/src/pure.test.ts')).toBe('product-shared')
    expect(verdictOf(declared, 'tools/pipeline/src/core-adjacent.ts')).toBe('product-shared')
  })

  it('is null outside every row', () => {
    expect(verdictOf(declared, 'scripts/dev.sh')).toBeNull()
  })
})

describe('reading a module’s imports', () => {
  it('collects every static, re-export, dynamic and require specifier', () => {
    const source = [
      "import { a } from '@o3/sanity/image'",
      'import type { B } from "./types"',
      "import 'side-effect'",
      "export { c } from '../lib/c'",
      "export * from './figma'",
      "const d = await import('dynamic-one')",
      "const e = require('required-one')",
    ].join('\n')
    expect(parseImports(source)).toEqual([
      '@o3/sanity/image',
      './types',
      'side-effect',
      '../lib/c',
      './figma',
      'dynamic-one',
      'required-one',
    ])
  })

  it('does not read an import out of a comment', () => {
    const source = [
      "// import { a } from '@o3/sanity'",
      '/**',
      " * import { b } from '@o3/sanity'",
      ' */',
      "import { c } from 'real'",
    ].join('\n')
    expect(parseImports(source)).toEqual(['real'])
  })
})

describe('resolving a specifier to a repo path', () => {
  const packages: WorkspacePackage[] = [
    {
      name: '@o3/sanity',
      dir: 'packages/sanity',
      exports: { './image': './src/image.ts', './constants': './src/constants.ts' },
      dependencies: [],
    },
    {
      name: '@o3/ui',
      dir: 'packages/ui',
      exports: {
        '.': './src/index.ts',
        './lib/utils': './src/lib/utils.ts',
        './components/*': './src/components/*',
      },
      dependencies: [],
    },
  ]
  const files = new Set([
    'packages/sanity/src/image.ts',
    'packages/ui/src/index.ts',
    'packages/ui/src/lib/utils.ts',
    'packages/ui/src/components/reveal.tsx',
    'tools/migration/src/core/state.ts',
    'tools/migration/src/lib/paths.ts',
  ])
  const resolve = (from: string, specifier: string) =>
    resolveSpecifier(from, specifier, packages, files)

  it('follows a workspace package’s exports map, exact and wildcard', () => {
    const from = 'packages/content-ui/src/SanityImage.tsx'
    expect(resolve(from, '@o3/sanity/image')).toBe('packages/sanity/src/image.ts')
    expect(resolve(from, '@o3/ui/lib/utils')).toBe('packages/ui/src/lib/utils.ts')
    expect(resolve(from, '@o3/ui/components/reveal')).toBe('packages/ui/src/components/reveal.tsx')
    expect(resolve(from, '@o3/ui')).toBe('packages/ui/src/index.ts')
  })

  it('lands an unmapped subpath on the package, so the workspace verdict still applies', () => {
    expect(resolve('apps/web/src/a.ts', '@o3/sanity/not-mapped')).toBe('packages/sanity')
  })

  it('resolves a relative specifier against the importing file, guessing extensions', () => {
    expect(resolve('tools/migration/src/core/plan.ts', './state')).toBe(
      'tools/migration/src/core/state.ts',
    )
    expect(resolve('tools/migration/src/core/read.ts', '../lib/paths')).toBe(
      'tools/migration/src/lib/paths.ts',
    )
  })

  it('is null for node builtins and npm packages', () => {
    expect(resolve('packages/ui/src/index.ts', 'node:fs')).toBeNull()
    expect(resolve('packages/ui/src/index.ts', 'react')).toBeNull()
    expect(resolve('packages/ui/src/index.ts', 'tailwind-merge')).toBeNull()
  })
})

describe('engine purity over the import graph', () => {
  const declared: Roster = {
    rows: [
      {
        path: 'packages/machine',
        verdict: 'engine',
        why: '',
        overrides: [{ path: 'src/fixtures.ts', verdict: 'product-shared', why: '' }],
        impurities: [
          { where: 'src/leaky.ts (KNOWN)', what: 'A known leak.', fix: 'Parameterize.' },
        ],
      },
      { path: 'packages/model', verdict: 'product-shared', why: '' },
      { path: 'apps/site', verdict: 'product-brand', why: '' },
    ],
  }
  const packages: WorkspacePackage[] = [
    { name: '@o3/machine', dir: 'packages/machine', exports: {}, dependencies: ['@o3/model'] },
    {
      name: '@o3/model',
      dir: 'packages/model',
      exports: { '.': './src/index.ts' },
      dependencies: [],
    },
    { name: '@o3/site', dir: 'apps/site', exports: {}, dependencies: [] },
  ]

  const violations = (sources: Record<string, string>) =>
    importViolations(declared, new Map(Object.entries(sources)), packages)

  it('flags an engine file importing a product package, app code, or a product sibling', () => {
    const found = violations({
      'packages/machine/src/leaky.ts': "import { m } from '@o3/model'",
      'packages/machine/src/app-reach.ts': "import { r } from '../../../apps/site/src/route'",
      'packages/machine/src/barrel.ts': "export { f } from './fixtures'",
      'packages/model/src/index.ts': '',
      'packages/machine/src/fixtures.ts': '',
      'apps/site/src/route.ts': '',
    })
    expect(found).toEqual([
      {
        file: 'packages/machine/src/app-reach.ts',
        specifier: '../../../apps/site/src/route',
        target: 'apps/site/src/route.ts',
        targetVerdict: 'product-brand',
      },
      {
        file: 'packages/machine/src/barrel.ts',
        specifier: './fixtures',
        target: 'packages/machine/src/fixtures.ts',
        targetVerdict: 'product-shared',
      },
      {
        file: 'packages/machine/src/leaky.ts',
        specifier: '@o3/model',
        target: 'packages/model/src/index.ts',
        targetVerdict: 'product-shared',
      },
    ])
  })

  it('lets engine import engine, product import anything, and anyone import npm', () => {
    const found = violations({
      'packages/machine/src/a.ts': "import { b } from './b'\nimport { z } from 'zod'",
      'packages/machine/src/b.ts': '',
      'packages/machine/src/fixtures.ts': "import { m } from '@o3/model'",
      'packages/model/src/uses-machine.ts': "import { a } from '@o3/machine'",
      'packages/model/src/index.ts': '',
    })
    expect(found).toEqual([])
  })

  it('permits a violation in a file the row’s impurity ledger names, and no other', () => {
    const found = violations({
      'packages/machine/src/leaky.ts': "import { m } from '@o3/model'",
      'packages/machine/src/fresh.ts': "import { m } from '@o3/model'",
      'packages/model/src/index.ts': '',
    })
    const { permitted, unpermitted } = partitionPermitted(declared, found)
    expect(permitted.map((violation) => violation.file)).toEqual(['packages/machine/src/leaky.ts'])
    expect(unpermitted.map((violation) => violation.file)).toEqual([
      'packages/machine/src/fresh.ts',
    ])
  })
})

const NOT_SOURCE = new Set(['node_modules', 'dist', '.next', 'storybook-static', '.turbo'])

/**
 * Every runtime source file under a directory. Tests and stories stay out on
 * both sides of the check: they are not what extraction would take, and the
 * suite's own fixtures import product code on purpose.
 */
function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return NOT_SOURCE.has(entry.name) ? [] : sourceFiles(path)
    const wanted = ['.ts', '.tsx', '.mts'].some((ext) => entry.name.endsWith(ext))
    return wanted && !/\.(test\.|stories\.)/.test(entry.name) ? [path] : []
  })
}

function sourceCss(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return NOT_SOURCE.has(entry.name) ? [] : sourceCss(path)
    return entry.name.endsWith('.css') ? [readFileSync(path, 'utf8')] : []
  })
}

function repoSources(): Map<string, string> {
  return new Map(
    ROSTER_ROOTS.flatMap((root) => sourceFiles(join(REPO, root))).map((file) => [
      file.slice(REPO.length).replaceAll('\\', '/'),
      readFileSync(file, 'utf8'),
    ]),
  )
}

/** exports values can be strings or condition objects; the resolver wants strings. */
function exportTargets(exports: unknown): Record<string, string> {
  if (typeof exports === 'string') return { '.': exports }
  if (typeof exports !== 'object' || exports === null) return {}
  return Object.fromEntries(
    Object.entries(exports).flatMap(([key, value]): [string, string][] => {
      if (typeof value === 'string') return [[key, value]]
      if (typeof value === 'object' && value !== null) {
        const conditions = value as Record<string, unknown>
        const target = [conditions['default'], conditions['import'], conditions['require']].find(
          (candidate) => typeof candidate === 'string',
        )
        return typeof target === 'string' ? [[key, target]] : []
      }
      return []
    }),
  )
}

function workspacePackages(): WorkspacePackage[] {
  return ROSTER_ROOTS.flatMap((root) =>
    readdirSync(join(REPO, root), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .flatMap((entry) => {
        const manifest = join(REPO, root, entry.name, 'package.json')
        if (!existsSync(manifest)) return []
        const parsed = JSON.parse(readFileSync(manifest, 'utf8')) as {
          name?: string
          exports?: unknown
          dependencies?: Record<string, string>
        }
        if (!parsed.name) return []
        return [
          {
            name: parsed.name,
            dir: `${root}/${entry.name}`,
            exports: exportTargets(parsed.exports),
            dependencies: Object.keys(parsed.dependencies ?? {}),
          },
        ]
      }),
  )
}

describe('engine purity against the repo', () => {
  const declared = roster()
  const sources = repoSources()
  const packages = workspacePackages()

  const imports = partitionPermitted(declared, importViolations(declared, sources, packages))
  const dependencies = partitionPermitted(declared, dependencyViolations(declared, packages))

  const vocabulary = colorVocabulary(
    ['tailwind-config', 'tailwind-config-o3xo'].flatMap((pkg) =>
      sourceCss(join(REPO, 'packages', pkg)),
    ),
  )
  const tokens = partitionPermitted(
    declared,
    [...sources]
      .filter(([file]) => verdictOf(declared, file) === 'engine')
      .flatMap(([file, source]) =>
        tokenOffences(source, vocabulary).map((offence) => ({ ...offence, file })),
      ),
  )

  /**
   * A broken parse or resolver would empty both lists and pass everything, so
   * the run is pinned to a leak the ledger is known to carry: content-runtime
   * imports the product content model, and burning that down is #285's map,
   * not a regression.
   */
  it('still sees the leaks the ledger carries', () => {
    expect(vocabulary.colorRoles.size).toBeGreaterThan(10)
    expect(imports.permitted.map(({ file, specifier }) => `${file} ← ${specifier}`)).toContain(
      'packages/content-runtime/src/siteSettings.ts ← @o3/sanity/queries',
    )
  })

  it('lets no engine file import product code beyond the impurity ledger', () => {
    const found = imports.unpermitted.map(
      ({ file, specifier, target, targetVerdict }) =>
        `${file} ← ${specifier} (${target} is ${targetVerdict})`,
    )
    expect(
      found,
      `An engine module imports product code the roster's impurity ledger does not list.\n` +
        `Either the boundary moved (fix the import: brand facts and content-model types arrive as parameters)\n` +
        `or a known leak is missing its ledger entry in tools/engine-seam/data/roster.json:\n  ${found.join('\n  ')}`,
    ).toEqual([])
  })

  it('lets no engine workspace depend on a product workspace beyond the ledger', () => {
    const found = dependencies.unpermitted.map(({ file, specifier }) => `${file} ← ${specifier}`)
    expect(
      found,
      `An engine workspace's manifest declares a product workspace as a runtime dependency,\n` +
        `and no ledger entry in tools/engine-seam/data/roster.json names it:\n  ${found.join('\n  ')}`,
    ).toEqual([])
  })

  it('lets no engine file name the brand token vocabulary beyond the ledger', () => {
    const found = tokens.unpermitted.map(({ file, line, token }) => `${file}:${line} — ${token}`)
    expect(
      found,
      `An engine module names a brand token — a brand fact baked in rather than arriving as a parameter —\n` +
        `and no ledger entry in tools/engine-seam/data/roster.json names the file:\n  ${found.join('\n  ')}`,
    ).toEqual([])
  })

  it('carries no ledger entry whose leak is gone', () => {
    const permittedFiles = new Set(
      [...imports.permitted, ...dependencies.permitted, ...tokens.permitted].map(
        (violation) => violation.file,
      ),
    )
    const stale = staleImpurities(declared, permittedFiles, (path) => {
      const file = join(REPO, path)
      return existsSync(file) ? readFileSync(file, 'utf8') : null
    })
    expect(
      stale,
      `A fixed leak must leave the ledger, or the allowance outlives the debt:\n  ${stale.join('\n  ')}`,
    ).toEqual([])
  })
})

describe('engine purity over declared dependencies', () => {
  const declared: Roster = {
    rows: [
      {
        path: 'packages/machine',
        verdict: 'engine',
        why: '',
        impurities: [
          {
            where: 'package.json (@o3/model dependency)',
            what: 'The known runtime dependency.',
            fix: 'Goes when the imports become parameters.',
          },
        ],
      },
      { path: 'packages/other-machine', verdict: 'engine', why: '' },
      { path: 'packages/model', verdict: 'product-shared', why: '' },
    ],
  }
  const packages = (deps: Record<string, string[]>): WorkspacePackage[] =>
    Object.entries({ ...deps, '@o3/model': [] }).map(([name, dependencies]) => ({
      name,
      dir: `packages/${name.slice('@o3/'.length)}`,
      exports: {},
      dependencies,
    }))

  it('flags an engine workspace depending on a product workspace at runtime', () => {
    const found = dependencyViolations(declared, packages({ '@o3/other-machine': ['@o3/model'] }))
    expect(found).toEqual([
      {
        file: 'packages/other-machine/package.json',
        specifier: '@o3/model',
        target: 'packages/model',
        targetVerdict: 'product-shared',
      },
    ])
  })

  it('permits the dependency only where a ledger entry names package.json and the package', () => {
    const found = dependencyViolations(
      declared,
      packages({ '@o3/machine': ['@o3/model'], '@o3/other-machine': ['@o3/model'] }),
    )
    const { permitted, unpermitted } = partitionPermitted(declared, found)
    expect(permitted.map((violation) => violation.file)).toEqual(['packages/machine/package.json'])
    expect(unpermitted.map((violation) => violation.file)).toEqual([
      'packages/other-machine/package.json',
    ])
  })

  it('does not permit a second product dependency through the same entry', () => {
    const extended: Roster = {
      rows: [...declared.rows, { path: 'packages/model-two', verdict: 'product-shared', why: '' }],
    }
    const found = dependencyViolations(extended, [
      ...packages({ '@o3/machine': ['@o3/model', '@o3/model-two'] }),
      { name: '@o3/model-two', dir: 'packages/model-two', exports: {}, dependencies: [] },
    ])
    const { unpermitted } = partitionPermitted(extended, found)
    expect(unpermitted.map((violation) => violation.specifier)).toEqual(['@o3/model-two'])
  })
})

describe('brand facts in engine code', () => {
  const vocabulary = () =>
    colorVocabulary([
      '@theme { --color-ink: #0a0a0b; --color-bone: #f5f1ea; --color-white: #ffffff; --color-black: #000000; }',
      ":root[data-brand='o3xo'] { --color-accent: #ffbe00; --gradient-xo-plate: linear-gradient(180deg, #ffbe00 0%, #000000 100%); }",
    ])

  it.each([
    ['a colour utility class', '<div className="bg-ink px-2" />'],
    ['a variant-prefixed utility', '<div className="hover:text-bone" />'],
    ['the custom property by name', "const s = { color: 'var(--color-accent)' }"],
    ['a gradient property class', '<div className="bg-(image:--gradient-xo-plate)" />'],
    ['a declared hex pasted in place of the token', '<circle fill="#F5F1EA" />'],
  ])('is an offence written as %s', (_written, source) => {
    expect(tokenOffences(source, vocabulary())).toHaveLength(1)
  })

  it.each([
    ['a class outside the vocabulary', '<div className="bg-white/15 text-black shadow-md" />'],
    ['plain white and black hexes', '<stop stopColor="#ffffff" /><stop stopColor="#000" />'],
    ['a comment naming a role', '// bg-ink is what the product paints here'],
    ['a bare word that is also a role name', "const surface = 'ink'"],
  ])('is no offence written as %s', (_written, source) => {
    expect(tokenOffences(source, vocabulary())).toEqual([])
  })

  it('names the line and the token, so the failure reads as the fix', () => {
    const source = ['const a = 1', "const chip = 'bg-ink text-on-ink'"].join('\n')
    expect(tokenOffences(source, vocabulary()).map(({ line, token }) => ({ line, token }))).toEqual(
      [{ line: 2, token: 'bg-ink' }],
    )
  })
})

describe('the ledger burns down', () => {
  const rowWith = (impurity: { where: string; what: string; fix: string }): Roster => ({
    rows: [{ path: 'packages/machine', verdict: 'engine', why: '', impurities: [impurity] }],
  })
  const entry = { where: 'src/leaky.ts (KNOWN_CONSTANT)', what: '', fix: '' }
  const read = (files: Record<string, string>) => (path: string) =>
    path in files ? (files[path] ?? null) : null

  it('marks an entry stale when the file it names is gone', () => {
    const stale = staleImpurities(rowWith(entry), new Set(), read({}))
    expect(stale).toHaveLength(1)
    expect(stale[0]).toContain('src/leaky.ts')
  })

  it('marks an entry stale when it permits nothing and its leak is not in the file', () => {
    const sources = { 'packages/machine/src/leaky.ts': 'export const clean = 1' }
    expect(staleImpurities(rowWith(entry), new Set(), read(sources))).toHaveLength(1)
  })

  it('keeps an entry the scanners cannot see while its leak is still in the file', () => {
    const sources = { 'packages/machine/src/leaky.ts': 'export const KNOBBED = KNOBBED_CONSTANT' }
    const wildcard = { ...entry, where: 'src/leaky.ts (KNOB* names)' }
    expect(staleImpurities(rowWith(wildcard), new Set(), read(sources))).toEqual([])
  })

  it('keeps an entry that still permits a violation', () => {
    const sources = { 'packages/machine/src/leaky.ts': 'export const clean = 1' }
    const permitted = new Set(['packages/machine/src/leaky.ts'])
    expect(staleImpurities(rowWith(entry), permitted, read(sources))).toEqual([])
  })
})

describe('the roster against the repo', () => {
  it('names every directory under the workspace roots', () => {
    const uncovered = uncoveredDirs(roster(), rosterDirs())
    expect(
      uncovered,
      `Every directory under ${ROSTER_ROOTS.join('/, ')}/ needs a roster row (tools/engine-seam/data/roster.json) — the roster is closed:\n  ${uncovered.join('\n  ')}`,
    ).toEqual([])
  })

  it('names no path that is gone from disk', () => {
    const missing = missingPaths(roster(), (path) => existsSync(join(REPO, path)))
    expect(
      missing,
      `A roster row or override points at a path that no longer exists — update the roster:\n  ${missing.join('\n  ')}`,
    ).toEqual([])
  })
})

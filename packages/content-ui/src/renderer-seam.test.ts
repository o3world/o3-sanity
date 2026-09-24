import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { BASE_BLOCKS, SECTION_BLOCKS } from '@o3/sanity/schemas/registry'

import { CARD_TYPES } from './cards/card-registry'

/**
 * The renderer seam: every type is drawn exactly once, either in the shared
 * library (`@o3/content-ui`) or in the app (`apps/web`), never in both.
 *
 * A renderer in both places is a fork: the app binds one and the other rots
 * unseen. A renderer in neither is a type nothing draws. The binding tables'
 * `satisfies` clauses catch a missing binding; this catches the file that
 * still sits in one tree after its twin moved to the other.
 *
 * A renderer is located by SEARCHING for the file that exports it, not by a
 * path convention.
 */
const REPO = fileURLToPath(new URL('../../../', import.meta.url))

const TREES = ['packages/content-ui/src', 'apps/web/src'] as const

type Tier = 'card' | 'base' | 'section'

const TIER_ROSTER: Readonly<Record<Tier, readonly string[]>> = {
  card: CARD_TYPES,
  base: BASE_BLOCKS,
  section: SECTION_BLOCKS,
}

const pascal = (type: string): string => type.charAt(0).toUpperCase() + type.slice(1)

/**
 * What a tier's renderer for a type is called. The card tier suffixes the
 * document type (`caseStudy` → `CaseStudyCard`); the block tiers already carry
 * their suffix in the type name (`statGroup` → `StatGroup`).
 */
const RENDERER_NAME: Readonly<Record<Tier, (type: string) => string>> = {
  card: (type) => `${pascal(type)}Card`,
  base: pascal,
  section: pascal,
}

const IGNORED_DIRS = new Set(['node_modules', '.next', '.turbo', 'dist', 'storybook-static'])

function sourceFiles(dir: string): string[] {
  return readdirSync(join(REPO, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) return IGNORED_DIRS.has(entry.name) ? [] : sourceFiles(path)
    if (!/\.tsx?$/.test(entry.name)) return []
    // A story mounts a renderer and a test asserts about one; neither draws it.
    if (/\.(stories|test|render\.test)\.tsx?$/.test(entry.name)) return []
    return [path]
  })
}

/**
 * The files under `root` that export a component of this name.
 *
 * Two forms count: the declaration exported in place, and a local declaration
 * listed in an `export { … }`. A re-export carries `from` and does not, so a
 * barrel cannot stand in for the renderer it points at.
 */
function filesExporting(root: string, name: string): string[] {
  const declared = new RegExp(`^export (?:default )?(?:function|const|class) ${name}\\b`, 'm')
  const listed = new RegExp(`^export \\{[^}]*\\b${name}\\b[^}]*\\}(?!\\s*from)`, 'm')
  return sourceFiles(root).filter((path) => {
    const source = readFileSync(join(REPO, path), 'utf8')
    return declared.test(source) || listed.test(source)
  })
}

const renderers = (Object.keys(TIER_ROSTER) as Tier[]).flatMap((tier) =>
  TIER_ROSTER[tier].map((type) => ({ tier, type, name: RENDERER_NAME[tier](type) })),
)

describe('every renderer', () => {
  it.each(renderers)('$tier/$type is drawn exactly once', ({ name }) => {
    const found = TREES.flatMap((tree) => filesExporting(tree, name))
    expect(
      found,
      `${name} must be exported by exactly one file across ${TREES.join(' and ')}; found ${found.length}.`,
    ).toHaveLength(1)
  })
})

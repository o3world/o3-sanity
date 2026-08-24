import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { BRANDS, type Brand } from '@o3/sanity/brand'
import {
  APP_FIRST_RENDERERS,
  BASE_BLOCKS,
  CORE_SECTION_BLOCKS,
  type RendererTier,
} from '@o3/sanity/schemas/registry'

import { CARD_TYPES } from './cards/card-registry'

/**
 * The app-first seam (#286, #295).
 *
 * `APP_FIRST_RENDERERS` records which shared shapes each app draws for itself.
 * The record is only a claim; this is what makes it true on disk, and it reads
 * both ways:
 *
 * - a **listed** type has no renderer left in `@o3/content-ui` and exactly one
 *   in each app — half a demotion fails, in either direction;
 * - an **unlisted** type has its shared renderer and no app-local one — a fork
 *   nobody recorded fails too.
 *
 * The type system carries the other half of the seam: each tier's shared table
 * is `Record<Exclude<roster, demoted>, …>` and each app's is
 * `Record<demoted, …>`, so adding an entry stops compiling until every app
 * binds it. This test covers what a table cannot see — the file still sitting
 * in the shared library, and the app that has a binding but no drawing.
 *
 * A renderer is located by SEARCHING for the file that exports it, not by a
 * path convention: the two apps lay their content out differently and this
 * seam has no business flattening that.
 */
const REPO = fileURLToPath(new URL('../../../', import.meta.url))

/** Where each brand's app lives — the one thing the record cannot derive. */
const APP_DIRS: Readonly<Record<Brand, string>> = {
  o3: 'apps/web',
  o3xo: 'apps/o3xo',
}

const SHARED_SRC = 'packages/content-ui/src'

/**
 * Every type a tier can draw. The section tier is the CORE list: a brand-only
 * block (`faqSection`) has one app renderer by definition and is not a
 * demotion of anything.
 */
const TIER_ROSTER: Readonly<Record<RendererTier, readonly string[]>> = {
  card: CARD_TYPES,
  base: BASE_BLOCKS,
  section: CORE_SECTION_BLOCKS,
}

const pascal = (type: string): string => type.charAt(0).toUpperCase() + type.slice(1)

/**
 * What a tier's renderer for a type is called. The card tier suffixes the
 * document type (`caseStudy` → `CaseStudyCard`); the block tiers already carry
 * their suffix in the type name (`statGroup` → `StatGroup`).
 */
const RENDERER_NAME: Readonly<Record<RendererTier, (type: string) => string>> = {
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

/** The files under `root` that export a component of this name. */
function filesExporting(root: string, name: string): string[] {
  const declared = new RegExp(`^export (?:default )?(?:function|const) ${name}\\b`, 'm')
  return sourceFiles(root).filter((path) => declared.test(readFileSync(join(REPO, path), 'utf8')))
}

type Renderer = { tier: RendererTier; type: string; name: string }

const demoted: Renderer[] = APP_FIRST_RENDERERS.map(({ tier, type }) => ({
  tier,
  type,
  name: RENDERER_NAME[tier](type),
}))

const shared: Renderer[] = (Object.keys(TIER_ROSTER) as RendererTier[]).flatMap((tier) =>
  TIER_ROSTER[tier]
    .filter((type) => !demoted.some((entry) => entry.tier === tier && entry.type === type))
    .map((type) => ({ tier, type, name: RENDERER_NAME[tier](type) })),
)

describe('a type the record demotes', () => {
  it.each(demoted)('$tier/$type has no renderer left in the shared library', ({ name }) => {
    const lingering = filesExporting(SHARED_SRC, name)
    expect(
      lingering,
      `APP_FIRST_RENDERERS lists this type, so the shared library may not draw it. Delete:\n  ${lingering.join('\n  ')}`,
    ).toEqual([])
  })

  it.each(demoted.flatMap((renderer) => BRANDS.map((brand) => ({ ...renderer, brand }))))(
    '$tier/$type is drawn once in $brand',
    ({ name, brand }) => {
      const found = filesExporting(APP_DIRS[brand], name)
      expect(
        found,
        `A demotion is symmetric: ${APP_DIRS[brand]} needs exactly one ${name}, and has ${found.length}.`,
      ).toHaveLength(1)
    },
  )
})

describe('a type the record leaves shared', () => {
  it.each(shared)('$tier/$type is drawn in the shared library', ({ name }) => {
    expect(filesExporting(SHARED_SRC, name).length, `No shared ${name}.`).toBeGreaterThan(0)
  })

  it.each(shared.flatMap((renderer) => BRANDS.map((brand) => ({ ...renderer, brand }))))(
    '$tier/$type is not forked into $brand',
    ({ name, brand, type, tier }) => {
      const forked = filesExporting(APP_DIRS[brand], name)
      expect(
        forked,
        `${APP_DIRS[brand]} draws its own ${name} while the shared one stands. Either re-point the binding at the shared renderer, or record the demotion in APP_FIRST_RENDERERS (tier '${tier}', type '${type}') and move the other app's too.`,
      ).toEqual([])
    },
  )
})

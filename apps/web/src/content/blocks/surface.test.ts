import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { BLOCK_KNOBS } from '@o3/sanity/knobs'
import { describe, expect, it } from 'vitest'

import { resolveSurface } from './surface'

/** The `initialValue` a block's own `surface` knob declares, or undefined. */
function declaredSurface(type: string): unknown {
  return BLOCK_KNOBS[type]?.knobs.find((knob) => knob.name === 'surface')?.initialValue
}

describe('resolveSurface', () => {
  it('takes the surface the editor chose', () => {
    expect(resolveSurface('white', 'quoteSection')).toBe('white')
    expect(resolveSurface('bone', 'quoteSection')).toBe('bone')
    expect(resolveSurface('ink', 'quoteSection')).toBe('ink')
  })

  it('falls back to the surface the block declares', () => {
    // A document saved before the field existed, and a value no knob lists.
    expect(resolveSurface(undefined, 'quoteSection')).toBe('bone')
    expect(resolveSurface(null, 'featureGridSection')).toBe('white')
    expect(resolveSurface('charcoal', 'heroSection')).toBe('ink')
  })

  it('answers with what the block declared, for every block that declares one', () => {
    // Skipping the blocks with no `surface` knob rather than demanding one:
    // `surfaceForKnobPath` routes the knob to the `band` surface, so a nested
    // block drops it, and `BLOCK_KNOBS` is keyed for every tier.
    const declaring = Object.keys(BLOCK_KNOBS).filter((type) => declaredSurface(type) !== undefined)
    expect(declaring.length).toBeGreaterThan(0)
    for (const type of declaring) {
      expect(resolveSurface(undefined, type as 'quoteSection')).toBe(declaredSurface(type))
    }
  })
})

/**
 * THE HALF THE SIGNATURE CANNOT CHECK. Deriving the fallback moved the literal
 * at each call site from a colour to a block name, so a stale one no longer
 * paints a colour nobody declared — but a renderer scaffolded by copying its
 * neighbour still typechecks while answering for the block it was copied from.
 * The block name is the directory the renderer sits in, so the two are checked
 * against each other here rather than left to a reader.
 */
const SECTION_DIR = join(import.meta.dirname, 'section')
const CALL = /resolveSurface\([^,)]+,\s*'([^']+)'\)/g

const callSites = readdirSync(SECTION_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) =>
    readdirSync(join(SECTION_DIR, entry.name))
      .filter((file) => file.endsWith('.tsx'))
      .flatMap((file) =>
        [...readFileSync(join(SECTION_DIR, entry.name, file), 'utf8').matchAll(CALL)].map(
          (match) => ({ block: entry.name, named: match[1]!, file: `${entry.name}/${file}` }),
        ),
      ),
  )

describe('every section renderer', () => {
  it('names its own block at each call site', () => {
    expect(callSites.length).toBeGreaterThan(0)
    for (const { block, named, file } of callSites) {
      expect(named, `${file} resolves its surface as ${named}`).toBe(block)
      expect(declaredSurface(named), `${named} declares no surface knob`).toBeDefined()
    }
  })
})

/**
 * THE OTHER HALF OF DECLARING A SURFACE. `SurfaceProvider` answers the question
 * for React — which fill a button resolves Auto to — and `data-surface` answers
 * it for CSS, which is what re-points the text-role tokens on a dark band
 * (tokens/color.css). Declaring only the first is the failure that shipped
 * #232323 body copy onto ink: the button was readable and the paragraph above
 * it was not.
 *
 * So the two are checked as one act. Scanned from source rather than rendered,
 * because the point is that no file declares half of it — which is a fact about
 * every call site at once, not about any one component's output.
 */
const SURFACE_ROOTS = [
  join(import.meta.dirname, '..', '..'),
  join(import.meta.dirname, '..', '..', '..', '..', '..', 'packages', 'ui', 'src'),
]

/**
 * `SiteNav` is the one surface that changes without React knowing: `NavInk`
 * toggles `data-ink` on the header and the pill flips to light copy in CSS, so
 * a static `data-surface` would repaint the flipped pill's `text-fg` white on
 * white. The file says so where a reader will look for it.
 */
const FLIPS_IN_CSS = ['SiteNav.tsx']

function tsxFilesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : tsxFilesUnder(path)
    return entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.includes('.test.')
      ? [path]
      : []
  })
}

describe('everything that declares a surface', () => {
  it('declares it to CSS as well as to React', () => {
    const declaring = SURFACE_ROOTS.flatMap(tsxFilesUnder)
      .map((path) => ({ path, source: readFileSync(path, 'utf8') }))
      .filter(({ source }) => source.includes('<SurfaceProvider'))
      .filter(({ path }) => !FLIPS_IN_CSS.some((name) => path.endsWith(name)))

    expect(declaring.length).toBeGreaterThan(0)
    for (const { path, source } of declaring) {
      expect(
        source.includes('surfaceAttrs(') || source.includes('data-surface'),
        `${path} renders a SurfaceProvider but no data-surface — its copy will not invert`,
      ).toBe(true)
    }
  })
})

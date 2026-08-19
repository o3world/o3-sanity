import { describe, expect, it } from 'vitest'

import { brandArg } from './brandArg'

/**
 * The brand is a parameter of every pipeline command, not an ambient fact.
 *
 * It used to be neither: `sanity.cli.ts` resolved the project through
 * `currentBrand()`, so `load` wrote to O3XO only when `NEXT_PUBLIC_BRAND`
 * happened to be exported in that shell. A command that deletes and rewrites
 * every unlocked document in a dataset cannot pick the dataset by accident.
 */
describe('brandArg', () => {
  const noEnv = {}

  it('reads the brand off the command line', () => {
    expect(brandArg(['node', 'load.ts', '--brand', 'o3xo'], noEnv)).toBe('o3xo')
  })

  it('ignores the `--` separator sanity exec leaves in the parent process argv', () => {
    expect(
      brandArg(['node', 'sanity', 'exec', 'src/load.ts', '--', '--brand', 'o3xo'], noEnv),
    ).toBe('o3xo')
  })

  it('falls back to the brand the environment names, so an app-shaped run still works', () => {
    expect(brandArg(['node', 'load.ts'], { NEXT_PUBLIC_BRAND: 'o3xo' })).toBe('o3xo')
  })

  // o3's contract: `pnpm --filter @o3/migration load` with no flag and no
  // variable is what every session and every doc has run for six months.
  it('resolves o3 when nothing names a brand', () => {
    expect(brandArg(['node', 'load.ts'], noEnv)).toBe('o3')
  })

  it('lets the flag win over the environment, so a shell cannot override the command', () => {
    expect(brandArg(['node', 'load.ts', '--brand', 'o3'], { NEXT_PUBLIC_BRAND: 'o3xo' })).toBe('o3')
  })

  // Falling back would point the run at the other brand's project — and `xo`,
  // the bare form ADR 0028 forbids, is the typo most likely to be made.
  it('refuses a name no brand has, rather than falling back', () => {
    expect(() => brandArg(['node', 'load.ts', '--brand', 'xo'], noEnv)).toThrow(/not a brand/)
  })

  it('refuses a bare --brand with no name after it', () => {
    expect(() => brandArg(['node', 'load.ts', '--brand'], noEnv)).toThrow(/--brand/)
  })
})

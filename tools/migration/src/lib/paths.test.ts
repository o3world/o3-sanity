import { basename, dirname } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CONVERTED_DIR, EXTRACT_DIR, dataRoot } from './paths'

/**
 * Each brand's committed corpus has its own tree (ADR 0003: the JSON is the
 * source of truth, so two brands' JSON cannot share one directory). The trees
 * are chosen by the run's `--brand`, which is what lets one `convert` and one
 * `load` serve both.
 */
describe('the corpus tree', () => {
  it('gives each brand its own root', () => {
    expect(basename(dataRoot('o3'))).toBe('data')
    expect(basename(dataRoot('o3xo'))).toBe('data-o3xo')
  })

  it('keeps both roots inside the migration tool', () => {
    expect(basename(dirname(dataRoot('o3')))).toBe('migration')
    expect(basename(dirname(dataRoot('o3xo')))).toBe('migration')
  })

  // Nested would be worse than separate: `data/o3xo/` makes o3's root contain
  // O3XO's, so anything that walks o3's corpus silently walks both.
  it('never nests one brand’s root inside another’s', () => {
    expect(dataRoot('o3xo').startsWith(dataRoot('o3') + '/')).toBe(false)
  })

  // Under vitest nothing passes `--brand`, so the constants every WordPress
  // mapper and corpus test reads have to resolve to o3's tree — the behaviour
  // they have asserted against since the pipeline was written.
  it('resolves the exported constants to o3’s tree when no brand is named', () => {
    expect(dirname(EXTRACT_DIR)).toBe(dataRoot('o3'))
    expect(dirname(CONVERTED_DIR)).toBe(dataRoot('o3'))
  })
})

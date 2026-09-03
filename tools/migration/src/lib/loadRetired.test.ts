import { describe, expect, it } from 'vitest'

import { loadRetired } from './loadRetired'

/**
 * The retirement is a rule about the OPERATION, not about a dataset, so the
 * test that matters is the one proving no argument reaches past it.
 */
describe('the blanket load’s retirement', () => {
  it('refuses o3 outright', () => {
    expect(loadRetired('o3')).toContain('REFUSED')
  })

  it('names what to do instead, not just what it will not do', () => {
    const refusal = loadRetired('o3') ?? ''
    // A refusal that ends at "no" sends the next session looking for the flag.
    expect(refusal).toContain('targeted migration')
    expect(refusal).toContain('src/migrations/')
    // The commands that still work, so the retirement does not read wider
    // than it is.
    expect(refusal).toContain('dataset:drift')
    expect(refusal).toContain('dataset:sync')
  })

  it('offers no escape flag, because there is none', () => {
    // `--allow-production` guarded a dataset. This guards the operation, and a
    // flag would put back exactly what the retirement removes.
    expect(loadRetired('o3')).not.toContain('--allow')
  })

  it('leaves o3xo alone — its dataset holds nothing but this pipeline’s output', () => {
    expect(loadRetired('o3xo')).toBeNull()
  })
})

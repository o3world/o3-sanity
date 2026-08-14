import { describe, expect, it } from 'vitest'

import { DEFAULT_KNOB_SURFACE, SURFACE_RULES, surfaceForKnobPath } from './surfaces'
import type { SurfaceRule } from './types'

describe('surfaceForKnobPath', () => {
  it('falls back to the default surface for an unlisted path', () => {
    expect(surfaceForKnobPath('variant', [])).toBe(DEFAULT_KNOB_SURFACE)
  })

  it('matches a path against its own prefix rule', () => {
    const rules: readonly SurfaceRule[] = [{ prefix: 'panel', surface: 'item' }]
    expect(surfaceForKnobPath('panel', rules)).toBe('item')
    expect(surfaceForKnobPath('panel.style', rules)).toBe('item')
  })

  it('lets the longest matching prefix win regardless of rule order', () => {
    // `panel.columns` counts panels the block lays out, so the block owns it
    // even though every other `panel.*` axis rides with the item.
    const rules: readonly SurfaceRule[] = [
      { prefix: 'panel', surface: 'item' },
      { prefix: 'panel.columns', surface: 'block' },
    ]
    expect(surfaceForKnobPath('panel.columns', rules)).toBe('block')
    expect(surfaceForKnobPath('panel.style', rules)).toBe('item')

    const reversed = [...rules].reverse()
    expect(surfaceForKnobPath('panel.columns', reversed)).toBe('block')
    expect(surfaceForKnobPath('panel.style', reversed)).toBe('item')
  })

  it('matches on segment boundaries, so a longer sibling name is not a child', () => {
    const rules: readonly SurfaceRule[] = [{ prefix: 'surface', surface: 'band' }]
    expect(surfaceForKnobPath('surface', rules)).toBe('band')
    expect(surfaceForKnobPath('surfaceOverride', rules)).toBe(DEFAULT_KNOB_SURFACE)
  })

  it('puts the injected surface field on the band by default', () => {
    // The one rule the shipped table carries: `surface` configures the band
    // the block occupies, not the block, which is why a nested block drops it.
    expect(surfaceForKnobPath('surface', SURFACE_RULES)).toBe('band')
    expect(surfaceForKnobPath('variant', SURFACE_RULES)).toBe('block')
  })
})

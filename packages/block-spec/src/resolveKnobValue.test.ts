import { describe, expect, it } from 'vitest'

import { knob } from './knob'
import { resolveKnobValue, UNRESOLVED_KNOB_TITLE } from './resolveKnobValue'
import type { Knob } from './types'

const layout = knob({
  name: 'layout',
  title: 'Layout',
  options: ['rail', 'cards'],
  initialValue: 'rail',
})

describe('resolveKnobValue', () => {
  it('resolves a stored value that names an option', () => {
    expect(resolveKnobValue(layout, 'cards')).toEqual({
      value: 'cards',
      title: 'Cards',
      isDefault: false,
    })
  })

  it('falls back to the declared default when the value is unset', () => {
    expect(resolveKnobValue(layout, undefined)).toEqual({
      value: 'rail',
      title: 'Rail',
      isDefault: true,
    })
  })

  it('falls back to the declared default when the stored value left the option set', () => {
    // A knob that dropped an option still has documents carrying it. The
    // control shows what the block actually renders, not the orphan.
    expect(resolveKnobValue(layout, 'columns')).toEqual({
      value: 'rail',
      title: 'Rail',
      isDefault: true,
    })
  })

  it('returns a literal fallback with no value when there is no default either', () => {
    const bare = knob({ name: 'decoration', title: 'Decoration', options: ['molecule'] })
    expect(resolveKnobValue(bare, undefined)).toEqual({
      value: undefined,
      title: UNRESOLVED_KNOB_TITLE,
      isDefault: true,
    })
  })

  it('returns the literal fallback when a hand-built default names no option', () => {
    // `knob()` rejects this, so it can only arrive from a hand-built or
    // deserialised Knob — the branch stays because the function must be total.
    const forged: Knob = { ...layout, initialValue: 'gone' }
    expect(resolveKnobValue(forged, undefined)).toEqual({
      value: undefined,
      title: UNRESOLVED_KNOB_TITLE,
      isDefault: true,
    })
  })

  it('reads a stored number against its string option', () => {
    const columns = knob({ name: 'columns', title: 'Columns', options: ['1', '2', '3'] })
    expect(resolveKnobValue(columns, 2)).toEqual({ value: '2', title: '2', isDefault: false })
  })

  it('renders unset and explicitly-default the same, and marks only the difference', () => {
    const chosen = resolveKnobValue(layout, 'rail')
    const inherited = resolveKnobValue(layout, undefined)
    expect(chosen.title).toBe(inherited.title)
    expect(chosen.value).toBe(inherited.value)
    expect([chosen.isDefault, inherited.isDefault]).toEqual([false, true])
  })
})

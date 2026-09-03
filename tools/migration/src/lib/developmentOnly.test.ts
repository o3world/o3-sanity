import { describe, expect, it } from 'vitest'

import { developmentOnly } from './developmentOnly'

describe('the development-only guard', () => {
  it('lets development through', () => {
    expect(developmentOnly('development')).toBeNull()
  })

  it('refuses production', () => {
    expect(developmentOnly('production')).toContain('REFUSED')
  })

  it('refuses an unset dataset rather than assuming one', () => {
    // An unset dataset resolves to `development` in code (brand.ts), but a
    // guard that trusts that resolution is one indirection away from being
    // wrong. It has to see the name.
    expect(developmentOnly(undefined)).toContain('REFUSED')
  })

  it('offers no escape flag, and says how to move the checkout instead', () => {
    const refusal = developmentOnly('production') ?? ''
    expect(refusal).not.toContain('--allow')
    expect(refusal).toContain('pnpm dataset development')
  })
})

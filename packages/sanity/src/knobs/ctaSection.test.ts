import { expect, it } from 'vitest'
import { ctaSectionKnobs } from './ctaSection'
it('offers the current gradient CTA without obsolete decorations', () => {
  expect(ctaSectionKnobs.knobs).toEqual([])
  expect(ctaSectionKnobs.paintsOwnSurface).toBe('ink')
})

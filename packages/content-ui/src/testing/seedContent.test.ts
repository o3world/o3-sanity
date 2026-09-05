import { expect, it } from 'vitest'

import { seededPage, seededSectionArgs } from './seedContent'

it('carries the approved About introduction heading into both page and band fixtures only', () => {
  const about = seededPage('about')
  expect(about.sections?.find((section) => section._key === 'why')).toMatchObject({
    _type: 'layoutSection',
    headingLevel: 'xl',
    heading: 'Built to go end to end — on purpose.',
    subheading: undefined,
  })
  expect(seededSectionArgs('about', 'layoutSection').headingLevel).toBe('xl')
  expect(
    seededSectionArgs('solutions-software-engineering', 'layoutSection').headingLevel,
  ).not.toBe('xl')
})

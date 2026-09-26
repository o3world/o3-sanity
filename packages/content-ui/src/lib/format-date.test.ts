import { expect, it } from 'vitest'

import { formatLongDate } from './format-date'

it('formats the published UTC date and omits missing or invalid dates', () => {
  expect(formatLongDate('2026-07-16T00:30:00Z')).toBe('July 16, 2026')
  expect(formatLongDate(null)).toBeNull()
  expect(formatLongDate('')).toBeNull()
  expect(formatLongDate('invalid')).toBeNull()
})

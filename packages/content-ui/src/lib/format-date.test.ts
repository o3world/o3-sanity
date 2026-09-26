import { expect, it } from 'vitest'
import { formatLongDate } from './format-date'

it('formats the full publication day in UTC and omits invalid dates', () => {
  expect(formatLongDate('2026-07-16T00:30:00Z')).toBe('July 16, 2026')
  expect(formatLongDate('2026-06-04T00:30:00Z')).toBe('June 4, 2026')
  expect(formatLongDate(null)).toBeNull()
  expect(formatLongDate('')).toBeNull()
  expect(formatLongDate('invalid')).toBeNull()
})

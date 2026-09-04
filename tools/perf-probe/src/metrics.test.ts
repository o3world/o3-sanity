import { describe, expect, it } from 'vitest'

import { cumulativeLayoutShift, loadMetrics, totalBlockingTime, type LoadSnapshot } from './metrics'

describe('cumulativeLayoutShift', () => {
  it('uses the largest session window rather than a lifetime sum', () => {
    expect(
      cumulativeLayoutShift([
        { startTime: 100, value: 0.04, hadRecentInput: false },
        { startTime: 800, value: 0.03, hadRecentInput: false },
        { startTime: 2_000, value: 0.05, hadRecentInput: false },
        { startTime: 2_100, value: 1, hadRecentInput: true },
      ]),
    ).toBeCloseTo(0.07)
  })
})

describe('loadMetrics', () => {
  const snapshot: LoadSnapshot = {
    now: 6_000,
    lcp: 500,
    fcp: 100,
    shifts: [],
    longTasks: [{ startTime: 200, duration: 100 }],
    resources: [],
    errors: [],
  }

  it('sums blocking time from FCP to the start of the first TTI quiet window', () => {
    expect(loadMetrics(snapshot)).toEqual({ lcp: 500, cls: 0, tbt: 50 })
  })

  it('fails rather than treating an unavailable observer as a stable zero', () => {
    expect(() => loadMetrics({ ...snapshot, errors: ['event: unsupported'] })).toThrow(
      'performance observer failure',
    )
  })
})

describe('totalBlockingTime', () => {
  it('counts the blocking interval left by a long task that crosses FCP', () => {
    expect(totalBlockingTime([{ startTime: 0, duration: 100 }], 75, 200)).toBe(25)
  })

  it('clips a long task blocking interval where it crosses TTI', () => {
    expect(totalBlockingTime([{ startTime: 100, duration: 100 }], 0, 175)).toBe(25)
  })
})

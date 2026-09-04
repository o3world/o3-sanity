import { describe, expect, it } from 'vitest'

import { ROUTES, type RouteSamples } from './config'
import { formatReport, stable } from './report'

const rows: RouteSamples[] = ROUTES.map((route, index) => ({
  route,
  samples: [
    { lcp: 800 + index * 100, cls: 0.01, inp: 64, tbt: 30 },
    { lcp: 850 + index * 100, cls: 0.015, inp: 72, tbt: 40 },
  ],
}))

describe('performance report', () => {
  it('prints both samples for the fixed routes and the applied measurement profile', () => {
    const report = formatReport(rows, 'http://127.0.0.1:3000')

    expect(report).toContain('4x CPU')
    expect(report).toContain('1.6 Mbps down')
    expect(report).toContain('TBT spans FCP to a 5s TTI quiet window')
    expect(report).toMatch(
      /Route\s+LCP ms \(1 \/ 2\)\s+CLS \(1 \/ 2\)\s+INP ms \(1 \/ 2\)\s+TBT ms \(1 \/ 2\)/,
    )
    for (const route of ROUTES) expect(report).toContain(route)
    expect(report).toContain('Stable routes: 4/4')
  })

  it('rejects samples outside any metric tolerance', () => {
    const unstable: RouteSamples = {
      route: '/',
      samples: [
        { lcp: 800, cls: 0.01, inp: 64, tbt: 30 },
        { lcp: 1_300, cls: 0.01, inp: 64, tbt: 30 },
      ],
    }

    expect(stable(unstable)).toBe(false)
    expect(formatReport([unstable], 'http://127.0.0.1:3000')).toContain('Stable routes: 0/1')
  })
})

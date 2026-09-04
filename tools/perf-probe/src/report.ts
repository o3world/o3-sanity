import { THROTTLE, TTI_QUIET_WINDOW_MS, type Metrics, type RouteSamples } from './config'

interface Tolerance {
  absolute: number
  relative: number
}

export const TOLERANCES: Record<keyof Metrics, Tolerance> = {
  lcp: { absolute: 250, relative: 0.2 },
  cls: { absolute: 0.02, relative: 0 },
  inp: { absolute: 40, relative: 0.3 },
  tbt: { absolute: 100, relative: 0.3 },
}

function agrees(first: number, second: number, tolerance: Tolerance): boolean {
  const allowance = Math.max(tolerance.absolute, Math.max(first, second) * tolerance.relative)
  return Math.abs(first - second) <= allowance
}

export function stable(row: RouteSamples): boolean {
  const [first, second] = row.samples
  return (Object.keys(TOLERANCES) as (keyof Metrics)[]).every((metric) =>
    agrees(first[metric], second[metric], TOLERANCES[metric]),
  )
}

const rounded = (value: number) => String(Math.round(value))
const cls = (value: number) => value.toFixed(3)

function pair(first: number, second: number, format = rounded): string {
  return `${format(first)} / ${format(second)}`
}

export function formatReport(rows: readonly RouteSamples[], baseUrl: string): string {
  const columns = [
    {
      heading: 'Route',
      values: rows.map((row) => row.route),
    },
    {
      heading: 'LCP ms (1 / 2)',
      values: rows.map((row) => pair(row.samples[0].lcp, row.samples[1].lcp)),
    },
    {
      heading: 'CLS (1 / 2)',
      values: rows.map((row) => pair(row.samples[0].cls, row.samples[1].cls, cls)),
    },
    {
      heading: 'INP ms (1 / 2)',
      values: rows.map((row) => pair(row.samples[0].inp, row.samples[1].inp)),
    },
    {
      heading: 'TBT ms (1 / 2)',
      values: rows.map((row) => pair(row.samples[0].tbt, row.samples[1].tbt)),
    },
    {
      heading: 'Stable',
      values: rows.map((row) => (stable(row) ? 'yes' : 'no')),
    },
  ]
  const widths = columns.map((column) =>
    Math.max(column.heading.length, ...column.values.map((value) => value.length)),
  )
  const line = (values: readonly string[]) =>
    values.map((value, index) => value.padEnd(widths[index] ?? value.length)).join('  ')
  const stableCount = rows.filter(stable).length
  const megabits = (bits: number) => `${bits / 1_000_000} Mbps`
  const tolerance = (name: keyof Metrics, unit: string) => {
    const value = TOLERANCES[name]
    const relative = value.relative === 0 ? '±' : `±${value.relative * 100}% or `
    return `${name.toUpperCase()} ${relative}${value.absolute}${unit}`
  }

  return [
    'O3 performance probe',
    `Target: ${baseUrl}`,
    `Throttle: mobile ${THROTTLE.viewport.width}x${THROTTLE.viewport.height}, ` +
      `${THROTTLE.cpuRate}x CPU, ${THROTTLE.latencyMs} ms latency, ` +
      `${megabits(THROTTLE.downloadBitsPerSecond)} down, ` +
      `${THROTTLE.uploadBitsPerSecond / 1_000} Kbps up`,
    `Samples: two consecutive cold loads per route; TBT spans FCP to a ` +
      `${TTI_QUIET_WINDOW_MS / 1_000}s TTI quiet window; INP opens the mobile menu`,
    '',
    line(columns.map((column) => column.heading)),
    line(widths.map((width) => '-'.repeat(width))),
    ...rows.map((row, rowIndex) => line(columns.map((column) => column.values[rowIndex] ?? ''))),
    '',
    `Stability tolerance: ${tolerance('lcp', ' ms')}; ${tolerance('cls', '')}; ` +
      `${tolerance('inp', ' ms')}; ${tolerance('tbt', ' ms')}.`,
    `Stable routes: ${stableCount}/${rows.length}`,
  ].join('\n')
}

import { TTI_QUIET_WINDOW_MS, type Metrics } from './config'

export interface TimedDuration {
  startTime: number
  duration: number
}

export interface ResourceInterval {
  startTime: number
  endTime: number
}

export interface LayoutShift {
  startTime: number
  value: number
  hadRecentInput: boolean
}

export interface LoadSnapshot {
  now: number
  lcp: number
  fcp: number
  shifts: LayoutShift[]
  longTasks: TimedDuration[]
  resources: ResourceInterval[]
  errors: string[]
}

export function cumulativeLayoutShift(shifts: readonly LayoutShift[]): number {
  let maximum = 0
  let windowValue = 0
  let windowStart = -1
  let lastShift = -1

  for (const shift of shifts) {
    if (shift.hadRecentInput) continue
    const startsWindow =
      windowStart < 0 ||
      shift.startTime - lastShift > 1_000 ||
      shift.startTime - windowStart > 5_000
    if (startsWindow) {
      windowStart = shift.startTime
      windowValue = shift.value
    } else {
      windowValue += shift.value
    }
    lastShift = shift.startTime
    maximum = Math.max(maximum, windowValue)
  }

  return maximum
}

function mainThreadQuiet(tasks: readonly TimedDuration[], start: number, end: number): boolean {
  return tasks.every((task) => task.startTime >= end || task.startTime + task.duration <= start)
}

function networkQuiet(resources: readonly ResourceInterval[], start: number, end: number): boolean {
  const events: { at: number; change: 1 | -1 }[] = []
  for (const resource of resources) {
    if (resource.startTime >= end || resource.endTime <= start) continue
    events.push({ at: Math.max(start, resource.startTime), change: 1 })
    events.push({ at: Math.min(end, resource.endTime), change: -1 })
  }
  events.sort((first, second) => first.at - second.at || first.change - second.change)

  let active = 0
  for (const event of events) {
    active += event.change
    if (active > 2) return false
  }
  return true
}

export function timeToInteractive(snapshot: LoadSnapshot): number | null {
  const candidates = [
    snapshot.fcp,
    ...snapshot.longTasks.map((task) => task.startTime + task.duration),
    ...snapshot.resources.map((resource) => resource.endTime),
  ]
    .filter(
      (candidate) => candidate >= snapshot.fcp && candidate + TTI_QUIET_WINDOW_MS <= snapshot.now,
    )
    .sort((first, second) => first - second)

  return (
    candidates.find((candidate) => {
      const end = candidate + TTI_QUIET_WINDOW_MS
      return (
        mainThreadQuiet(snapshot.longTasks, candidate, end) &&
        networkQuiet(snapshot.resources, candidate, end)
      )
    }) ?? null
  )
}

export function totalBlockingTime(
  tasks: readonly TimedDuration[],
  fcp: number,
  tti: number,
): number {
  return tasks.reduce((total, task) => {
    const blockingStart = task.startTime + 50
    const blockingEnd = task.startTime + task.duration
    const overlapStart = Math.max(fcp, blockingStart)
    const overlapEnd = Math.min(tti, blockingEnd)
    return total + Math.max(0, overlapEnd - overlapStart)
  }, 0)
}

export function loadMetrics(snapshot: LoadSnapshot): Omit<Metrics, 'inp'> | null {
  if (snapshot.errors.length > 0) {
    throw new Error(`performance observer failure: ${snapshot.errors.join(', ')}`)
  }
  if (snapshot.lcp <= 0) throw new Error('LCP produced no browser entry')
  if (snapshot.fcp <= 0) throw new Error('FCP produced no browser entry for the TBT boundary')

  const tti = timeToInteractive(snapshot)
  if (tti === null) return null

  return {
    lcp: snapshot.lcp,
    cls: cumulativeLayoutShift(snapshot.shifts),
    tbt: totalBlockingTime(snapshot.longTasks, snapshot.fcp, tti),
  }
}

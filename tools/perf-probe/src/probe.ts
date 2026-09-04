import { chromium, type Browser, type Page } from 'playwright'

import { ROUTES, THROTTLE, TTI_QUIET_WINDOW_MS, type Metrics, type RouteSamples } from './config'
import { loadMetrics, type LoadSnapshot } from './metrics'

declare global {
  interface Window {
    __o3PerformanceProbe?: {
      lcp: number
      fcp: number
      shifts: { startTime: number; value: number; hadRecentInput: boolean }[]
      longTasks: { startTime: number; duration: number }[]
      interactions: Record<string, number>
      observers: PerformanceObserver[]
      errors: string[]
    }
  }
}

/*
 * Source text is deliberate. Playwright serializes a function passed to
 * `addInitScript`; tsx decorates nested functions with a module-scoped helper,
 * which does not exist in the page and leaves every observer uninstalled.
 * This closed, static script crosses the browser boundary without build-tool
 * helpers and runs before the document's own scripts.
 */
const OBSERVER_SCRIPT = String.raw`(() => {
  const state = {
    lcp: 0,
    fcp: 0,
    shifts: [],
    longTasks: [],
    interactions: {},
    observers: [],
    errors: [],
  }
  window.__o3PerformanceProbe = state

  const observe = (type, callback, options = {}) => {
    try {
      const observer = new PerformanceObserver(callback)
      observer.observe({ type, buffered: true, ...options })
      state.observers.push(observer)
    } catch (error) {
      state.errors.push(type + ': ' + String(error))
    }
  }

  observe('largest-contentful-paint', (list) => {
    for (const entry of list.getEntries()) state.lcp = entry.startTime
  })

  observe('paint', (list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') state.fcp = entry.startTime
    }
  })

  observe('layout-shift', (list) => {
    for (const entry of list.getEntries()) {
      state.shifts.push({
        startTime: entry.startTime,
        value: entry.value,
        hadRecentInput: entry.hadRecentInput,
      })
    }
  })

  observe('longtask', (list) => {
    for (const entry of list.getEntries()) {
      state.longTasks.push({ startTime: entry.startTime, duration: entry.duration })
    }
  })

  observe(
    'event',
    (list) => {
      for (const entry of list.getEntries()) {
        if (entry.interactionId === 0) continue
        const key = String(entry.interactionId)
        state.interactions[key] = Math.max(state.interactions[key] ?? 0, entry.duration)
      }
    },
    { durationThreshold: 16 },
  )
})()`

const SNAPSHOT_SCRIPT = String.raw`(() => {
  const state = window.__o3PerformanceProbe
  if (!state) throw new Error('performance observers did not install')
  return {
    now: performance.now(),
    lcp: state.lcp,
    fcp: state.fcp,
    shifts: state.shifts,
    longTasks: state.longTasks,
    errors: state.errors,
    resources: performance.getEntriesByType('resource').map((entry) => ({
      startTime: entry.startTime,
      endTime: entry.startTime + entry.duration,
    })),
  }
})()`

async function pageLoadMetrics(page: Page): Promise<Omit<Metrics, 'inp'> | null> {
  const snapshot = (await page.evaluate(SNAPSHOT_SCRIPT)) as LoadSnapshot
  return loadMetrics(snapshot)
}

async function interactionMetric(page: Page): Promise<number> {
  const menu = page.getByRole('button', { name: 'Open menu' }).first()
  if ((await menu.count()) === 0) throw new Error('INP probe could not find the Open menu button')
  await menu.click()
  await page.waitForTimeout(250)

  return page.evaluate(() => {
    const interactions = Object.values(window.__o3PerformanceProbe?.interactions ?? {})
    if (interactions.length === 0) throw new Error('INP interaction produced no Event Timing entry')
    return Math.max(...interactions)
  })
}

async function measureRoute(
  browser: Browser,
  baseUrl: string,
  route: (typeof ROUTES)[number],
): Promise<Metrics> {
  const context = await browser.newContext({
    serviceWorkers: 'block',
    viewport: THROTTLE.viewport,
  })
  const page = await context.newPage()
  const session = await context.newCDPSession(page)

  try {
    await session.send('Network.enable')
    await session.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: THROTTLE.latencyMs,
      downloadThroughput: THROTTLE.downloadBitsPerSecond / 8,
      uploadThroughput: THROTTLE.uploadBitsPerSecond / 8,
      connectionType: 'cellular3g',
    })
    await session.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE.cpuRate })
    await page.addInitScript(OBSERVER_SCRIPT)

    const response = await page.goto(new URL(route, baseUrl).href, {
      waitUntil: 'load',
      timeout: 90_000,
    })
    if (response === null || !response.ok()) {
      throw new Error(`${route} returned ${response?.status() ?? 'no response'}`)
    }
    let load: Omit<Metrics, 'inp'> | null = null
    const quietDeadline = Date.now() + 30_000
    while (load === null && Date.now() < quietDeadline) {
      await page.waitForTimeout(TTI_QUIET_WINDOW_MS)
      load = await pageLoadMetrics(page)
    }
    if (load === null) throw new Error(`${route} did not reach a five-second TTI quiet window`)

    // Capture load work before the deliberate menu interaction. This keeps
    // TBT about startup while INP describes one actual application control.
    const inp = await interactionMetric(page)
    return { ...load, inp }
  } finally {
    await session.detach().catch(() => undefined)
    await context.close()
  }
}

export async function probe(baseUrl: string): Promise<RouteSamples[]> {
  const browser = await chromium.launch({ headless: true })
  try {
    const samples = new Map<(typeof ROUTES)[number], Metrics[]>()
    for (let run = 0; run < 2; run += 1) {
      for (const route of ROUTES) {
        const routeSamples = samples.get(route) ?? []
        routeSamples.push(await measureRoute(browser, baseUrl, route))
        samples.set(route, routeSamples)
      }
    }

    return ROUTES.map((route) => {
      const routeSamples = samples.get(route)
      if (!routeSamples?.[0] || !routeSamples[1]) throw new Error(`missing samples for ${route}`)
      return { route, samples: [routeSamples[0], routeSamples[1]] }
    })
  } finally {
    await browser.close()
  }
}

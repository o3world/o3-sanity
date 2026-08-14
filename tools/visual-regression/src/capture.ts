/**
 * Screenshots, taken the same way on both sides of the comparison.
 *
 * Everything in here exists to make the second run of the same commit produce
 * byte-identical PNGs. A pixel diff is only worth reading if the only thing
 * that can move a pixel is the code under test.
 */
import fs from 'node:fs'
import path from 'node:path'

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'

import type { StoryEntry } from './storybook'

export interface Viewport {
  name: string
  width: number
  height: number
}

export interface Shot {
  storyId: string
  title: string
  name: string
  viewport: string
  file: string
  error?: string
}

/**
 * Injected before the first byte of the story renders.
 *
 * Animations and transitions are collapsed rather than paused: an animation
 * left running is the single biggest source of false diffs, and one left
 * *paused* still lands wherever the scheduler happened to stop it. Collapsed,
 * every run screenshots the same end state.
 */
const FREEZE_CSS = `
*, *::before, *::after {
  animation-delay: -1ms !important;
  animation-duration: 1ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 1ms !important;
  transition-delay: 0s !important;
  caret-color: transparent !important;
}
html { scroll-behavior: auto !important; }
`

const FREEZE_SCRIPT = `
  const style = document.createElement('style')
  style.textContent = ${JSON.stringify(FREEZE_CSS)}
  const attach = () => (document.head ?? document.documentElement).appendChild(style)
  if (document.documentElement) attach()
  else document.addEventListener('readystatechange', attach, { once: true })
`

export function shotFile(dir: string, storyId: string, viewport: string): string {
  return path.join(dir, `${storyId}--${viewport}.png`)
}

async function captureStory(
  page: Page,
  baseUrl: string,
  entry: StoryEntry,
  viewport: Viewport,
  dir: string,
  settleMs: number,
): Promise<Shot> {
  const file = shotFile(dir, entry.id, viewport.name)
  const shot: Shot = {
    storyId: entry.id,
    title: entry.title,
    name: entry.name,
    viewport: viewport.name,
    file,
  }

  try {
    await page.goto(`${baseUrl}/iframe.html?viewMode=story&id=${encodeURIComponent(entry.id)}`, {
      waitUntil: 'load',
      timeout: 30_000,
    })

    // Both signals are classes Storybook puts on the body: `sb-show-main` once
    // the story has rendered, `sb-show-errordisplay` when it threw. Waiting on
    // `#storybook-root` having children instead would look right and hang for
    // thirty seconds on every deliberately empty story — `RichText/Empty`,
    // `Cta/NoLabel`, `MediaSection/NoMedia` — whose whole point is to render
    // nothing.
    const state = await page.waitForFunction(
      () => {
        const classes = document.body.classList
        if (classes.contains('sb-show-errordisplay')) return 'error'
        return classes.contains('sb-show-main') ? 'rendered' : null
      },
      undefined,
      { timeout: 30_000 },
    )

    if ((await state.jsonValue()) === 'error') {
      const message = await page
        .locator('#error-message')
        .first()
        .textContent()
        .catch(() => null)
      shot.error = message?.trim().split('\n')[0] || 'story failed to render'
      return shot
    }

    // Web fonts change every glyph's shape; a screenshot taken before they
    // land differs from one taken after in a way that has nothing to do with
    // the change under test.
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(settleMs)
    // Two frames: one for whatever the settle timeout kicked off, one to paint.
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
    )

    fs.mkdirSync(path.dirname(file), { recursive: true })
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled', scale: 'css' })
  } catch (error) {
    shot.error = error instanceof Error ? error.message.split('\n')[0] : String(error)
  }

  return shot
}

/**
 * Capture `stories` at every viewport, skipping any shot already on disk —
 * that skip is what makes a cached baseline cheap to top up when tomorrow's run
 * touches a story yesterday's did not.
 */
export async function captureAll(options: {
  baseUrl: string
  stories: StoryEntry[]
  viewports: Viewport[]
  dir: string
  settleMs: number
  concurrency: number
  reuseExisting: boolean
  onProgress?: (done: number, total: number) => void
}): Promise<Shot[]> {
  const jobs = options.viewports.flatMap((viewport) =>
    options.stories.map((entry) => ({ entry, viewport })),
  )
  const results: Shot[] = []
  let done = 0

  const pending = jobs.filter(({ entry, viewport }) => {
    const file = shotFile(options.dir, entry.id, viewport.name)
    if (options.reuseExisting && fs.existsSync(file)) {
      results.push({
        storyId: entry.id,
        title: entry.title,
        name: entry.name,
        viewport: viewport.name,
        file,
      })
      done += 1
      return false
    }
    return true
  })
  options.onProgress?.(done, jobs.length)
  if (pending.length === 0) return results

  fs.mkdirSync(options.dir, { recursive: true })
  const browser: Browser = await chromium.launch()
  const contexts = new Map<string, BrowserContext>()

  try {
    for (const viewport of options.viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
        colorScheme: 'light',
      })
      await context.addInitScript(FREEZE_SCRIPT)
      contexts.set(viewport.name, context)
    }

    // One page per worker, reused across stories: a fresh page per story costs
    // more than it buys once the animation freeze is an init script.
    const queue = [...pending]
    const workers = Array.from({ length: Math.max(1, options.concurrency) }, async () => {
      const pages = new Map<string, Page>()
      for (;;) {
        const job = queue.shift()
        if (!job) break
        let page = pages.get(job.viewport.name)
        if (!page) {
          page = await (contexts.get(job.viewport.name) as BrowserContext).newPage()
          pages.set(job.viewport.name, page)
        }
        results.push(
          await captureStory(
            page,
            options.baseUrl,
            job.entry,
            job.viewport,
            options.dir,
            options.settleMs,
          ),
        )
        done += 1
        options.onProgress?.(done, jobs.length)
      }
      for (const page of pages.values()) await page.close()
    })

    await Promise.all(workers)
  } finally {
    for (const context of contexts.values()) await context.close()
    await browser.close()
  }

  return results
}

/**
 * Screenshots, taken the same way on both sides of the comparison.
 *
 * Everything in here exists to make the second run of the same commit produce
 * byte-identical PNGs. A pixel diff is only worth reading if the only thing
 * that can move a pixel is the code under test.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'

import { installAssetCache, type AssetCache } from './assets'
import { FREEZE_SCRIPT } from './freeze'
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

export function shotFile(dir: string, storyId: string, viewport: string): string {
  return path.join(dir, `${storyId}--${viewport}.png`)
}

/**
 * Bumped whenever the shutter changes what it waits for. Screenshots are cached
 * per baseline commit, and a cache written before a waiting rule existed holds
 * a page caught mid-load — reused as a baseline, it reports the waiting rule
 * itself as a regression in every story.
 */
const CAPTURE_BEHAVIOUR = 'deterministic-assets+mount'

/**
 * What a cached screenshot was taken *with*, short enough to sit in a path.
 *
 * `shotFile` names a PNG after the viewport's **name**, so a baseline captured
 * at `mobile:390x844` and one at `mobile:414x896` are the same filename;
 * `reuseExisting` accepts whichever exists on `fs.existsSync` alone, and every
 * story then diffs against a screenshot of the wrong width and reports changed.
 * Naming the cache directory with this closes that: different geometry is a
 * different directory, not a stale hit. `settleMs` is in the key for the same
 * reason — it changes the pixels.
 */
export function captureKey(viewports: Viewport[], settleMs: number): string {
  const shape = viewports
    .map((viewport) => `${viewport.name}:${viewport.width}x${viewport.height}`)
    .join(',')
  return createHash('sha1')
    .update(`${shape}@${settleMs}/${CAPTURE_BEHAVIOUR}`)
    .digest('hex')
    .slice(0, 8)
}

/** Long enough for a cache miss on a slow morning, short enough to notice. */
const IMAGE_TIMEOUT_MS = 15_000

/**
 * Load every image, then wait for all of them — the second half of the fix for
 * #226, and the half the asset cache cannot do on its own.
 *
 * Next's `<Image>` is `loading="lazy"`, so on the homepage twelve of
 * twenty-three images have not been requested at all when the shutter would
 * otherwise fire. A full-page screenshot then widens the capture viewport,
 * which starts those loads *while Chromium is painting* — and whichever of them
 * wins the race is in the PNG. Forcing them eager and awaiting the decode moves
 * every image to the same side of the shutter: with this in place the same page
 * fires zero requests during the capture, where it fired fourteen before.
 *
 * Runs in the page, and returns how many images it found so the caller can tell
 * whether it ran too early. `decode()` rejects for an image the network could
 * not deliver; a broken image is a legitimate thing to screenshot, so that is
 * caught rather than waited on.
 */
function awaitImages(timeoutMs: number): Promise<string> {
  const images = Array.from(document.images)
  for (const image of images) if (image.loading === 'lazy') image.loading = 'eager'
  const settled = images.map((image) =>
    image
      .decode()
      .catch(() => undefined)
      .then(() => undefined),
  )
  return Promise.race([
    Promise.all(settled),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]).then(() => `${images.length}:${document.documentElement.scrollHeight}`)
}

/**
 * Run the barrier until the page stops changing shape.
 *
 * One pass is not enough: an image that only exists once the one above it has
 * loaded — a card whose height decides whether the next band mounts — appears
 * after the pass that would have waited for it. Two passes agreeing on both the
 * image count and the page height is the signal that the page is done; the
 * third is the cutoff, because a page that keeps growing forever is a different
 * bug.
 */
async function settleContent(page: Page): Promise<void> {
  let previous = ''
  for (let pass = 0; pass < 3; pass++) {
    const shape = await page.evaluate(awaitImages, IMAGE_TIMEOUT_MS)
    if (shape === previous) return
    previous = shape
  }
}

/**
 * Wait for the story's own tree, not just for Storybook's decision to show it.
 *
 * `sb-show-main` lands on the body a beat before React has mounted anything,
 * and on a heavy page with four workers competing for the machine that beat can
 * outlast the settle: one run in three, `Pages/Software Engineering` came back
 * as a 900px-tall screenshot of an empty viewport against a 5383px baseline.
 *
 * Briefly, though. `RichText/Empty`, `Button/NoLabel` and `MediaSection/NoMedia`
 * render nothing on purpose, and a hard wait would hang for thirty seconds on
 * each of them; this gives up and captures whatever is there.
 */
async function awaitMount(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => (document.querySelector('#storybook-root')?.childElementCount ?? 0) > 0,
      undefined,
      { timeout: 5_000 },
    )
    .catch(() => undefined)
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
    // the story is to be shown, `sb-show-errordisplay` when it threw. Neither
    // says the tree exists yet — `awaitMount` below is what waits for that.
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

    await awaitMount(page)
    // Web fonts change every glyph's shape; a screenshot taken before they
    // land differs from one taken after in a way that has nothing to do with
    // the change under test.
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(settleMs)
    // After the settle, not before it: an image barrier that runs while the
    // tree is still arriving finds an empty document and waits for nothing.
    await settleContent(page)
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
  /** Where remote assets are replayed from — see `./assets`. */
  assetDir: string
  /** Shared by both sides of a comparison, so both replay the same bytes. */
  assetCache: AssetCache
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
      await installAssetCache(context, {
        origin: options.baseUrl,
        dir: options.assetDir,
        cache: options.assetCache,
      })
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

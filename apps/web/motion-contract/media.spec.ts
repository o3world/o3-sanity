import { expect, test, type Locator, type Page } from 'playwright/test'
import { IRONMAN, ordinaryPage } from './journey'

async function approach(page: Page, target: Locator) {
  for (let step = 0; step < 200; step++) {
    if (await target.evaluate((element) => element.getBoundingClientRect().top < innerHeight - 120))
      return
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          scrollBy({ top: 100, behavior: 'instant' })
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        }),
    )
  }
  throw new Error('Did not reach the media scene')
}

async function stillGround(target: Locator) {
  return target.evaluate((element) => {
    for (
      let node: Element | null = element;
      node && node.tagName !== 'MAIN';
      node = node.parentElement
    ) {
      const style = getComputedStyle(node)
      if (style.opacity !== '1' || style.translate !== 'none' || style.transform !== 'none')
        return false
    }
    return true
  })
}

test('the IRONMAN capture keeps its painted stage still while its foreground enters', async ({
  page,
}, info) => {
  await page.goto(IRONMAN)
  await ordinaryPage(page)
  const stage = page.locator('main figure > div[class*="h-[520px]"]')
  await expect(stage).toHaveCount(1)
  const reduced = info.project.use.contextOptions?.reducedMotion === 'reduce'
  await stage.evaluate((element) => {
    const entries: { duration: number; delay: number }[] = []
    ;(window as unknown as { mediaEntries: typeof entries }).mediaEntries = entries
    element.addEventListener('animationstart', (event) => {
      const target = event.target as Element
      if (!target.contains(element.querySelector('img'))) return
      const timing = target.getAnimations()[0]?.effect?.getTiming()
      entries.push({ duration: Number(timing?.duration), delay: Number(timing?.delay) })
    })
  })
  await approach(page, stage)
  expect(
    await stillGround(stage),
    'the background and enclosing band never fade or translate',
  ).toBe(true)
  if (!reduced) {
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { mediaEntries: unknown[] }).mediaEntries),
      )
      .toEqual([{ duration: 560, delay: 100 }])
  }
  await expect(stage.locator('img')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('IRONMAN screen tiles enter in reading order at their own viewport boundaries', async ({
  page,
}, info) => {
  await page.goto(IRONMAN)
  await ordinaryPage(page)
  const tiles = page.locator('main article ul.grid > li:has(img)')
  await expect(tiles).toHaveCount(4)
  const reduced = info.project.use.contextOptions?.reducedMotion === 'reduce'
  await tiles.first().evaluate((tile) => {
    const grid = tile.parentElement!
    const entries: { index: number; duration: number }[] = []
    ;(window as unknown as { tileEntries: typeof entries }).tileEntries = entries
    grid.addEventListener('animationstart', (event) => {
      const target = event.target as Element
      const index = [...grid.children].findIndex((tile) => tile.contains(target))
      if (index < 0) return
      entries.push({
        index,
        duration: Number(target.getAnimations()[0]?.effect?.getTiming().duration),
      })
    })
  })
  for (let index = 0; index < 4; index++) {
    const tile = tiles.nth(index)
    await approach(page, tile)
    expect(await stillGround(tile), 'the plate and enclosing band stay still').toBe(true)
    if (!reduced) {
      await expect
        .poll(() =>
          page.evaluate(() =>
            (window as unknown as { tileEntries: { index: number }[] }).tileEntries.map(
              (e) => e.index,
            ),
          ),
        )
        .toContain(index)
      if (
        index < 3 &&
        (await tiles
          .nth(index + 1)
          .evaluate((tile) => tile.getBoundingClientRect().top > innerHeight))
      ) {
        expect(
          await tiles
            .nth(index + 1)
            .locator('img')
            .evaluate((img) => getComputedStyle(img.parentElement!).opacity),
        ).toBe('0')
      }
    }
  }
  if (!reduced) {
    const entries = await page.evaluate(
      () =>
        (window as unknown as { tileEntries: { index: number; duration: number }[] }).tileEntries,
    )
    expect(entries.map((e) => e.index)).toEqual([0, 1, 2, 3])
    expect(entries.every((e) => e.duration === 560)).toBe(true)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('IRONMAN media remains complete with rapid scrolling, reduced motion and no JavaScript', async ({
  page,
  browser,
}, info) => {
  await page.goto(IRONMAN)
  await ordinaryPage(page)
  const images = page.locator(
    'main figure > div[class*="h-[520px]"] img, main article ul.grid > li img',
  )
  const descriptions = await images.evaluateAll((images) =>
    images.map((image) => image.getAttribute('alt')),
  )
  expect(descriptions).toHaveLength(5)
  await page.evaluate(() =>
    scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const tiles = page.locator('main article ul.grid > li:has(img)')
  await tiles.first().scrollIntoViewIfNeeded()
  for (const tile of await tiles.all()) {
    expect(await stillGround(tile)).toBe(true)
    await expect(tile.locator('img').locator('..')).toHaveCSS('opacity', '1')
    await expect(tile.locator('img').locator('..')).toHaveCSS('translate', 'none')
  }
  expect(
    await images.evaluateAll((images) => images.map((image) => image.getAttribute('alt'))),
  ).toEqual(descriptions)
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: info.project.use.viewport,
  })
  try {
    const staticPage = await context.newPage()
    await staticPage.goto(`${info.project.use.baseURL}${IRONMAN}`)
    expect(
      await staticPage
        .locator('main figure > div[class*="h-[520px]"] img, main article ul.grid > li img')
        .evaluateAll((images) => images.map((image) => image.getAttribute('alt'))),
    ).toEqual(descriptions)
    for (const image of await staticPage
      .locator('main figure > div[class*="h-[520px]"] img, main article ul.grid > li img')
      .all())
      await expect(image).toBeVisible()
    expect(
      await staticPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)
  } finally {
    await context.close()
  }
})

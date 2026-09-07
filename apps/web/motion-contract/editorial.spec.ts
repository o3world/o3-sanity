import { expect, test, type Locator, type Page } from 'playwright/test'
import { ordinaryPage } from './journey'

async function approach(page: Page, target: Locator) {
  for (let step = 0; step < 200; step++) {
    if (await target.evaluate((element) => element.getBoundingClientRect().top < innerHeight - 100))
      return
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          scrollBy({ top: 80, behavior: 'instant' })
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        }),
    )
  }
  throw new Error('Did not reach editorial content')
}

test('About introduces a heading and its supporting content without moving the painted band', async ({
  page,
}, info) => {
  await page.goto('/about')
  await ordinaryPage(page)
  const heading = page.getByRole('heading', {
    name: "The work doesn't stop at client services",
    exact: true,
  })
  const band = page.locator('section').filter({ has: heading })
  await band.evaluate((element) => {
    const timings: number[] = []
    ;(window as unknown as { editorialTimings: number[] }).editorialTimings = timings
    element.addEventListener('animationstart', (event) => {
      const target = event.target as Element
      if (target.querySelector('h2'))
        timings.push(Number(target.getAnimations()[0]?.effect?.getTiming().duration))
    })
  })
  await approach(page, heading)
  if (info.project.use.contextOptions?.reducedMotion !== 'reduce') {
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { editorialTimings: number[] }).editorialTimings),
      )
      .toContain(560)
  }
  expect(
    await band.evaluate((element) => {
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
    }),
  ).toBe(true)
  await expect(heading).toBeVisible()
  await band.screenshot({ path: info.outputPath('about-group.png'), animations: 'disabled' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('Insights cards use the shared cadence only when their row is reached', async ({
  page,
}, info) => {
  await page.goto('/insights')
  await ordinaryPage(page)
  const cards = page.locator('#feed ul.grid > li')
  expect(await cards.count()).toBeGreaterThan(6)
  const titles = await cards.locator('h3').allTextContents()
  await cards.first().evaluate((card) => {
    const grid = card.parentElement!
    const entries: { index: number; duration: number; delay: number }[] = []
    ;(window as unknown as { feedEntries: typeof entries }).feedEntries = entries
    grid.addEventListener('animationstart', (event) => {
      const target = event.target as Element
      const index = [...grid.children].findIndex((card) => card === target || card.contains(target))
      if (index < 0) return
      const timing = target.getAnimations()[0]?.effect?.getTiming()
      entries.push({ index, duration: Number(timing?.duration), delay: Number(timing?.delay) })
    })
  })
  await approach(page, cards.nth(6))
  if (info.project.use.contextOptions?.reducedMotion !== 'reduce') {
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as unknown as { feedEntries: { index: number; duration: number }[] }
            ).feedEntries.find((e) => e.index === 6)?.duration,
        ),
      )
      .toBe(560)
    const entries = await page.evaluate(
      () => (window as unknown as { feedEntries: { index: number; delay: number }[] }).feedEntries,
    )
    expect(entries.map((e) => e.index)).toEqual(
      [...entries.map((e) => e.index)].sort((a, b) => a - b),
    )
    expect(entries.every((e) => e.delay <= 200)).toBe(true)
  }
  expect(await cards.locator('h3').allTextContents()).toEqual(titles)
  await expect(page.getByRole('navigation', { name: 'Filter by category' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('an insight keeps prose static and yields its related-content entrance to pointer input', async ({
  page,
}, info) => {
  await page.goto('/insights')
  await ordinaryPage(page)
  const link = page.locator('#feed ul.grid a').first()
  const href = await link.getAttribute('href')
  await link.click()
  await expect(page).toHaveURL(new RegExp(href!))
  await ordinaryPage(page)
  const heading = page.getByRole('heading', { name: 'Keep reading.', exact: true })
  const band = page.locator('section').filter({ has: heading })
  await band.evaluate((element) => {
    const durations: number[] = []
    ;(window as unknown as { relatedDurations: number[] }).relatedDurations = durations
    element.addEventListener('animationstart', (event) => {
      const target = event.target as Element
      if (target.contains(element.querySelector('h2')))
        durations.push(Number(target.getAnimations()[0]?.effect?.getTiming().duration))
    })
  })
  await approach(page, heading)
  if (info.project.use.contextOptions?.reducedMotion !== 'reduce') {
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { relatedDurations: number[] }).relatedDurations),
      )
      .toContain(560)
    // Use a real pointer down without Playwright waiting for the entrance to settle.
    const point = await heading.boundingBox()
    await page.mouse.move(point!.x + 10, point!.y + 10)
    await page.mouse.down()
    expect(
      await band.evaluate(
        (element) =>
          element
            .getAnimations({ subtree: true })
            .filter(
              (animation) =>
                animation instanceof CSSAnimation && animation.animationName === 'sequence-enter',
            ).length,
      ),
    ).toBe(0)
    await page.mouse.up()
  }
  const paragraphs = page.locator('main article .max-w-article p')
  expect(await paragraphs.count()).toBeGreaterThan(0)
  expect(
    await paragraphs.evaluateAll((elements) =>
      elements.every((element) => {
        for (
          let node: Element | null = element;
          node && node.tagName !== 'ARTICLE';
          node = node.parentElement
        ) {
          const style = getComputedStyle(node)
          if (style.translate !== 'none' || style.opacity !== '1') return false
        }
        return true
      }),
    ),
  ).toBe(true)
  await expect(heading).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/insights\/?$/)
  await ordinaryPage(page)
  await page.goForward()
  await expect(page).toHaveURL(new RegExp(href!))
  await ordinaryPage(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('editorial routes retain complete content through fast scrolling, reduced motion and no JavaScript', async ({
  page,
  browser,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: info.project.use.viewport,
  })
  try {
    const staticPage = await context.newPage()
    await page.goto('/insights')
    await ordinaryPage(page)
    const detail = await page.locator('#feed ul.grid a').first().getAttribute('href')
    for (const path of [
      '/about',
      '/solutions',
      '/solutions/software-engineering',
      '/insights',
      detail!,
    ]) {
      await page.emulateMedia({
        reducedMotion: info.project.use.contextOptions?.reducedMotion ?? 'no-preference',
      })
      await page.goto(path)
      await ordinaryPage(page)
      const content = await page.locator('main h1, main h2, main h3, main p').allTextContents()
      await page.evaluate(() =>
        scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
      expect(await page.locator('main h1, main h2, main h3, main p').allTextContents()).toEqual(
        content,
      )
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(
        await page.locator('main [data-reveal-step]').evaluateAll((elements) =>
          elements.every((element) => {
            const style = getComputedStyle(element)
            return style.opacity === '1' && style.translate === 'none'
          }),
        ),
      ).toBe(true)
      await staticPage.goto(`${info.project.use.baseURL}${path}`)
      expect(
        await staticPage.locator('main h1, main h2, main h3, main p').allTextContents(),
      ).toEqual(content)
      expect(
        await staticPage
          .locator('main [data-reveal-step]')
          .evaluateAll((elements) =>
            elements.every((element) => getComputedStyle(element).opacity === '1'),
          ),
      ).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      expect(
        await staticPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true)
    }
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})

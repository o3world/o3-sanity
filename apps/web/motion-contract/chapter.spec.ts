import { expect, test } from 'playwright/test'
import { IRONMAN, ordinaryPage } from './journey'

test('the IRONMAN chapter establishes its heading before its lead without moving the band', async ({
  page,
}, info) => {
  await page.goto(IRONMAN)
  await ordinaryPage(page)
  const chapter = page
    .locator('main article > section')
    .filter({ has: page.getByRole('heading', { level: 2 }) })
    .first()
  await expect(chapter).toBeAttached()
  const reduced = info.project.use.contextOptions?.reducedMotion === 'reduce'
  await chapter.evaluate((section) => {
    const heading = section.querySelector('h2')!
    const lead = [...section.querySelectorAll('p')].find(
      (paragraph) => !heading.parentElement!.contains(paragraph),
    )!
    const samples: { role: string; at: number; duration: number; delay: number }[] = []
    ;(window as unknown as { chapterEntries: typeof samples }).chapterEntries = samples
    section.addEventListener('animationstart', (event) => {
      const target = event.target as Element
      const role = target.contains(heading)
        ? 'heading'
        : target.contains(lead)
          ? 'lead'
          : target.contains(section.querySelector('dl'))
            ? 'details'
            : 'other'
      const animation = target.getAnimations()[0]
      const timing = animation?.effect?.getTiming()
      samples.push({
        role,
        at: performance.now(),
        duration: Number(timing?.duration),
        delay: Number(timing?.delay),
      })
    })
  })
  // Small steps exercise entry instead of the separate rapid-scroll fallback.
  for (let step = 0; step < 60; step++) {
    const top = await chapter
      .locator('h2')
      .evaluate((heading) => heading.getBoundingClientRect().top)
    if (top < page.viewportSize()!.height - 180) break
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          scrollBy({ top: 100, behavior: 'instant' })
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        }),
    )
  }
  if (!reduced) {
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as unknown as { chapterEntries: { role: string }[] }).chapterEntries.map(
            (entry) => entry.role,
          ),
        ),
      )
      .toEqual(['heading', 'lead'])
    const entries = await page.evaluate(
      () =>
        (
          window as unknown as {
            chapterEntries: { role: string; at: number; duration: number; delay: number }[]
          }
        ).chapterEntries,
    )
    expect(entries[0]!.duration).toBe(560)
    expect(entries[1]!.delay - entries[0]!.delay).toBe(100)
    expect(entries[1]!.at).toBeGreaterThan(entries[0]!.at)
    await info.attach('chapter-entry', {
      body: JSON.stringify(entries),
      contentType: 'application/json',
    })
  }
  const details = chapter.locator('dl')
  if (await details.count()) {
    if (!reduced) await expect(details).toHaveCSS('opacity', '0')
    for (let step = 0; step < 60; step++) {
      if (await details.evaluate((list) => list.getBoundingClientRect().top < innerHeight - 100))
        break
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            scrollBy({ top: 100, behavior: 'instant' })
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          }),
      )
    }
    await expect(details).toHaveCSS('opacity', '1')
    if (!reduced) {
      const roles = await page.evaluate(() =>
        (window as unknown as { chapterEntries: { role: string }[] }).chapterEntries.map(
          (entry) => entry.role,
        ),
      )
      expect(roles).toEqual(['heading', 'lead', 'details'])
    }
  }
  await expect(chapter).toHaveCSS('opacity', '1')
  await expect(chapter).toHaveCSS('translate', 'none')
  // Remaining prose is complete throughout; it does not wait for the sequence.
  const remainder = chapter.locator('p').nth(2)
  await expect(remainder).toBeVisible()
  expect(
    await remainder.evaluate((paragraph) => {
      for (
        let element: Element | null = paragraph;
        element && element.tagName !== 'SECTION';
        element = element.parentElement
      ) {
        if (
          getComputedStyle(element).opacity !== '1' ||
          getComputedStyle(element).translate !== 'none'
        )
          return false
      }
      return true
    }),
  ).toBe(true)
  await expect
    .poll(() =>
      chapter.evaluate(
        (section) =>
          section
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === 'running').length,
      ),
    )
    .toBe(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('the chapter stays complete after rapid scroll, reverse scroll, resize and reduced motion', async ({
  page,
}) => {
  await page.goto(IRONMAN)
  await ordinaryPage(page)
  const chapter = page
    .locator('main article > section')
    .filter({ has: page.getByRole('heading', { level: 2 }) })
    .first()
  const content = await chapter.innerText()
  await page.evaluate(() =>
    scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
  )
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
  await chapter.scrollIntoViewIfNeeded()
  await page.setViewportSize({ width: page.viewportSize()!.width, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await chapter.innerText()).toBe(content)
  expect(
    await chapter.evaluate((section) =>
      [...section.querySelectorAll('h2, p, dl')].every((content) => {
        for (
          let node: Element | null = content;
          node && node !== section;
          node = node.parentElement
        ) {
          if (getComputedStyle(node).opacity !== '1' || getComputedStyle(node).translate !== 'none')
            return false
        }
        return true
      }),
    ),
  ).toBe(true)
  expect(
    await chapter.evaluate(
      (section) =>
        section
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === 'running').length,
    ),
  ).toBe(0)
})

test('the real chapter renders every paragraph and detail without JavaScript', async ({
  browser,
}, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: info.project.use.viewport,
  })
  const page = await context.newPage()
  try {
    await page.goto(`http://localhost:${new URL(String(info.project.use.baseURL)).port}${IRONMAN}`)
    const chapter = page
      .locator('main article > section')
      .filter({ has: page.getByRole('heading', { level: 2 }) })
      .first()
    await expect(chapter.getByRole('heading', { level: 2 })).toBeVisible()
    await expect(chapter.locator('p')).toHaveCount(4)
    await expect(chapter.locator('dt')).toHaveCount(3)
    for (const paragraph of await chapter.locator('p, dt, dd').all())
      await expect(paragraph).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  } finally {
    await context.close()
  }
})

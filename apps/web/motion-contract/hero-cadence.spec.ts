import { expect, test } from 'playwright/test'
import { navLink, primary } from './journey'

for (const route of [
  {
    path: '/',
    animated: true,
    parts: '.hero-lead h1 > span:visible, .hero-lead > div:visible',
    delays: [320, 480, 640, 940],
  },
  {
    path: '/work',
    animated: false,
    parts: '[data-collection-hero] h1:visible, [data-collection-hero] p:visible',
    delays: [0, 160, 320],
  },
]) {
  test(`${route.path} hero ${route.animated ? 'owns its cadence' : 'stays static'} on direct and cached arrivals`, async ({
    page,
  }, info) => {
    const reduced = info.project.use.contextOptions?.reducedMotion === 'reduce'
    await page.goto(route.path)
    for (let visit = 0; visit < 2; visit++) {
      const parts = page.locator(route.parts)
      await expect(parts).toHaveCount(route.delays.length)
      const proof = await parts.evaluateAll((elements) => {
        const foreground = elements[0]!.closest('[data-route-foreground]')!
        const animations = document
          .getAnimations()
          .filter((animation) => animation.playState === 'running')
        return {
          spatial: !!foreground.closest('[data-spatial-layout]'),
          delays: elements.map(
            (element) => parseFloat(getComputedStyle(element).animationDelay) * 1000,
          ),
          names: elements.map((element) => getComputedStyle(element).animationName),
          durations: elements.map(
            (element) => parseFloat(getComputedStyle(element).animationDuration) * 1000,
          ),
          stacked:
            animations.some((animation) => {
              const effect = animation.effect as KeyframeEffect | null
              return (
                !(animation instanceof CSSAnimation) &&
                !(animation instanceof CSSTransition) &&
                effect?.target === foreground &&
                effect.getKeyframes().some((frame) => frame.opacity !== undefined)
              )
            }) &&
            animations.some((animation) => {
              const target = (animation.effect as KeyframeEffect | null)?.target
              return (
                target instanceof Element && target !== foreground && foreground.contains(target)
              )
            }),
        }
      })
      expect(proof.stacked, 'the route fade never stacks with the hero cadence').toBe(false)
      if (reduced || !route.animated || (proof.spatial && visit > 0))
        expect(proof.names.every((name) => name === 'none')).toBe(true)
      else {
        expect(proof.delays).toEqual(proof.spatial ? [300, 400, 500, 600] : route.delays)
        if (proof.spatial) {
          expect(proof.names).toEqual(Array(4).fill('spatial-hero-enter'))
          expect(proof.durations).toEqual([600, 600, 600, 600])
          expect(Math.max(...proof.delays.map((delay, i) => delay + proof.durations[i]!))).toBe(
            1200,
          )
        } else expect(proof.names.every((name) => name !== 'none')).toBe(true)
      }
      for (const part of await parts.all()) await expect(part).toHaveCSS('opacity', '1')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      await (await navLink(page, 'About')).click()
      await expect(page).toHaveURL(/\/about\/?$/)
      if (route.path === '/')
        await primary(page)
          .getByRole('link', { name: / home$/ })
          .click()
      else await (await navLink(page, 'Work')).click()
      await expect(page).toHaveURL(route.path === '/' ? /\/$/ : /\/work\/?$/)
    }
  })

  test(`${route.path} hero stays readable without JavaScript`, async ({
    browser,
    baseURL,
  }, info) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: info.project.use.viewport!,
    })
    try {
      const page = await context.newPage()
      await page.goto(`${baseURL}${route.path}`)
      const parts = page.locator(route.parts)
      await expect(parts).toHaveCount(route.delays.length)
      for (const part of await parts.all()) await expect(part).toHaveCSS('opacity', '1')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    } finally {
      await context.close()
    }
  })
}

test('Home settles an in-progress direct entrance when reduced motion is enabled', async ({
  page,
}, info) => {
  test.skip(info.project.use.contextOptions?.reducedMotion === 'reduce')
  // Hold a real direct-load entrance in progress so network speed cannot miss it.
  await page.addInitScript(() => {
    document.addEventListener('animationstart', (event) => {
      const target = event.target as Element
      if (!target.matches('.hero-lead h1 > span, .hero-lead > div')) return
      target.getAnimations().forEach((animation) => animation.pause())
    })
  })
  await page.goto('/')
  const parts = page.locator('.hero-lead h1 > span:visible, .hero-lead > div:visible')
  await expect
    .poll(() =>
      parts.evaluateAll((elements) =>
        elements.some((element) =>
          element.getAnimations().some((animation) => animation.playState === 'paused'),
        ),
      ),
    )
    .toBe(true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const part of await parts.all()) {
    await expect(part).toHaveCSS('animation-name', 'none')
    await expect(part).toHaveCSS('opacity', '1')
  }
  if (await page.locator('[data-spatial-layout] .hero-lead').count()) {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    for (const part of await parts.all()) {
      await expect(part).toHaveCSS('animation-name', 'none')
      await expect(part).toHaveCSS('opacity', '1')
    }
  }
})

test('spatial Home copy stays opaque during its natural scroll exit', async ({ page }) => {
  await page.goto('/')
  const lead = page.locator('[data-spatial-layout] .hero-lead')
  test.skip((await lead.count()) === 0, 'Requires the spatial Home hero')
  await page.evaluate(() => scrollTo({ top: 300, behavior: 'instant' }))
  await expect(lead).toHaveCSS('opacity', '1')
  await expect(lead.getByRole('link', { name: 'View our work' })).toHaveCSS('opacity', '1')
})

test('Home entered from an interior document does not start a spatial entrance', async ({
  page,
}) => {
  await page.goto('/about')
  await primary(page)
    .getByRole('link', { name: / home$/ })
    .click()
  await expect(page).toHaveURL(/\/$/)
  const lead = page.locator('[data-spatial-layout] .hero-lead')
  test.skip((await lead.count()) === 0, 'Requires the spatial Home hero')
  for (const part of await lead.locator('h1 > span, :scope > div').all()) {
    await expect(part).toHaveCSS('animation-name', 'none')
    await expect(part).toHaveCSS('opacity', '1')
  }
})

test('Home reports a real largest-contentful paint after its entrance', async ({ page }, info) => {
  test.skip(!info.project.name.startsWith('chromium-'), 'LCP observation is a Chromium API')
  await page.addInitScript(`
    window.__heroLcp = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.element?.closest('.hero-lead')) window.__heroLcp = entry.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  `)
  await page.goto('/')
  await expect.poll(() => page.evaluate('window.__heroLcp')).toBeGreaterThan(0)
})

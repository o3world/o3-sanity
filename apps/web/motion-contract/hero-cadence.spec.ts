import { expect, test } from 'playwright/test'
import { navLink, primary } from './journey'

for (const route of [
  {
    path: '/',
    parts: '.hero-lead h1 > span:visible, .hero-lead > div:visible',
    delays: [0, 160, 320, 620],
  },
  {
    path: '/work',
    parts: '[data-collection-hero] h1:visible, [data-collection-hero] p:visible',
    delays: [0, 160, 320],
  },
]) {
  test(`${route.path} hero owns its cadence on direct and cached arrivals`, async ({
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
          delays: elements.map(
            (element) => parseFloat(getComputedStyle(element).animationDelay) * 1000,
          ),
          names: elements.map((element) => getComputedStyle(element).animationName),
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
      if (reduced) expect(proof.names.every((name) => name === 'none')).toBe(true)
      else {
        expect(proof.delays).toEqual(route.delays)
        expect(proof.names.every((name) => name !== 'none')).toBe(true)
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
    if (!reduced) {
      await expect
        .poll(() =>
          page
            .locator(route.parts)
            .evaluateAll((elements) =>
              elements.some((element) =>
                element.getAnimations().some((animation) => animation.playState === 'running'),
              ),
            ),
        )
        .toBe(true)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect
        .poll(() =>
          page
            .locator(route.parts)
            .evaluateAll((elements) =>
              elements.every(
                (element) =>
                  getComputedStyle(element).animationName === 'none' &&
                  getComputedStyle(element).opacity === '1',
              ),
            ),
        )
        .toBe(true)
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

import { expect, test } from 'playwright/test'

test('tabbing into an embed below the fold shows its band at once', async ({
  page,
  context,
  baseURL,
}, info) => {
  test.skip(
    info.project.use.contextOptions?.reducedMotion === 'reduce',
    'Reduced motion never arms a reveal',
  )
  // A returning visitor: the cookie notice would otherwise add its own stops.
  await context.addCookies([{ name: 'cookie_notice_accepted', value: 'true', url: baseURL! }])
  await page.goto('/1682-conference-ai-innovation')
  const embed = page.locator('iframe').first()
  const opacity = () =>
    embed.evaluate((frame) => {
      let element: Element | null = frame
      let product = 1
      while (element) {
        product *= Number(getComputedStyle(element).opacity)
        element = element.parentElement
      }
      return product
    })
  const startsInView = await embed.evaluate(
    (frame) => frame.closest('[data-reveal]')!.getBoundingClientRect().top < innerHeight,
  )
  test.skip(startsInView, 'The band is already in view, so it never arms')
  // Reveal arms after hydration, which can land after `load`.
  await expect.poll(opacity).toBe(0)
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab')
    if (await page.evaluate(() => document.activeElement?.tagName === 'IFRAME')) break
  }
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('IFRAME')
  // At once: a 700ms fade would still be well short of opaque here.
  await expect.poll(opacity, { timeout: 250 }).toBe(1)
})

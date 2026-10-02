import { expect, test } from 'playwright/test'

test('tabbing into an embed below the fold shows its band at once', async ({
  page,
  context,
  baseURL,
}) => {
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
  test.skip((await opacity()) === 1, 'The band is already in view, so it never arms')
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab')
    if (await page.evaluate(() => document.activeElement?.tagName === 'IFRAME')) break
  }
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('IFRAME')
  // At once: a 700ms fade would still be well short of opaque here.
  await expect.poll(opacity, { timeout: 250 }).toBe(1)
})

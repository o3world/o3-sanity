import { expect, test } from 'playwright/test'

const heroSelector = '.hero-band:has(.hero-lead)'

test('the moving startup sky falls back to the server sky on GPU failure', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'gpu', {
      value: {
        requestAdapter: () =>
          new Promise((resolve) => {
            Object.defineProperty(window, 'failGlobeStartup', { value: () => resolve(null) })
          }),
      },
    })
  })
  await page.goto('/')
  const hero = page.locator(heroSelector)
  const globe = hero.locator('.hero-lag > [data-orbital-preset]')
  await page.waitForFunction(() => 'failGlobeStartup' in window)
  await expect(globe).toHaveAttribute('data-orbital-loading', 'true')
  const startup = hero.locator('[data-orbital-startup]')
  await expect(startup).toHaveAttribute('data-painted', 'true')
  await expect(startup).toHaveCSS('opacity', '1')
  await page.evaluate(() =>
    (window as unknown as { failGlobeStartup: () => void }).failGlobeStartup(),
  )
  await expect(globe).not.toHaveAttribute('data-orbital-loading')
  await expect(startup).not.toHaveAttribute('data-painted')
  expect(await startup.evaluate((element) => (element as HTMLCanvasElement).width)).toBe(0)
  await expect
    .poll(() => hero.evaluate((element) => getComputedStyle(element, '::before').opacity))
    .toBe('1')
  expect(
    await hero.evaluate((element) => getComputedStyle(element, '::before').backgroundImage),
  ).toContain('data:image/svg+xml')
  await expect(page.locator('html')).not.toHaveAttribute('data-hero-startup')
  await expect(hero.locator('h1 > span').first()).toHaveCSS('opacity', '1')
  await expect(hero.getByRole('link', { name: 'View our work' })).toBeVisible()
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  test('the static sky is available with the server-rendered hero', async ({ page }) => {
    await page.goto('/')
    const hero = page.locator(heroSelector)
    expect(await hero.evaluate((element) => getComputedStyle(element, '::before').opacity)).toBe(
      '1',
    )
    expect(
      await hero.evaluate((element) => getComputedStyle(element, '::before').backgroundImage),
    ).toContain('data:image/svg+xml')
    await expect(hero.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

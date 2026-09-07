import { expect, test } from 'playwright/test'
import { navLink, primary } from './journey'

type EntranceWindow = Window & {
  entranceTravel: number
  glowOpacities: number[]
  navTravel: number
}
const globeSelector = '.hero-band:has(.hero-lead) .hero-lag > [data-orbital-preset]'
type SkyWindow = Window & { skyCoverage: number[] }

test('internal Home arrivals keep the sky visible throughout the GPU handoff', async ({ page }) => {
  await page.addInitScript(() => {
    const probe = window as unknown as SkyWindow
    probe.skyCoverage = []
    const sample = () => {
      const hero = [...document.querySelectorAll('.hero-band:has(.hero-lead)')].find(
        (element) => element.getBoundingClientRect().height > 0,
      )
      if (location.pathname === '/' && hero) {
        const gpu = hero.querySelector('.spatial-globe-canvas')
        const startup = hero.querySelector('[data-orbital-startup][data-painted]')
        probe.skyCoverage.push(
          Number(getComputedStyle(hero, '::before').opacity) +
            (gpu ? Number(getComputedStyle(gpu).opacity) : 0) +
            (startup ? Number(getComputedStyle(startup).opacity) : 0),
        )
      }
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  await page.goto('/work')
  for (const arrival of ['first logo', 'back', 'return logo']) {
    await page.evaluate(() => {
      const probe = window as unknown as SkyWindow
      probe.skyCoverage = []
    })
    if (arrival === 'back') await page.goBack()
    else
      await primary(page)
        .getByRole('link', { name: / home$/ })
        .click()
    await expect(page).toHaveURL(/\/$/)
    const globe = page.locator(`${globeSelector}:visible`)
    await expect(globe).not.toHaveAttribute('data-orbital-loading', 'true', { timeout: 15000 })
    test.skip((await globe.getAttribute('data-orbital-gpu')) !== 'true', 'Requires live WebGPU')
    await page.waitForTimeout(300)
    const coverage = await page.evaluate(() => (window as unknown as SkyWindow).skyCoverage)
    expect(coverage.length, `${arrival} captures visible Home frames`).toBeGreaterThan(0)
    expect(Math.min(...coverage), `${arrival} never blanks or dims the sky`).toBeGreaterThanOrEqual(
      0.95,
    )
    await page.locator('.hero-band:visible').getByRole('link', { name: 'View our work' }).click()
    await expect(page).toHaveURL(/\/work\/?$/)
  }
})

test('the Home camera entrance belongs to a full document load, not internal navigation', async ({
  page,
}, info) => {
  const reduced = info.project.use.contextOptions?.reducedMotion === 'reduce'
  await page.addInitScript(() => {
    const probe = window as unknown as EntranceWindow
    probe.entranceTravel = 0
    probe.navTravel = 0
    probe.glowOpacities = []
    const sample = () => {
      const nav = document.querySelector('#site-nav')
      if (nav) {
        const y = parseFloat(getComputedStyle(nav).translate.split(' ')[1] ?? '0')
        probe.navTravel = Math.max(probe.navTravel, Math.abs(y))
      }
      const globe = [
        ...document.querySelectorAll<HTMLElement>(
          '.hero-band:has(.hero-lead) .hero-lag > [data-orbital-preset]',
        ),
      ].find((element) => element.getBoundingClientRect().height > 0)
      if (globe) {
        const offset = Number(globe.style.transform.match(/-?[\d.]+/)?.[0] ?? 0)
        probe.entranceTravel = Math.max(probe.entranceTravel, Math.abs(offset))
        const glow = globe.querySelector(':scope > svg:last-of-type')
        if (glow) probe.glowOpacities.push(Number(getComputedStyle(glow).opacity))
      }
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  const travel = () => page.evaluate(() => (window as unknown as EntranceWindow).entranceTravel)
  const reset = () =>
    page.evaluate(() => {
      const probe = window as unknown as EntranceWindow
      probe.entranceTravel = 0
      probe.navTravel = 0
      probe.glowOpacities = []
    })
  const settle = async () => {
    await expect(page.locator(`${globeSelector}:visible`)).toHaveAttribute(
      'data-orbital-gpu',
      'true',
    )
    // Include the complete entrance and its 600ms return, even when it must not run.
    await page.waitForTimeout(2100)
    await expect
      .poll(() =>
        page
          .locator(`${globeSelector}:visible`)
          .evaluate((element) => (element as HTMLElement).style.transform),
      )
      .toBe('')
  }

  await page.goto('/')
  const globe = page.locator(`${globeSelector}:visible`)
  await expect(globe).not.toHaveAttribute('data-orbital-loading', 'true', { timeout: 15000 })
  test.skip(
    (await globe.getAttribute('data-orbital-gpu')) !== 'true',
    'Requires a live WebGPU renderer',
  )
  await settle()
  if (reduced) expect(await travel()).toBe(0)
  else expect(await travel()).toBeGreaterThan(1)

  for (const arrival of ['logo', 'back']) {
    await (await navLink(page, 'Work')).click()
    await expect(page).toHaveURL(/\/work\/?$/)
    await reset()
    if (arrival === 'back') await page.goBack()
    else
      await primary(page)
        .getByRole('link', { name: / home$/ })
        .click()
    await expect(page).toHaveURL(/\/$/)
    await settle()
    expect(await travel(), `${arrival} keeps the camera at rest`).toBe(0)
    expect(
      await page.evaluate(() => (window as unknown as EntranceWindow).navTravel),
      `${arrival} keeps the nav at rest`,
    ).toBe(0)
    await expect(page.locator('.hero-lead h1 > span:visible').first()).toHaveCSS('opacity', '1')
    await expect(
      page.locator('.hero-lead:visible').getByRole('link', { name: 'View our work' }),
    ).toBeVisible()
    const flickered = await page.evaluate(() =>
      (window as unknown as EntranceWindow).glowOpacities.some(
        (opacity, index, frames) => index > 0 && opacity < frames[index - 1]! - 0.05,
      ),
    )
    expect(flickered, `${arrival} never shows the glow then fades it out`).toBe(false)
  }

  await page.reload()
  await settle()
  if (reduced) expect(await travel()).toBe(0)
  else expect(await travel()).toBeGreaterThan(1)

  await page.goto('/work')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await primary(page)
    .getByRole('link', { name: / home$/ })
    .click()
  await expect(page).toHaveURL(/\/$/)
  await settle()
  expect(await travel(), 'a document opened on Work has no Home entrance').toBe(0)
})

test('the Home startup script stays in the initial document on an index-to-Home visit', async ({
  page,
}) => {
  const scriptErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Encountered a script tag')) {
      scriptErrors.push(message.text())
    }
  })
  await page.goto('/insights')
  await expect(page.locator('[data-insight-feed]')).toBeVisible()
  await primary(page)
    .getByRole('link', { name: / home$/ })
    .click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('.hero-lead h1 > span:visible').first()).toHaveCSS('opacity', '1')
  await expect(page.locator('html')).not.toHaveAttribute('data-nav-entrance')
  await expect(page.locator('html')).not.toHaveAttribute('data-hero-startup')
  expect(scriptErrors).toEqual([])
})

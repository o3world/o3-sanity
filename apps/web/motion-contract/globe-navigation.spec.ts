import { expect, test } from 'playwright/test'
import { navLink, primary } from './journey'

type EntranceWindow = Window & { entranceTravel: number; glowOpacities: number[] }
const globeSelector = '.hero-band:has(.hero-lead) .hero-lag > [data-orbital-preset]'

test('the Home camera entrance belongs to a full document load, not internal navigation', async ({
  page,
}, info) => {
  const reduced = info.project.use.contextOptions?.reducedMotion === 'reduce'
  await page.addInitScript(() => {
    const probe = window as unknown as EntranceWindow
    probe.entranceTravel = 0
    probe.glowOpacities = []
    const sample = () => {
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

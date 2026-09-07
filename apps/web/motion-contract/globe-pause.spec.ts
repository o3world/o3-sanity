import { expect, test, type Page } from 'playwright/test'
import type { SpatialMotionRoot } from '../src/components/globe/spatial-motion'

const hero = '.hero-band:has(.hero-lead)'
const globe = `${hero} .hero-lag > [data-orbital-preset]`

/** Use the shipped menu/footer entry points, then return to the scene under test. */
async function setReducedMotion(page: Page, reduced: boolean, key = 'Space') {
  const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }))
  const trigger = page.getByRole('button', { name: 'Open menu', exact: true })
  const inMenu = await trigger.isVisible()
  if (inMenu) await trigger.click()
  const container = inMenu ? page.getByRole('dialog', { name: 'Menu' }) : page.locator('#footer')
  const control = container.getByRole('button', { name: 'Reduce motion', exact: true })
  await expect(control).toBeEnabled()
  await control.scrollIntoViewIfNeeded()
  const bounds = await control.boundingBox()
  expect(await control.evaluate((element) => element.closest('[aria-hidden="true"]'))).toBeNull()
  await control.focus()
  await control.press(key)
  await expect(control).toBeFocused()
  await expect(control).toHaveAttribute('aria-pressed', String(reduced))
  expect(await control.boundingBox()).toEqual(bounds)
  if (inMenu) {
    await control.press('Escape')
    await expect(container).toBeHidden()
  }
  await page.evaluate(({ x, y }) => scrollTo({ left: x, top: y, behavior: 'instant' }), scroll)
}

test('keyboard pause freezes the live GPU scene and resumes the same canvas and clock', async ({
  page,
}, info) => {
  test.skip(
    info.project.use.contextOptions?.reducedMotion === 'reduce',
    'Static preference keeps Reduce motion on and disabled',
  )
  await page.goto('/')
  const canvas = page.locator(`${hero} .spatial-globe-canvas`)
  await expect(page.locator(globe)).not.toHaveAttribute('data-orbital-loading', 'true', {
    timeout: 15000,
  })
  test.skip(
    (await page.locator(globe).getAttribute('data-orbital-gpu')) !== 'true',
    'Requires live WebGPU',
  )
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-frame')))
    .toBeGreaterThan(500)
  const original = await canvas.elementHandle()
  await setReducedMotion(page, true)
  await expect(page.locator('html')).toHaveAttribute('data-spatial-paused', 'true')
  const frozen = await canvas.getAttribute('data-frame')
  const time = await page.evaluate(() =>
    (document.documentElement as SpatialMotionRoot).__o3SpatialMotion!.now(performance.now()),
  )
  await page.mouse.move(10, 10)
  await page.waitForTimeout(700)
  expect(await canvas.getAttribute('data-frame')).toBe(frozen)
  expect(
    await page.evaluate(() =>
      (document.documentElement as SpatialMotionRoot).__o3SpatialMotion!.now(performance.now()),
    ),
  ).toBe(time)
  const transform = await page
    .locator(globe)
    .evaluate((element) => (element as HTMLElement).style.transform)
  await page.evaluate(() => scrollTo(0, 150))
  await expect
    .poll(() =>
      page.evaluate(() =>
        Number(document.documentElement.style.getPropertyValue('--spatial-nav-solid')),
      ),
    )
    .toBeGreaterThan(0)
  expect(await canvas.getAttribute('data-frame')).toBe(frozen)
  expect(
    await page.locator(globe).evaluate((element) => (element as HTMLElement).style.transform),
  ).toBe(transform)
  const viewport = page.viewportSize()!
  const canvasWidth = await canvas.evaluate((element) => (element as HTMLCanvasElement).width)
  await page.setViewportSize({ ...viewport, width: viewport.width - 20 })
  await expect
    .poll(() => canvas.evaluate((element) => (element as HTMLCanvasElement).width))
    .not.toBe(canvasWidth)
  expect(await canvas.getAttribute('data-frame')).toBe(frozen)
  await page.setViewportSize(viewport)
  await page.evaluate(() => scrollTo(0, 0))
  await setReducedMotion(page, false, 'Enter')
  await expect(page.locator('html')).not.toHaveAttribute('data-spatial-paused')
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-frame')))
    .toBeGreaterThan(Number(frozen))
  expect(Number(await canvas.getAttribute('data-frame')) - Number(frozen)).toBeLessThan(500)
  expect(
    await original!.evaluate(
      (element) => element === document.querySelector('.spatial-globe-canvas'),
    ),
  ).toBe(true)
})

test('pause survives client navigation and controls the no-GPU SVG fallback', async ({
  page,
}, info) => {
  test.skip(
    info.project.use.contextOptions?.reducedMotion === 'reduce',
    'Static preference keeps Reduce motion on and disabled',
  )
  await page.addInitScript(() => Object.defineProperty(navigator, 'gpu', { value: undefined }))
  await page.goto('/')
  const svg = page.locator(`${globe} > svg`).first()
  await expect(page.locator(globe)).not.toHaveAttribute('data-orbital-loading', 'true', {
    timeout: 15000,
  })
  await expect(svg).toBeVisible()
  const geometry = () =>
    svg.evaluate((element) =>
      Array.from(element.querySelectorAll('path, circle')).map((node) => [
        node.getAttribute('d'),
        node.getAttribute('cx'),
        node.getAttribute('cy'),
      ]),
    )
  await setReducedMotion(page, true)
  const frozen = await geometry()
  await page.waitForTimeout(700)
  expect(await geometry()).toEqual(frozen)
  expect(
    await svg.evaluate((element) =>
      element
        .getAnimations({ subtree: true })
        .every((animation) => animation.playState === 'paused'),
    ),
  ).toBe(true)
  await setReducedMotion(page, false)
  await expect.poll(geometry).not.toEqual(frozen)
  await setReducedMotion(page, true)
  await page.locator(hero).getByRole('link', { name: 'View our work' }).click()
  await expect(page).toHaveURL(/\/work$/)
  await expect(page.locator('html')).toHaveAttribute('data-spatial-paused', 'true')
  await page.goBack()
  await expect(
    page.locator('#footer').getByRole('button', { name: 'Reduce motion' }),
  ).toHaveAttribute('aria-pressed', 'true')
  const restored = await geometry()
  await page.waitForTimeout(350)
  expect(await geometry()).toEqual(restored)
})

test('pause freezes the startup Canvas2D camera before GPU readiness', async ({ page }, info) => {
  test.skip(
    info.project.use.contextOptions?.reducedMotion === 'reduce',
    'Static preference keeps Reduce motion on and disabled',
  )
  test.skip(
    (page.viewportSize()?.width ?? 1440) >= 1024,
    'The mobile drawer exposes the setting while the startup hero remains in view',
  )
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'gpu', {
      value: { requestAdapter: () => new Promise(() => {}) },
    }),
  )
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const startup = page.locator(`${globe} [data-orbital-startup]`)
  await expect(startup).toHaveAttribute('data-painted', 'true')
  const pixels = () => startup.evaluate((element) => (element as HTMLCanvasElement).toDataURL())
  const initial = await pixels()
  await expect.poll(pixels).not.toBe(initial)
  await setReducedMotion(page, true)
  await expect(page.locator(hero)).toBeInViewport()
  await expect(startup).toHaveAttribute('data-painted', 'true')
  const frozen = await pixels()
  await page.waitForTimeout(700)
  expect(await pixels()).toBe(frozen)
  await expect(page.locator(globe)).toHaveAttribute('data-orbital-loading', 'true')
  await setReducedMotion(page, false)
  await expect(page.locator('html')).not.toHaveAttribute('data-spatial-paused')
  await expect.poll(pixels).not.toBe(frozen)
})

test('explicit still and reduced motion take precedence over the control', async ({ page }) => {
  await page.goto('/?spatial-still')
  await expect(page.locator('html')).toHaveAttribute('data-spatial-still')
  await expect(
    page.locator('#footer').getByRole('button', { name: 'Reduce motion' }),
  ).toBeDisabled()
  await expect(
    page.locator('#footer').getByRole('button', { name: 'Reduce motion' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(
    page.locator('#footer').getByRole('button', { name: 'Reduce motion' }),
  ).toBeDisabled()
  await expect(
    page.locator('#footer').getByRole('button', { name: 'Reduce motion' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator(globe)).not.toHaveAttribute('data-orbital-loading', 'true', {
    timeout: 15000,
  })
  const canvas = page.locator(`${hero} .spatial-globe-canvas`)
  if ((await page.locator(globe).getAttribute('data-orbital-gpu')) === 'true') {
    const frame = await canvas.getAttribute('data-frame')
    await page.waitForTimeout(350)
    expect(await canvas.getAttribute('data-frame')).toBe(frame)
  }
})

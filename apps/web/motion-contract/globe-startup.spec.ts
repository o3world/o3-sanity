import { expect, test } from 'playwright/test'

const heroSelector = '.hero-band:has(.hero-lead)'

test('the sky paints immediately while the text waits for GPU readiness', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'gpu', {
      value: { requestAdapter: () => new Promise(() => {}) },
    })
  })
  await page.goto('/')
  const hero = page.locator(heroSelector)
  await expect(hero.getByRole('heading', { level: 1 })).toBeVisible()
  const startup = hero.locator('[data-orbital-startup]')
  await expect(startup).toHaveAttribute('data-painted', 'true')
  await expect(startup).toHaveCSS('opacity', '1')
  const nav = page.locator('#site-nav > nav')
  await expect(nav).toHaveCSS('background-color', /(?:rgba\(.+, 0\)|color\(.+ \/ 0\)|transparent)$/)
  await expect(nav).toHaveCSS('backdrop-filter', 'blur(0px) saturate(1.25)')
  const before = await startup.evaluate((element) => (element as HTMLCanvasElement).toDataURL())
  const lines = hero.locator('h1 > span')
  if (info.project.use.contextOptions?.reducedMotion === 'reduce') {
    await expect(lines.first()).toHaveCSS('opacity', '1')
  } else {
    await expect(lines.first()).toHaveCSS('animation-play-state', 'paused')
    await expect(lines.first()).toHaveCSS('opacity', '0')
    await page.waitForTimeout(160)
    await expect(lines.first()).toHaveCSS('opacity', '0')
  }
  expect(await startup.evaluate((element) => (element as HTMLCanvasElement).toDataURL())).toBe(
    before,
  )
})

for (const gpuDelay of [0, 600]) {
  test(`first-paint sky hands off without shifting after ${gpuDelay}ms of GPU delay`, async ({
    page,
  }, info) => {
    await page.addInitScript((delay) => {
      const marks: Record<string, number> = {}
      Object.defineProperty(window, 'globeStartupMarks', { value: marks })
      const gpu = navigator.gpu
      if (!gpu) return
      const requestAdapter = gpu.requestAdapter.bind(gpu)
      gpu.requestAdapter = async (options) => {
        marks.adapterStart = performance.now()
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay))
        const adapter = await requestAdapter(options)
        marks.adapterReady = performance.now()
        if (adapter) {
          const requestDevice = adapter.requestDevice.bind(adapter)
          adapter.requestDevice = async (descriptor) => {
            marks.deviceStart = performance.now()
            const device = await requestDevice(descriptor)
            marks.deviceReady = performance.now()
            const compile = device.createRenderPipelineAsync.bind(device)
            device.createRenderPipelineAsync = async (descriptor) => {
              marks.compileStart ??= performance.now()
              const pipeline = await compile(descriptor)
              marks.compileEnd = performance.now()
              return pipeline
            }
            return device
          }
        }
        return adapter
      }
      const sample = () => {
        const hero = document.querySelector('.hero-band:has(.hero-lead)')
        if (hero) {
          marks.heroPaint ??= performance.now()
          const firstLine = hero.querySelector('h1 > span')
          if (firstLine && Number(getComputedStyle(firstLine).opacity) > 0)
            marks.textStart ??= performance.now()
          if (
            getComputedStyle(hero, '::before').opacity !== '0' ||
            hero.querySelector('[data-orbital-startup][data-painted]')
          )
            marks.skyVisible ??= performance.now()
          if (hero.hasAttribute('data-spatial-ready')) {
            marks.gpuReady ??= performance.now()
            const startup = hero.querySelector<HTMLCanvasElement>(
              '[data-orbital-startup][data-painted]',
            )
            const gpuCanvas = hero.querySelector('.spatial-globe-canvas')
            if (startup && gpuCanvas) {
              const a = startup.getBoundingClientRect()
              const b = gpuCanvas.getBoundingClientRect()
              marks.alignmentError = Math.max(
                marks.alignmentError ?? 0,
                Math.abs(a.top - b.top),
                Math.abs(a.left - b.left),
              )
            } else if (performance.now() - marks.gpuReady > 300) return
          }
        }
        requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    }, gpuDelay)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/')
    const globe = page.locator(`${heroSelector} .hero-lag > [data-orbital-preset]`)
    await expect(globe).not.toHaveAttribute('data-orbital-loading', 'true', { timeout: 15000 })
    test.skip(
      (await globe.getAttribute('data-orbital-gpu')) !== 'true',
      'Requires a live WebGPU renderer',
    )
    await expect(page.locator(`${heroSelector} [data-orbital-startup]`)).not.toHaveAttribute(
      'data-painted',
    )
    const marks = await page.evaluate(
      () =>
        (
          window as unknown as {
            globeStartupMarks: Record<string, number>
          }
        ).globeStartupMarks,
    )
    console.log(info.project.name, JSON.stringify(marks))
    expect(marks.skyVisible! - marks.heroPaint!).toBeLessThan(50)
    if (info.project.use.contextOptions?.reducedMotion !== 'reduce') {
      expect(marks.alignmentError).toBeLessThan(0.1)
      expect(marks.textStart! - marks.gpuReady!).toBeGreaterThanOrEqual(-34)
      expect(marks.textStart! - marks.gpuReady!).toBeLessThan(100)
    }
    await expect(page.locator(`${heroSelector} [data-orbital-startup]`)).not.toHaveAttribute(
      'data-painted',
    )
    expect(
      await page
        .locator(`${heroSelector} [data-orbital-startup]`)
        .evaluate((element) => (element as HTMLCanvasElement).width),
    ).toBe(0)
    expect(errors).toEqual([])
  })
}

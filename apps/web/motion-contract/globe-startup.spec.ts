import { expect, test } from 'playwright/test'

const heroSelector = '.hero-band:has(.hero-lead)'

test('essential Home content stays usable while the GPU is stalled', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'gpu', {
      value: { requestAdapter: () => new Promise(() => {}) },
    })
  })
  await page.goto('/')
  const hero = page.locator(heroSelector)
  await expect(hero.locator('h1 > span').first()).toHaveCSS('opacity', '1')
  await expect(page.locator('#site-nav')).toHaveCSS('visibility', 'visible')
  await expect(page.locator('#site-nav')).toHaveCSS('opacity', '1')
  await expect(hero.locator('.hero-lag > [data-orbital-preset]')).toHaveAttribute(
    'data-orbital-loading',
    'true',
  )
  const cta = hero.getByRole('link', { name: 'View our work' })
  await cta.click()
  await expect(page).toHaveURL(/\/work$/)
})

for (const gpuDelay of [0, 600]) {
  test(`first-paint sky hands off without shifting after ${gpuDelay}ms of GPU delay`, async ({
    page,
  }, info) => {
    await page.addInitScript((delay) => {
      const marks: Record<string, number> = {}
      Object.defineProperty(window, 'globeStartupMarks', { value: marks })
      document.addEventListener('animationend', (event) => {
        if (event.animationName !== 'hero-wave') return
        const target = event.target as Element
        if (target.id === 'site-nav') marks.navFinish = performance.now()
        if (target.matches('.hero-lead h1 > span:first-child')) marks.textFinish = performance.now()
      })
      const clear = CanvasRenderingContext2D.prototype.clearRect
      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
        if (this.canvas.hasAttribute('data-orbital-startup')) {
          const hero = this.canvas.closest('.hero-band')
          const globe = this.canvas.parentElement
          if (hero?.hasAttribute('data-spatial-ready') && globe) {
            marks.skyEntrancePaints = (marks.skyEntrancePaints ?? 0) + 1
            const offset = parseFloat(globe.style.transform.match(/-?[\d.]+/)?.[0] ?? '0')
            marks.globeAtSkyStart ??= offset
            marks.globeAtSkyHandoff = offset
          }
        }
        return clear.apply(this, args)
      }
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
          const nav = document.querySelector('#site-nav')
          if (nav) {
            const style = getComputedStyle(nav)
            if (Number(style.opacity) > 0) marks.navStart ??= performance.now()
            const y = parseFloat(style.translate.split(' ')[1] ?? '0')
            marks.navMinY = Math.min(marks.navMinY ?? 0, y)
          }
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
            } else if (
              (marks.navFinish && marks.textFinish) ||
              (matchMedia('(prefers-reduced-motion: reduce)').matches &&
                performance.now() - marks.gpuReady > 300)
            )
              return
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
    if (info.project.use.contextOptions?.reducedMotion !== 'reduce') {
      await page.waitForFunction(() => {
        const marks = (window as unknown as { globeStartupMarks: Record<string, number> })
          .globeStartupMarks
        return marks.navFinish && marks.textFinish
      })
    }
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
      expect(marks.navMinY).toBeLessThan(-5)
      expect(marks.navMinY).toBeGreaterThan(-7)
    }
    await expect(page.locator(`${heroSelector} [data-orbital-startup]`)).not.toHaveAttribute(
      'data-painted',
    )
    expect(
      await page
        .locator(`${heroSelector} [data-orbital-startup]`)
        .evaluate((element) => (element as HTMLCanvasElement).width),
    ).toBe(0)
    await expect(page.locator('#site-nav')).toHaveCSS('opacity', '1')
    await expect(page.locator('#site-nav')).toHaveCSS('visibility', 'visible')
    await expect(page.locator('#site-nav')).toHaveCSS('translate', 'none')
    await expect(page.locator('html')).not.toHaveAttribute('data-nav-entrance')
    expect(errors).toEqual([])
  })
}

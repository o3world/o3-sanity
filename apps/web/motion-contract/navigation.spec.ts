import { expect, test } from 'playwright/test'
import {
  arrivalRunning,
  expectNoArrival,
  expectPointerDuringArrival,
  IRONMAN,
  navigate,
  navLink,
  ordinaryPage,
  primary,
  watchNextPointer,
} from './journey'

const browserErrors = new Map<string, string[]>()

test.beforeEach(async ({ page, browser }, info) => {
  const errors: string[] = []
  browserErrors.set(info.testId, errors)
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && /CORS|Access-Control-Allow-Origin/.test(message.text()))
      errors.push(message.text())
  })
  await info.attach('browser', {
    body: `${browser.browserType().name()} ${browser.version()}`,
    contentType: 'text/plain',
  })
})

test.afterEach(async ({ page }, info) => {
  const samples = await page.evaluate(() => window.motionJourney ?? []).catch(() => [])
  await info.attach('navigation-timing', {
    body: JSON.stringify(samples, null, 2),
    contentType: 'application/json',
  })
  expect(browserErrors.get(info.testId), 'no page or CORS errors').toEqual([])
  browserErrors.delete(info.testId)
})

test('a stationary pointer can navigate before the page fade finishes', async ({ page }, info) => {
  test.skip(
    info.project.use.contextOptions?.reducedMotion === 'reduce' ||
      info.project.use.viewport!.width < 1024,
    'the uninterrupted desktop fade is the stationary-mouse case',
  )
  await page.goto('/')
  const insights = primary(page).getByRole('link', { name: 'Insights', exact: true })
  const box = (await insights.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await watchNextPointer(page)
  await primary(page).getByRole('link', { name: 'Work', exact: true }).focus()
  await page.keyboard.press('Enter')
  await page.waitForFunction(() =>
    document.getAnimations().some((animation) => {
      const effect = animation.effect as KeyframeEffect | null
      return (
        (effect?.target === document.querySelector('main') ||
          effect?.pseudoElement?.startsWith('::view-transition')) &&
        animation.playState === 'running'
      )
    }),
  )
  // No mousemove and no locator auto-wait: this is the click that native
  // snapshot hit testing loses even when pointerdown cancels the transition.
  await page.mouse.down()
  await page.mouse.up()
  await expectPointerDuringArrival(page, '/insights', info)
  await expect(page).toHaveURL(/\/insights\/?$/)
  await ordinaryPage(page)
})

test('the representative reader journey separates ready content from settled motion', async ({
  page,
}, info) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const first = await navigate(
    page,
    '/work',
    async () => (await navLink(page, 'Work')).click(),
    info,
  )
  if (info.project.use.contextOptions?.reducedMotion !== 'reduce') {
    expect(first.motionSeen, 'normal navigation actually has an arrival cadence').toBe(true)
    expect(first.readyAt!).toBeLessThan(first.settledAt!)
  }
  await navigate(
    page,
    IRONMAN,
    () => page.locator(`main a[href="${IRONMAN}"]:visible`).first().click(),
    info,
  )
  if (
    info.project.name.startsWith('chromium-') &&
    info.project.use.contextOptions?.reducedMotion !== 'reduce'
  ) {
    await info.attach('case-study-rendered', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
  }
  await navigate(page, '/insights', async () => (await navLink(page, 'Insights')).click(), info)
  const article = page
    .locator('main a[href^="/insights/"]:not([href*="/category/"]):not([href*="/page/"]):visible')
    .first()
  const articlePath = (await article.getAttribute('href'))!
  await navigate(page, articlePath, () => article.click(), info)
  await navigate(page, '/solutions', async () => (await navLink(page, 'Solutions')).click(), info)
  await expect(page.getByRole('navigation', { name: 'Footer', exact: true })).toBeAttached()
  const contact = page.locator('main a[href="/contact"]:visible').first()
  if (await contact.count()) {
    await navigate(page, '/contact', () => contact.click(), info)
  } else {
    await navigate(page, '/contact', async () => (await navLink(page, 'Let’s talk')).click(), info)
  }
})

test('back, forward and a deep link retain usable content and keyboard focus', async ({
  page,
}, info) => {
  await page.goto(IRONMAN)
  await expect(page.getByRole('heading', { name: 'IRONMAN', exact: true })).toBeVisible()
  const oldLink = await page.locator('main a:visible').first().elementHandle()
  await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'instant' }))
  const originalScroll = await page.evaluate(() => scrollY)
  await navigate(page, '/work', async () => (await navLink(page, 'Work')).click(), info)
  await ordinaryPage(page)
  const retained = await oldLink!.evaluate((link) => {
    if (!link.isConnected) return false
    ;(link as HTMLElement).focus()
    return document.activeElement === link
  })
  expect(retained, 'the previous route cannot take focus when retained offscreen').toBe(false)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2)
  await navigate(page, IRONMAN, () => page.goBack(), info)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(originalScroll - 10)
  await navigate(page, '/work', () => page.goForward(), info)
  // Safari on macOS uses Option-Tab to visit every clickable item:
  // https://support.apple.com/en-euro/guide/safari/cpsh003/mac
  const fullTab =
    info.project.use.browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
  if (fullTab === 'Alt+Tab') {
    await page.keyboard.press('Tab')
    expect(
      await page.evaluate(
        () =>
          document.activeElement === document.body ||
          (document.activeElement as HTMLElement).getClientRects().length > 0,
      ),
      'native Tab may leave the document, but never focuses a hidden route',
    ).toBe(true)
  }
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press(fullTab)
    expect(
      await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null
        return (
          !!element &&
          element !== document.body &&
          element.getBoundingClientRect().width > 0 &&
          getComputedStyle(element).visibility !== 'hidden'
        )
      }),
      'tab order contains only live visible controls',
    ).toBe(true)
  }
  await page.locator(`main a[href="${IRONMAN}"]:visible`).first().focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`${IRONMAN}/?$`))
  await ordinaryPage(page)
})

test('browsers without animation APIs still navigate completely', async ({ page }, info) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'startViewTransition', { value: undefined })
    Object.defineProperty(Element.prototype, 'animate', { value: undefined })
  })
  await page.goto('/')
  const sample = await navigate(
    page,
    '/work',
    async () => (await navLink(page, 'Work')).click(),
    info,
  )
  expect(sample.motionSeen).toBe(false)
  const light = await navigate(
    page,
    '/solutions',
    async () => (await navLink(page, 'Solutions')).press('Enter'),
    info,
  )
  expect(light.readyNav).toMatchObject({
    color: 'rgb(35, 35, 35)',
    background: 'rgba(255, 255, 255, 0.6)',
    button: 'rgb(255, 255, 255)',
    buttonBackground: 'rgb(10, 10, 11)',
  })
  await navigate(page, '/work', async () => (await navLink(page, 'Work')).press('Enter'), info)
  await navigate(
    page,
    IRONMAN,
    () => page.locator(`main a[href="${IRONMAN}"]:visible`).first().click(),
    info,
  )
  await ordinaryPage(page)
})

test('rapid and repeated navigation leaves only the final page active', async ({ page }, info) => {
  await page.goto('/')
  const mobile = info.project.use.viewport!.width < 1024
  const nextControl = mobile
    ? primary(page).getByRole('button', { name: 'Open menu' })
    : primary(page).getByRole('link', { name: 'Insights', exact: true })
  const nextBox = (await nextControl.boundingBox())!
  const work = await navLink(page, 'Work')
  await watchNextPointer(page, '/work')
  await work.click()
  if (info.project.use.contextOptions?.reducedMotion !== 'reduce') await arrivalRunning(page)
  else await expect(page).toHaveURL(/\/work\/?$/)
  if (mobile) {
    // Tap the live header while the arriving main is still fading. Do not
    // wait for the sheet's previous exit animation or use a forced click.
    await page.touchscreen.tap(nextBox.x + nextBox.width / 2, nextBox.y + nextBox.height / 2)
    await expectPointerDuringArrival(page, 'Open menu', info)
    await expect(page.getByRole('dialog')).toBeVisible()
    await page
      .getByRole('navigation', { name: 'Menu', exact: true })
      .getByRole('link', { name: 'Insights', exact: true })
      .tap()
  } else {
    await page.mouse.click(nextBox.x + nextBox.width / 2, nextBox.y + nextBox.height / 2)
    await expectPointerDuringArrival(page, '/insights', info)
  }
  await expect(page).toHaveURL(/\/insights\/?$/)
  const solutions = await navLink(page, 'Solutions')
  await solutions.click()
  await expect(page).toHaveURL(/\/solutions\/?$/)
  await ordinaryPage(page)
  const repeat = await navLink(page, 'Solutions')
  await expectNoArrival(page, () => repeat.click())
  await ordinaryPage(page)
  await expectNoArrival(page, () => page.goto('/solutions#navigation-contract'))
})

test('enabling reduced motion cancels an active arrival without leaving dim content', async ({
  page,
}, info) => {
  test.skip(
    info.project.use.contextOptions?.reducedMotion === 'reduce',
    'this case changes the preference during normal motion',
  )
  await page.goto('/')
  await page.locator('main a[href="/work"]:visible').first().click()
  await arrivalRunning(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('main')).toHaveCSS('opacity', '1', { timeout: 200 })
  await ordinaryPage(page)
  const sample = await navigate(
    page,
    '/insights',
    async () => (await navLink(page, 'Insights')).click(),
    info,
  )
  expect(sample.motionSeen).toBe(false)
})

test('navigation ink follows the current surface across routes and restored scroll', async ({
  page,
}, info) => {
  await page.goto('/solutions')
  const nav = primary(page)
  await expect(nav).toHaveCSS('color', 'rgb(35, 35, 35)')
  await navigate(page, '/work', async () => (await navLink(page, 'Work')).click(), info)
  await expect(nav).toHaveCSS('color', 'rgb(255, 255, 255)')
  await navigate(page, '/solutions', async () => (await navLink(page, 'Solutions')).click(), info)
  await expect(nav).toHaveCSS('color', 'rgb(35, 35, 35)')
  await page
    .locator('main section[data-surface="ink"]:visible')
    .first()
    .evaluate((section) => {
      scrollTo({ top: section.getBoundingClientRect().top + scrollY + 150, behavior: 'instant' })
    })
  await expect(nav).toHaveCSS('color', 'rgb(255, 255, 255)')
  await page
    .locator('main section[data-surface="paper"]:visible')
    .first()
    .evaluate((section) => {
      scrollTo({ top: section.getBoundingClientRect().top + scrollY + 150, behavior: 'instant' })
    })
  await expect(nav).toHaveCSS('color', 'rgb(35, 35, 35)')
  await ordinaryPage(page)
})

test('the destination nav skin is complete on the first arriving frame', async ({ page }, info) => {
  const desktop = info.project.use.viewport!.width >= 1024
  const lightSkin = {
    color: 'rgb(35, 35, 35)',
    background: 'rgba(255, 255, 255, 0.6)',
    link: 'rgb(35, 35, 35)',
    inactiveLink: desktop ? 'rgb(35, 35, 35)' : null,
    button: 'rgb(255, 255, 255)',
    buttonBackground: 'rgb(10, 10, 11)',
  }
  const darkSkin = {
    color: 'rgb(255, 255, 255)',
    background: desktop ? 'rgba(3, 3, 3, 0.45)' : 'rgba(3, 3, 3, 0.2)',
    link: 'rgb(255, 255, 255)',
    inactiveLink: desktop ? 'rgb(255, 255, 255)' : null,
    button: 'rgb(10, 10, 11)',
    buttonBackground: 'rgb(255, 255, 255)',
  }
  const atTop = desktop ? 124 : 0
  const pinned = desktop ? 32 : 0
  await page.goto('/work')
  await ordinaryPage(page)
  await page.mouse.move(1, 500)
  const arrival = await navigate(
    page,
    '/solutions',
    async () => (await navLink(page, 'Solutions')).press('Enter'),
    info,
  )
  expect(arrival.readyNav).toEqual({ ...lightSkin, top: atTop })
  const reverse = await navigate(
    page,
    '/insights',
    async () => (await navLink(page, 'Insights')).press('Enter'),
    info,
  )
  expect(reverse.readyNav).toEqual({ ...darkSkin, top: atTop })

  await navigate(page, '/about', async () => (await navLink(page, 'About')).press('Enter'), info)
  await page.evaluate(() => scrollTo({ top: 800, behavior: 'instant' }))
  await expect.poll(async () => (await primary(page).boundingBox())!.y).toBe(pinned)
  const reset = await navigate(
    page,
    '/solutions',
    async () => (await navLink(page, 'Solutions')).press('Enter'),
    info,
  )
  expect(reset.readyNav).toEqual({ ...lightSkin, top: atTop })

  // A real scroll across surfaces still interpolates, after the route-only
  // instantaneous pass has ended. Record the running CSS transition itself.
  const scrollMotion = await page
    .locator('main section[data-surface="ink"]:visible')
    .first()
    .evaluate(async (section) => {
      const nav = document.querySelector('nav[aria-label="Primary"]')!
      const start = getComputedStyle(nav).color
      scrollTo({ top: section.getBoundingClientRect().top + scrollY + 150, behavior: 'instant' })
      return new Promise<{ start: string; intermediate: string; duration: number }>(
        (resolve, reject) => {
          let frames = 0
          const sample = () => {
            const transition = nav
              .getAnimations()
              .find(
                (animation) =>
                  animation instanceof CSSTransition &&
                  animation.transitionProperty === 'color' &&
                  animation.playState === 'running',
              )
            const color = getComputedStyle(nav).color
            if (transition && color !== start && color !== 'rgb(255, 255, 255)') {
              resolve({
                start,
                intermediate: color,
                duration: Number(transition.effect!.getComputedTiming().duration),
              })
            } else if (++frames < 90) requestAnimationFrame(sample)
            else reject(new Error('No interpolated nav color during the actual scroll'))
          }
          requestAnimationFrame(sample)
        },
      )
    })
  expect(scrollMotion.start).toBe('rgb(35, 35, 35)')
  expect(scrollMotion.duration).toBe(350)
  await info.attach('scroll-nav-transition', {
    body: JSON.stringify(scrollMotion),
    contentType: 'application/json',
  })
  await expect(primary(page)).toHaveCSS('color', 'rgb(255, 255, 255)')
  await page
    .locator('main section[data-surface="paper"]:visible')
    .first()
    .evaluate((section) =>
      scrollTo({ top: section.getBoundingClientRect().top + scrollY + 150, behavior: 'instant' }),
    )
  await expect(primary(page)).toHaveCSS('color', 'rgb(35, 35, 35)')
  const scrollBefore = await page.evaluate(() => scrollY)
  const work = await navigate(
    page,
    '/work',
    async () => (await navLink(page, 'Work')).click(),
    info,
  )
  expect(work.readyNav).toEqual({ ...darkSkin, top: atTop })
  const back = await navigate(page, '/solutions', () => page.goBack(), info)
  await info.attach('history-scroll', {
    body: JSON.stringify({ before: scrollBefore, after: await page.evaluate(() => scrollY) }),
    contentType: 'application/json',
  })
  // Native history scroll can land after the route's layout effect. Keep
  // first-frame colors strict, but let the existing scroll watcher settle
  // the pin. The separate deep-link case checks restoration itself strictly.
  expect(back.readyNav).toMatchObject(lightSkin)
  const backScroll = await page.evaluate(() => scrollY)
  await expect
    .poll(async () => (await primary(page).boundingBox())!.y)
    .toBe(desktop ? Math.max(32, 124 - backScroll) : 0)
  const forward = await navigate(page, '/work', () => page.goForward(), info)
  expect(forward.readyNav).toMatchObject(darkSkin)
  const forwardScroll = await page.evaluate(() => scrollY)
  await expect
    .poll(async () => (await primary(page).boundingBox())!.y)
    .toBe(desktop ? Math.max(32, 124 - forwardScroll) : 0)
})

test('a manual mobile menu exit finishes when reduced motion changes', async ({ page }, info) => {
  test.skip(
    info.project.use.viewport!.width >= 1024 ||
      info.project.use.contextOptions?.reducedMotion === 'reduce',
    'this case changes the preference during a mobile menu exit',
  )
  await page.goto('/')
  await primary(page).getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.waitForFunction(() =>
    document.getAnimations().some((animation) => {
      const target = (animation.effect as KeyframeEffect | null)?.target
      return (
        target?.getAttribute('role') === 'dialog' &&
        target.getAttribute('data-state') === 'closed' &&
        animation.playState === 'running'
      )
    }),
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await ordinaryPage(page)
  await expect(primary(page).getByRole('button', { name: 'Open menu' })).toBeFocused()
})

test('the mobile contact CTA keeps modified clicks native and closes for app navigation', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.use.viewport!.width >= 1024, 'the mobile contact CTA owns this modal')
  await page.goto('/')
  const contact = await navLink(page, 'Let’s talk')
  const opened = context.waitForEvent('page')
  await contact.click({ modifiers: ['ControlOrMeta'] })
  const otherTab = await opened
  await otherTab.waitForURL(/\/contact\/?$/)
  await otherTab.close()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('dialog')).toBeVisible()
  await contact.click()
  await expect(page).toHaveURL(/\/contact\/?$/)
  await ordinaryPage(page)
})

test('a direct request retains readable complete content without JavaScript', async ({
  browser,
  baseURL,
}, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: info.project.use.viewport!,
  })
  try {
    const page = await context.newPage()
    await page.goto(`${baseURL}${IRONMAN}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('IRONMAN')
    await expect(page.locator('main')).toHaveCSS('opacity', '1')
    await expect(page.locator('main h2').first()).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Footer', exact: true })).toBeAttached()
  } finally {
    await context.close()
  }
})

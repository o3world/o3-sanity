import { expect, type Locator, type Page, type TestInfo } from 'playwright/test'

type NavigationSample = {
  path: string
  clickedAt: number
  readyAt: number | null
  settledAt: number | null
  motionSeen: boolean
  longestDuration: number
  navMovement: number
  readyOpacity: number | null
  foregrounds: number
  unsafeForegrounds: number
  readyScrollY: number | null
  readyNav: {
    color: string
    background: string
    link: string
    inactiveLink: string | null
    button: string
    buttonBackground: string
    top: number
  } | null
}

declare global {
  interface Window {
    motionJourney: NavigationSample[]
  }
}

export const IRONMAN = '/work/case-studies-ironman-digital-experience-drupal-acquia'

export function primary(page: Page) {
  return page.getByRole('navigation', { name: 'Primary', exact: true })
}

export async function navLink(page: Page, name: string): Promise<Locator> {
  const menu = primary(page).getByRole('button', { name: 'Open menu' })
  if (await menu.isVisible()) {
    await menu.click()
    return page
      .getByRole('navigation', { name: 'Menu', exact: true })
      .getByRole('link', { name, exact: true })
  }
  return primary(page).getByRole('link', { name, exact: true })
}

export async function settled(page: Page) {
  await page.waitForFunction(
    () =>
      document.getAnimations().every((animation) => {
        const effect = animation.effect as KeyframeEffect | null
        if (animation instanceof CSSAnimation || animation instanceof CSSTransition) return true
        const isRoute =
          (effect?.target instanceof Element && effect.target.matches('[data-route-foreground]')) ||
          effect?.pseudoElement?.startsWith('::view-transition')
        return !isRoute || animation.playState === 'finished' || animation.playState === 'idle'
      }),
    null,
    { timeout: 1500 },
  )
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

export async function navigate(
  page: Page,
  path: string,
  action: () => Promise<unknown>,
  info: TestInfo,
) {
  const previousHeading = await page.getByRole('heading', { level: 1 }).innerText()
  await page.evaluate(
    ({ path, previousHeading }) => {
      const sample: NavigationSample = {
        path,
        clickedAt: performance.now(),
        readyAt: null,
        settledAt: null,
        motionSeen: false,
        longestDuration: 0,
        navMovement: 0,
        readyOpacity: null,
        foregrounds: 0,
        unsafeForegrounds: 0,
        readyScrollY: null,
        readyNav: null,
      }
      window.motionJourney ??= []
      window.motionJourney.push(sample)
      let firstBox: DOMRect | null = null
      let quietFrames = 0
      const frame = () => {
        const now = performance.now()
        const heading = [...document.querySelectorAll('main h1')].find((element) => {
          const box = element.getBoundingClientRect()
          return (
            box.width > 0 &&
            box.height > 0 &&
            getComputedStyle(element).visibility !== 'hidden' &&
            !element.closest('[aria-hidden="true"], [inert]')
          )
        })
        if (
          sample.readyAt === null &&
          location.pathname.replace(/\/$/, '') === path.replace(/\/$/, '') &&
          heading?.textContent?.trim() &&
          (heading as HTMLElement).innerText !== previousHeading
        ) {
          sample.readyAt = now
          sample.readyOpacity = Number(
            getComputedStyle(heading.closest('[data-route-foreground]') ?? heading).opacity,
          )
          sample.readyScrollY = scrollY
          const nav = document.querySelector('nav[aria-label="Primary"]')!
          const button = [...nav.querySelectorAll('a[href="/contact"]')].find(
            (element) => element.getBoundingClientRect().width > 0,
          )!
          const link = nav.querySelector('a[aria-label$=" home"]')!
          const inactiveLink = nav.querySelector('a[href="/about"]')!
          sample.readyNav = {
            color: getComputedStyle(nav).color,
            background: getComputedStyle(nav).backgroundColor,
            link: getComputedStyle(link).color,
            inactiveLink:
              inactiveLink.getBoundingClientRect().width > 0
                ? getComputedStyle(inactiveLink).color
                : null,
            button: getComputedStyle(button).color,
            buttonBackground: getComputedStyle(button).backgroundColor,
            top: nav.getBoundingClientRect().top,
          }
        }
        const animations = document.getAnimations().filter((animation) => {
          if (animation instanceof CSSAnimation || animation instanceof CSSTransition) return false
          const effect = animation.effect as KeyframeEffect | null
          return (
            ((effect?.target instanceof Element &&
              effect.target.matches('[data-route-foreground]')) ||
              effect?.pseudoElement?.startsWith('::view-transition')) &&
            animation.playState === 'running'
          )
        })
        if (animations.length) {
          sample.motionSeen = true
          sample.foregrounds = Math.max(sample.foregrounds, animations.length)
          for (const animation of animations) {
            const target = (animation.effect as KeyframeEffect | null)?.target
            if (
              target instanceof Element &&
              (target.querySelector('section[data-surface], [data-route-foreground]') ||
                getComputedStyle(target).backgroundColor !== 'rgba(0, 0, 0, 0)')
            )
              sample.unsafeForegrounds++
            const duration = animation.effect?.getComputedTiming().duration
            if (typeof duration === 'number')
              sample.longestDuration = Math.max(sample.longestDuration, duration)
          }
          const nav = document.querySelector('nav[aria-label="Primary"]')?.getBoundingClientRect()
          if (nav) {
            firstBox ??= nav
            // Scroll restoration can legitimately move the bar between its
            // utility-strip and pinned offsets. Its horizontal box stays fixed.
            sample.navMovement = Math.max(
              sample.navMovement,
              Math.abs(nav.x - firstBox.x),
              Math.abs(nav.width - firstBox.width),
              Math.abs(nav.height - firstBox.height),
            )
          }
        }
        quietFrames = animations.length ? 0 : quietFrames + 1
        if (sample.readyAt !== null && quietFrames >= 3) {
          sample.settledAt = now
          return
        }
        if (now - sample.clickedAt < 8000) requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    },
    { path, previousHeading },
  )

  await action()
  await page.waitForFunction(() => window.motionJourney.at(-1)?.readyAt != null, null, {
    timeout: 5000,
  })
  const ready = await page.evaluate(() => window.motionJourney.at(-1)!)
  expect(
    ready.readyAt! - ready.clickedAt,
    'destination readiness is independent of fade completion',
  ).toBeLessThan(1500)
  await page.waitForFunction(() => window.motionJourney.at(-1)?.settledAt != null, null, {
    timeout: 1500,
  })
  const result = await page.evaluate(() => window.motionJourney.at(-1)!)
  expect(result.longestDuration, 'route cadence stays at or below 350ms').toBeLessThanOrEqual(350)
  expect(
    result.unsafeForegrounds,
    'arrival targets are transparent foregrounds, never another authored band',
  ).toBe(0)
  expect(
    result.navMovement,
    'the pinned navigation stays still during route motion',
  ).toBeLessThanOrEqual(1)
  expect(
    result.readyOpacity,
    'ready content is never hidden behind the arrival',
  ).toBeGreaterThanOrEqual(0.72)
  if (info.project.use.contextOptions?.reducedMotion === 'reduce')
    expect(result.longestDuration).toBe(0)
  await settled(page)
  return result
}

export async function arrivalRunning(page: Page) {
  await page.waitForFunction(
    () =>
      document.getAnimations().some((animation) => {
        if (animation instanceof CSSAnimation || animation instanceof CSSTransition) return false
        const effect = animation.effect as KeyframeEffect | null
        return (
          effect?.target instanceof Element &&
          effect.target.matches('[data-route-foreground]') &&
          animation.playState === 'running'
        )
      }),
    null,
    { timeout: 1500 },
  )
}

export async function ordinaryPage(page: Page) {
  await settled(page)
  await expect(page.locator('main')).toHaveCSS('opacity', '1')
  for (const foreground of await page.locator('main [data-route-foreground]:visible').all()) {
    await expect(foreground).toHaveCSS('opacity', '1')
  }
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  expect(
    await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => {
          const effect = animation.effect as KeyframeEffect | null
          if (effect?.pseudoElement?.startsWith('::view-transition')) return true
          const target = effect?.target
          return (
            animation.playState === 'running' &&
            target instanceof HTMLElement &&
            target.closest('main') &&
            target.getClientRects().length === 0
          )
        }).length,
    ),
    'no snapshot overlay or hidden-route animation remains',
  ).toBe(0)
}

export async function watchNextPointer(page: Page, ignoreControl?: string) {
  await page.evaluate((ignoreControl) => {
    delete document.documentElement.dataset.pointerProof
    const record = (event: PointerEvent) => {
      const target = (event.target as Element).closest('a,button')
      const control = target?.getAttribute('aria-label') ?? target?.getAttribute('href')
      if (control === ignoreControl) return
      document.documentElement.dataset.pointerProof = JSON.stringify({
        trusted: event.isTrusted,
        control,
        opacity: Math.min(
          1,
          ...[...document.querySelectorAll('main [data-route-foreground]')]
            .filter((element) => element.getClientRects().length > 0)
            .map((element) => Number(getComputedStyle(element).opacity)),
        ),
      })
      document.removeEventListener('pointerdown', record)
    }
    document.addEventListener('pointerdown', record)
  }, ignoreControl)
}

export async function expectPointerDuringArrival(page: Page, control: string, info: TestInfo) {
  const proof = await page.evaluate(() =>
    JSON.parse(document.documentElement.dataset.pointerProof!),
  )
  await info.attach('input-during-arrival', {
    body: JSON.stringify(proof),
    contentType: 'application/json',
  })
  expect(proof.trusted).toBe(true)
  expect(proof.control).toBe(control)
  expect(proof.opacity).toBeGreaterThanOrEqual(0.72)
  if (info.project.use.contextOptions?.reducedMotion !== 'reduce')
    expect(proof.opacity).toBeLessThan(1)
}

export async function expectNoArrival(page: Page, action: () => Promise<unknown>) {
  const [minimumOpacity] = await Promise.all([
    page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const started = performance.now()
          let minimum = 1
          function frame() {
            minimum = Math.min(
              minimum,
              ...[...document.querySelectorAll('main [data-route-foreground]')]
                .filter((element) => element.getClientRects().length > 0)
                .map((element) => Number(getComputedStyle(element).opacity)),
            )
            if (performance.now() - started > 450) resolve(minimum)
            else requestAnimationFrame(frame)
          }
          requestAnimationFrame(frame)
        }),
    ),
    action(),
  ])
  expect(minimumOpacity, 'same-page navigation does not replay the route fade').toBe(1)
}

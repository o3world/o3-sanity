import { expect, test, type Page } from 'playwright/test'
import { navLink, ordinaryPage, primary } from './journey'

async function pixel(page: Page, image: Buffer) {
  return page.evaluate(async (base64) => {
    const image = new Image()
    image.src = `data:image/png;base64,${base64}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0)
    return [0, 550].map((y) => [...context.getImageData(0, y, 1, 1).data])
  }, image.toString('base64'))
}

test('authored ground does not flash while arrival content fades', async ({ page }, info) => {
  test.skip(info.project.use.contextOptions?.reducedMotion === 'reduce', 'requires active motion')
  await page.goto('/work')
  for (const name of [
    'Insights',
    'Work',
    'Solutions',
    'About',
    'Solutions',
    'Let’s talk',
    'Solutions',
  ]) {
    await (await navLink(page, name)).click()
    await page.waitForFunction(() =>
      document.getAnimations().some((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target
        return (
          target instanceof Element &&
          target.closest('main') &&
          !(animation instanceof CSSAnimation) &&
          !(animation instanceof CSSTransition) &&
          animation.playState === 'running'
        )
      }),
    )
    const clip = { x: 2, y: 250, width: 1, height: 551 }
    const arriving = await page.screenshot({ clip })
    const active = await page.evaluate(() =>
      document.getAnimations().some((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target
        return (
          target instanceof Element &&
          target.closest('main') &&
          !(animation instanceof CSSAnimation) &&
          !(animation instanceof CSSTransition) &&
          animation.playState === 'running'
        )
      }),
    )
    expect(active, 'the actual screenshot was taken during arrival').toBe(true)
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every(
          (animation) =>
            animation instanceof CSSAnimation ||
            animation instanceof CSSTransition ||
            animation.playState !== 'running',
        ),
    )
    const settled = await page.screenshot({ clip })
    const proof = {
      destination: name,
      arriving: await pixel(page, arriving),
      settled: await pixel(page, settled),
    }
    await info.attach('ground-pixels', {
      body: JSON.stringify(proof),
      contentType: 'application/json',
    })
    if (name === 'Insights' || name === 'Work') {
      expect(proof.settled[0]).toEqual([10, 10, 11, 255])
      // The same viewport contains a separate light feed ground, not one
      // destination-wide color placed behind the fading page.
      expect(proof.settled[1]).not.toEqual(proof.settled[0])
    }
    if (name === 'Solutions') expect(proof.settled[0]).toEqual([255, 255, 255, 255])
    if (name === 'About') expect(proof.settled[0]).toEqual([245, 244, 241, 255])
    expect(proof.arriving).toEqual(proof.settled)
  }
})

test('the home entrance remains the sole opacity owner on fresh and cached arrivals', async ({
  page,
}, info) => {
  test.skip(
    info.project.use.contextOptions?.reducedMotion === 'reduce',
    'requires existing entrance motion',
  )
  await page.goto('/work')
  for (const returnHome of [
    () =>
      primary(page)
        .getByRole('link', { name: / home$/ })
        .click(),
    () => page.goBack(),
  ]) {
    await returnHome()
    await expect(page).toHaveURL(/\/$/)
    const proof = await page.evaluate(() => {
      const heading = [...document.querySelectorAll('main h1')].find(
        (element) => element.getClientRects().length > 0,
      )!
      const foreground = heading.closest('[data-route-foreground]')!
      const animations = document
        .getAnimations()
        .filter((animation) => animation.playState === 'running')
      const route = animations.filter(
        (animation) =>
          !(animation instanceof CSSAnimation) &&
          !(animation instanceof CSSTransition) &&
          (animation.effect as KeyframeEffect)?.target === foreground,
      )
      const nested = animations.filter((animation) => {
        const effect = animation.effect as KeyframeEffect | null
        return (
          effect?.target instanceof Element &&
          foreground.contains(effect.target) &&
          effect.target !== foreground &&
          effect.getKeyframes().some((frame) => frame.opacity !== undefined)
        )
      })
      return {
        route: route.length,
        nested: nested.length,
        mainOpacity: getComputedStyle(document.querySelector('main')!).opacity,
      }
    })
    await info.attach('home-opacity-owners', {
      body: JSON.stringify(proof),
      contentType: 'application/json',
    })
    expect(proof.mainOpacity).toBe('1')
    expect(
      proof.route && proof.nested,
      'an existing home entrance never stacks with route opacity',
    ).toBe(0)
    expect(proof.route + proof.nested, 'home keeps an actual arrival cue').toBeGreaterThan(0)
    await ordinaryPage(page)
    await (await navLink(page, 'Work')).click()
    await ordinaryPage(page)
  }
})

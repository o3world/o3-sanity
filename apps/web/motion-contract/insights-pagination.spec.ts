import { expect, test } from 'playwright/test'

test('keyboard pagination moves focus to the refreshed feed', async ({ page }, info) => {
  await page.goto('/insights')
  const pager = page.getByRole('navigation', { name: 'Pagination' })
  await pager.getByRole('link', { name: 'Next', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/insights\/page\/2#feed$/)
  await expect(page.locator('#feed h2')).toBeFocused()
  await page.keyboard.press(info.project.use.browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  await expect(
    page
      .getByRole('navigation', { name: 'Filter by category' })
      .getByRole('link', { name: 'All', exact: true }),
  ).toBeFocused()
})

test('feed URL changes leave the retained page foregrounds alone', async ({ page }, info) => {
  await page.addInitScript(`
    window.arrivalCount = 0;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      if (this.matches('[data-route-foreground]')) window.arrivalCount++;
      return animate.apply(this, args);
    };
  `)
  await page.goto('/insights')
  const filters = page.getByRole('navigation', { name: 'Filter by category' })
  const hero = await page.getByRole('heading', { level: 1 }).elementHandle()
  for (const category of ['Design', 'All']) {
    await filters.getByRole('link', { name: category, exact: true }).click()
    await expect(page.locator('#feed h2')).toHaveText(`${category} insights`)
    await expect(page.locator('[data-insight-results]')).toHaveCSS(
      'animation-name',
      info.project.use.contextOptions?.reducedMotion === 'reduce'
        ? 'none'
        : 'insight-results-arrive',
    )
    expect(await hero!.evaluate((node) => node === document.querySelector('h1'))).toBe(true)
    expect(await page.evaluate('window.arrivalCount')).toBe(0)
  }
  await page
    .getByRole('navigation', { name: 'Pagination' })
    .getByRole('link', { name: 'Next', exact: true })
    .click()
  await expect(page).toHaveURL(/\/insights\/page\/2#feed$/)
  await expect(page.locator('#feed h2')).toBeFocused()
  await page.goBack()
  await expect(page).toHaveURL(/\/insights#feed$/)
  await page.goForward()
  await expect(page).toHaveURL(/\/insights\/page\/2#feed$/)
  expect(await page.evaluate('window.arrivalCount')).toBe(0)
})

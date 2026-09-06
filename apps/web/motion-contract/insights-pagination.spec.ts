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

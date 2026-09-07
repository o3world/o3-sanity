import { expect, test } from 'playwright/test'

test('Work cards are visible and navigable without JavaScript', async ({
  browser,
  baseURL,
}, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: info.project.use.viewport,
  })
  try {
    const page = await context.newPage()
    await page.goto(`${baseURL}/work`)
    const cards = page.locator('#feed a.rounded-case-card')
    await expect(cards.first()).toBeVisible()
    for (const card of await cards.all()) await expect(card).toBeVisible()
    const href = await cards.first().getAttribute('href')
    await cards.first().click()
    await expect(page).toHaveURL(`${baseURL}${href}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  } finally {
    await context.close()
  }
})

test('Insights pagination and category links work without JavaScript', async ({
  browser,
  baseURL,
}, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: info.project.use.viewport,
  })
  try {
    const page = await context.newPage()
    await page.goto(`${baseURL}/insights`)
    const cards = page.locator('[data-insight-results] li a')
    await expect(cards.first()).toBeVisible()
    const firstPageHref = await cards.first().getAttribute('href')

    await page
      .getByRole('navigation', { name: 'Pagination' })
      .getByRole('link', { name: 'Next', exact: true })
      .click()
    await expect(page).toHaveURL(/\/insights\/page\/2#feed$/)
    await expect(cards.first()).toBeVisible()
    expect(await cards.first().getAttribute('href')).not.toBe(firstPageHref)
    for (const card of await cards.all()) await expect(card).toBeVisible()

    const lastPageHref = await page
      .getByRole('navigation', { name: 'Pagination' })
      .getByRole('link', { name: /^Page / })
      .last()
      .getAttribute('href')
    await page.goto(`${baseURL}${lastPageHref}`)
    await expect(cards.first()).toBeVisible()
    for (const card of await cards.all()) await expect(card).toBeVisible()

    await page
      .getByRole('navigation', { name: 'Filter by category' })
      .getByRole('link', { name: 'Design', exact: true })
      .click()
    await expect(page).toHaveURL(/\/insights\/category\/design#feed$/)
    await expect(page.locator('#feed h2')).toHaveText('Design insights')
    await expect(cards.first()).toBeVisible()
    const href = await cards.first().getAttribute('href')
    await cards.first().click()
    await expect(page).toHaveURL(`${baseURL}${href}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  } finally {
    await context.close()
  }
})

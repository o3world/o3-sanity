import assert from 'node:assert/strict'
import { URL } from 'node:url'
import { chromium } from 'playwright'

const origin = new URL(process.argv[2]).origin
const paths = ['/about', '/solutions', '/contact']
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const statuses = new Map()
  page.on('response', (response) => {
    const request = response.request()
    const headers = request.headers()
    const url = new URL(response.url())
    if (
      url.origin === origin &&
      paths.includes(url.pathname) &&
      headers['next-router-prefetch'] === '1' &&
      headers['next-router-segment-prefetch']?.endsWith('/__PAGE__')
    )
      statuses.set(url.pathname, response.status())
  })
  await page.goto(origin)
  const deadline = Date.now() + 20_000
  while (statuses.size < paths.length && Date.now() < deadline) await page.waitForTimeout(100)
  assert.deepEqual(
    Object.fromEntries(statuses),
    Object.fromEntries(paths.map((path) => [path, 200])),
  )
  console.log('PASS: About, Solutions and Contact page-segment prefetches returned 200.')
} finally {
  await browser.close()
}

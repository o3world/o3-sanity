import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { defineConfig } from 'playwright/test'

const envFile = resolve(__dirname, '../../../.env')
if (existsSync(envFile)) loadEnvFile(envFile)
const port = Number(process.env.MOTION_CONTRACT_PORT ?? process.env.WEB_PORT ?? 3600)
if (!Number.isInteger(port) || port < 3600 || port > 3609) {
  throw new Error('Use an O3 Sanity-registered localhost port (3600–3609)')
}
const baseURL = `http://localhost:${port}`
const output = resolve(__dirname, '../../../test_output/motion-contract')

export default defineConfig({
  testDir: __dirname,
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 5000 },
  outputDir: resolve(output, 'results'),
  reporter: [
    ['list'],
    ['json', { outputFile: resolve(output, 'results.json') }],
    ['html', { outputFolder: resolve(output, 'report'), open: 'never' }],
  ],
  use: {
    baseURL,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: (['chromium', 'webkit', 'firefox'] as const).flatMap((browserName) =>
    (['desktop', 'mobile'] as const).flatMap((viewport) =>
      (['no-preference', 'reduce'] as const).map((reducedMotion) => ({
        name: `${browserName}-${viewport}-${reducedMotion}`,
        use: {
          browserName,
          viewport:
            viewport === 'desktop' ? { width: 1440, height: 1000 } : { width: 402, height: 874 },
          contextOptions: { reducedMotion, hasTouch: viewport === 'mobile' },
        },
      })),
    ),
  ),
  webServer: {
    command: `pnpm exec next start -H localhost -p ${port}`,
    cwd: resolve(__dirname, '..'),
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
})

import { afterEach, describe, expect, it, vi } from 'vitest'

import { absoluteUrl, getBaseUrl } from './base-url'

function env(vars: Record<string, string | undefined>) {
  for (const key of [
    'NEXT_PUBLIC_BASE_URL',
    'VERCEL_ENV',
    'VERCEL_PROJECT_PRODUCTION_URL',
    'VERCEL_URL',
  ]) {
    vi.stubEnv(key, vars[key] ?? '')
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getBaseUrl', () => {
  it('answers the configured origin, without a trailing slash', () => {
    env({ NEXT_PUBLIC_BASE_URL: 'https://www.example.com/', VERCEL_ENV: 'production' })
    expect(getBaseUrl()).toBe('https://www.example.com')
  })

  it('refuses a production build with no configured origin', () => {
    env({ VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'example.vercel.app' })
    expect(() => getBaseUrl()).toThrow(/NEXT_PUBLIC_BASE_URL/)
  })

  it('falls back to localhost outside production', () => {
    env({ VERCEL_ENV: 'preview' })
    expect(getBaseUrl()).toMatch(/^http:\/\/localhost:\d+$/)
  })
})

describe('absoluteUrl', () => {
  it('joins a path to the origin, and gives the homepage its trailing slash', () => {
    expect(absoluteUrl('/insights/foo', 'https://www.example.com')).toBe(
      'https://www.example.com/insights/foo',
    )
    expect(absoluteUrl('/', 'https://www.example.com')).toBe('https://www.example.com/')
  })

  it('defaults to the configured origin', () => {
    env({ NEXT_PUBLIC_BASE_URL: 'https://www.example.com' })
    expect(absoluteUrl('/work')).toBe('https://www.example.com/work')
  })
})

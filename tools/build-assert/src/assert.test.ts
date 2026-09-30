import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, beforeEach, expect, it } from 'vitest'

/**
 * The CLI's exit codes, end to end: the process `pnpm build:assert` runs.
 * What the readers accept is `build-output.test.ts`, in process.
 */

const toolDir = dirname(fileURLToPath(import.meta.url))
let fixture: string

beforeEach(() => {
  fixture = mkdtempSync(join(tmpdir(), 'build-assert-'))
  const pages = ['/', '/[...path]', '/insights/[slug]', '/work/[slug]', '/studio/[[...tool]]']
  const handlers = [
    '/api/draft-mode/disable',
    '/api/draft-mode/enable',
    '/api/revalidate',
    '/api/contact',
  ]
  writeJson(
    'current/app-path-routes-manifest.json',
    Object.fromEntries([...pages, ...handlers].map((route) => [route, route])),
  )
  writeJson('current/prerender-manifest.json', {
    routes: { '/': {} },
    dynamicRoutes: Object.fromEntries(pages.slice(1).map((route) => [route, { fallback: null }])),
  })
  writeJson('current/required-server-files.json', { config: { cacheComponents: true } })
  writeBundles('current', 716_786)
  writeBundles('baseline', 696_786)
})

afterEach(() => rmSync(fixture, { recursive: true, force: true }))

function writeJson(path: string, value: unknown): void {
  const target = join(fixture, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, JSON.stringify(value))
}

function writeBundles(build: string, homeBytes: number): void {
  writeJson(`${build}/diagnostics/route-bundle-stats.json`, [
    { route: '/', firstLoadUncompressedJsBytes: homeBytes, firstLoadChunkPaths: [] },
    {
      route: '/studio/[[...tool]]',
      firstLoadUncompressedJsBytes: 8_797_491,
      firstLoadChunkPaths: [],
    },
  ])
}

function run(...args: string[]) {
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', join(toolDir, 'assert.ts'), join(fixture, 'current'), ...args],
    {
      cwd: join(toolDir, '..'),
      encoding: 'utf8',
      timeout: 10_000,
    },
  )
  return { status: result.status, output: result.stdout + result.stderr }
}

it('fails the CLI for 20 KB of growth below the ceiling and names the route and comparison', () => {
  const result = run('--baseline-dist', join(fixture, 'baseline'))

  expect(result.status).toBe(1)
  expect(result.output).toContain('/ grew from 696,786 to 716,786')
  expect(result.output).toContain('+20,000')
  expect(result.output).toContain('10,000')
})

it('keeps the absolute-only command compatible and reports a passing comparison', () => {
  expect(run().status).toBe(0)
  writeBundles('current', 706_786)
  const result = run('--baseline-dist', join(fixture, 'baseline'))

  expect(result.status).toBe(0)
  expect(result.output).toContain('Base 696,786 → current 706,786; delta +10,000 bytes')
})

it('fails when a requested baseline is missing or unnamed instead of falling back to the ceiling', () => {
  rmSync(join(fixture, 'baseline'), { recursive: true })
  const missing = run('--baseline-dist', join(fixture, 'baseline'))

  expect(missing.status).toBe(1)
  expect(missing.output).toContain('route-bundle-stats.json')
  expect(run('--baseline-dist').status).toBe(1)
})

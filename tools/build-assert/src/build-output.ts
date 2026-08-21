import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { RouteBundle } from './bundle'
import type { PrerenderManifest, RenderingOutput } from './rendering'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

/** Where `pnpm --filter @o3/web build` leaves its output. */
const WEB_DIST_DIR = join(REPO_ROOT, 'apps', 'web', '.next')

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

/** Everything the assertions read, each taking the slice it needs. */
export interface BuildOutput extends RenderingOutput {
  /** Per route, what the browser loads before the page is interactive. */
  routeBundles: RouteBundle[]
}

/**
 * The four files the assertions read, narrowed to the fields they use.
 *
 * `required-server-files.json` carries the resolved `next.config.ts` — which
 * is how the assertion knows whether Cache Components is on without importing
 * the config or being told. `diagnostics/route-bundle-stats.json` is Next's
 * own per-route bundle accounting, which is what the JS budget is held to.
 */
export function readBuildOutput(distDir: string = WEB_DIST_DIR): BuildOutput {
  const appPathRoutes = join(distDir, 'app-path-routes-manifest.json')
  const prerender = join(distDir, 'prerender-manifest.json')
  const requiredServerFiles = join(distDir, 'required-server-files.json')
  const routeBundles = join(distDir, 'diagnostics', 'route-bundle-stats.json')

  for (const file of [appPathRoutes, prerender, requiredServerFiles, routeBundles]) {
    if (existsSync(file)) continue
    throw new Error(`${file} is missing — run \`pnpm --filter @o3/web build\` first.`)
  }

  const { config } = readJson<{ config: { cacheComponents?: boolean } }>(requiredServerFiles)

  return {
    cacheComponents: config.cacheComponents === true,
    appPathRoutes: readJson<Record<string, string>>(appPathRoutes),
    prerender: readJson<PrerenderManifest>(prerender),
    routeBundles: readJson<RouteBundle[]>(routeBundles),
  }
}

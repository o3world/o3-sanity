/**
 * Building and serving a checkout's Storybook.
 *
 * A static build rather than the dev server, on both sides: the dev server's
 * on-demand transform means the first story to load carries a compile pause the
 * others do not, and a screenshot taken during it is a screenshot of a
 * half-styled page. A build here takes about twelve seconds.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

/** One entry of Storybook's `index.json`. */
export interface StoryEntry {
  id: string
  name: string
  title: string
  importPath: string
  tags?: string[]
  type: string
}

/**
 * `preview-stats.json` — the module graph, in webpack's shape even under the
 * Vite builder. `reasons` are the modules that import this one, which is the
 * direction a "what does this file affect?" question runs in.
 */
export interface StatsModule {
  id: string
  name?: string
  reasons?: { moduleName?: string }[]
}

export function buildStorybook(checkoutRoot: string, outDir: string, verbose: boolean) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      'pnpm',
      ['exec', 'storybook', 'build', '--stats-json', '--quiet', '--output-dir', outDir],
      {
        cwd: path.join(checkoutRoot, 'apps', 'storybook'),
        stdio: verbose ? 'inherit' : ['ignore', 'pipe', 'pipe'],
      },
    )
    let output = ''
    child.stdout?.on('data', (chunk) => (output += chunk))
    child.stderr?.on('data', (chunk) => (output += chunk))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) return resolve()
      reject(new Error(`storybook build failed in ${checkoutRoot}\n\n${output.slice(-4000)}`))
    })
  })
}

export function readIndex(buildDir: string): StoryEntry[] {
  const index = JSON.parse(fs.readFileSync(path.join(buildDir, 'index.json'), 'utf8'))
  return Object.values(index.entries as Record<string, StoryEntry>).filter(
    (entry) => entry.type === 'story',
  )
}

export function readStats(buildDir: string): StatsModule[] {
  const stats = JSON.parse(fs.readFileSync(path.join(buildDir, 'preview-stats.json'), 'utf8'))
  return (stats.modules ?? []) as StatsModule[]
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
}

/**
 * Thirty lines of static file server, because the alternative is a dependency
 * and `file://` will not do: Storybook's preview is an ES module, and a module
 * loaded from a file URL is blocked by CORS before it renders anything.
 */
export async function serve(dir: string): Promise<{ url: string; close: () => Promise<void> }> {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/')
    const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '')
    const target = path.join(dir, relative)
    // Everything is our own build output, but a served directory still deserves
    // the one line that stops `..` from walking out of it.
    if (!target.startsWith(dir) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      res.writeHead(404).end('not found')
      return
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    })
    fs.createReadStream(target).pipe(res)
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('static server has no port')

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  }
}

import { spawn, type ChildProcess } from 'node:child_process'
import net from 'node:net'
import { parseArgs } from 'node:util'

import { THROTTLE } from './config'
import { probe } from './probe'
import { formatReport, stable } from './report'

const HELP = `
pnpm perf — two throttled cold loads of four representative O3 routes

  pnpm --filter @o3/web build
  pnpm perf
  pnpm perf -- --url https://production-alias.example

Options
  --url <origin>   measure a deployed production alias instead of starting apps/web/.next
  --help           show this help
`

function availablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (address === null || typeof address === 'string') {
        server.close()
        reject(new Error('could not reserve a port for the built app'))
        return
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)))
    })
  })
}

async function waitUntilReady(
  url: string,
  child: ChildProcess,
  output: () => string,
): Promise<void> {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`built app exited before it was ready\n\n${output().slice(-4000)}`)
    }
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // The process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`built app did not answer ${url} within 30 seconds\n\n${output().slice(-4000)}`)
}

function stop(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null) return resolve()
    child.once('close', () => resolve())
    child.kill('SIGTERM')
  })
}

async function startBuiltApp(): Promise<{
  url: string
  close: () => Promise<void>
}> {
  const port = await availablePort()
  const url = `http://127.0.0.1:${port}`
  const child = spawn(
    'pnpm',
    ['--filter', '@o3/web', 'exec', 'next', 'start', '-H', '127.0.0.1', '-p', String(port)],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let output = ''
  child.stdout?.on('data', (chunk) => (output += chunk))
  child.stderr?.on('data', (chunk) => (output += chunk))
  try {
    await waitUntilReady(url, child, () => output)
  } catch (error) {
    await stop(child)
    throw error
  }

  return {
    url,
    close: () => stop(child),
  }
}

function targetOrigin(raw: string): string {
  const url = new URL(raw)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('--url must use http or https')
  return url.origin
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  // `pnpm perf -- --url …` preserves its separator through the filtered
  // workspace script. Accept that conventional spelling as well as
  // `pnpm perf --url …`.
  if (args[0] === '--') args.shift()
  const { values } = parseArgs({
    args,
    options: {
      url: { type: 'string' },
      help: { type: 'boolean', default: false },
    },
    allowPositionals: false,
  })

  if (values.help) {
    process.stdout.write(HELP)
    return
  }

  const local = values.url ? null : await startBuiltApp()
  const baseUrl = values.url ? targetOrigin(values.url) : (local?.url ?? '')

  try {
    process.stdout.write(`Measuring two consecutive cold loads at ${THROTTLE.cpuRate}x CPU...\n`)
    const rows = await probe(baseUrl)
    process.stdout.write(`\n${formatReport(rows, baseUrl)}\n`)
    if (!rows.every(stable)) process.exitCode = 1
  } finally {
    await local?.close()
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})

import { execFileSync } from 'node:child_process'

const SITE_ENV = 'o3-world.live'

/**
 * Run a PHP snippet on the live WordPress via `terminus wp eval` and parse
 * its JSON stdout. The snippet must `echo json_encode(...)` exactly once and
 * must not contain single quotes (terminus passes it through a remote shell).
 */
export function wpEval<T>(php: string): T {
  if (php.includes("'")) {
    throw new Error('PHP snippet must not contain single quotes (remote shell quoting)')
  }
  const oneLine = php.replace(/\s*\n\s*/g, ' ')
  const out = execFileSync('terminus', ['wp', SITE_ENV, '--', 'eval', oneLine], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const start =
    out.indexOf('{') === -1
      ? out.indexOf('[')
      : Math.min(...['{', '['].map((c) => out.indexOf(c)).filter((i) => i !== -1))
  if (start === -1) throw new Error(`No JSON in wp eval output:\n${out.slice(0, 500)}`)
  return JSON.parse(out.slice(start)) as T
}

export const SOURCE = SITE_ENV

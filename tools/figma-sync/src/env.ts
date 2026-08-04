import { existsSync, readFileSync } from 'node:fs'

import { WEB_ENV_LOCAL } from './paths'

/**
 * The same sourcing trick as `scripts/figma-mcp.sh`: the token lives in Vercel
 * as a development env var, `pnpm env:pull` writes it to `apps/web/.env.local`,
 * and an already-exported `FIGMA_API_KEY` wins over the file.
 */
export function readFigmaToken(): string {
  const fromEnv = process.env.FIGMA_API_KEY?.trim()
  if (fromEnv) return fromEnv

  if (existsSync(WEB_ENV_LOCAL)) {
    for (const line of readFileSync(WEB_ENV_LOCAL, 'utf8').split('\n')) {
      if (!line.startsWith('FIGMA_API_KEY=')) continue
      const value = line.slice('FIGMA_API_KEY='.length).trim().replace(/^"|"$/g, '')
      if (value) return value
    }
  }

  throw new Error(
    'FIGMA_API_KEY not found (checked the environment and apps/web/.env.local).\n' +
      'Run: pnpm env:pull',
  )
}

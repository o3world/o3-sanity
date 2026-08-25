import { existsSync, readFileSync } from 'node:fs'

import { WEB_ENV_LOCAL } from './paths'

/** Where a token was found, so a 403 can name the file to fix. */
export type FigmaTokenSource = 'apps/web/.env.local' | 'FIGMA_API_KEY'

export interface FigmaToken {
  value: string
  source: FigmaTokenSource
}

/**
 * `apps/web/.env.local` wins over an exported `FIGMA_API_KEY`. The file is the
 * one this repo provisions (`pnpm env:pull`); an ambient variable belongs to
 * whichever project exported it, so it is the weaker claim on which token this
 * repo means.
 */
export function readFigmaTokenWithSource(): FigmaToken {
  if (existsSync(WEB_ENV_LOCAL)) {
    for (const line of readFileSync(WEB_ENV_LOCAL, 'utf8').split('\n')) {
      if (!line.startsWith('FIGMA_API_KEY=')) continue
      const value = line.slice('FIGMA_API_KEY='.length).trim().replace(/^"|"$/g, '')
      if (value) return { value, source: 'apps/web/.env.local' }
    }
  }

  const fromEnv = process.env.FIGMA_API_KEY?.trim()
  if (fromEnv) return { value: fromEnv, source: 'FIGMA_API_KEY' }

  throw new Error(
    'FIGMA_API_KEY not found (checked apps/web/.env.local, then the environment).\n' +
      'Run: pnpm env:pull',
  )
}

export function readFigmaToken(): string {
  return readFigmaTokenWithSource().value
}

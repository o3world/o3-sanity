import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

import {
  DATASETS,
  DEFAULT_DATASET,
  PROJECT_ID,
  resolveDataset,
  resolveProjectId,
} from './constants'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

const original = process.env.NEXT_PUBLIC_SANITY_DATASET
afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_SANITY_DATASET
  else process.env.NEXT_PUBLIC_SANITY_DATASET = original
})

/**
 * The dataset default is a safety property, not a preference.
 *
 * `pnpm --filter migration load` deletes and rewrites documents, and its CLI
 * config used to read a `SANITY_DATASET` variable that nothing in the repo set
 * — so an unconfigured checkout wrote to the live dataset. These tests pin the
 * fix: unset means scratch, and production is only ever reached by asking.
 */
describe('the dataset an unconfigured checkout resolves to', () => {
  it('is development, never production', () => {
    expect(DEFAULT_DATASET).toBe('development')
  })

  it('is what resolveDataset returns when the variable is unset', () => {
    delete process.env.NEXT_PUBLIC_SANITY_DATASET
    expect(resolveDataset()).toBe('development')
  })

  it('is what resolveDataset returns when the variable is set but empty', () => {
    // `vercel env pull` can leave an empty assignment behind; `??` would have
    // let that through as a valid dataset name and failed at the API instead.
    process.env.NEXT_PUBLIC_SANITY_DATASET = ''
    expect(resolveDataset()).toBe('development')
  })

  it('yields to an explicit value, which is how CI and deploys reach production', () => {
    process.env.NEXT_PUBLIC_SANITY_DATASET = 'production'
    expect(resolveDataset()).toBe('production')
  })

  it('is a dataset the project actually declares', () => {
    expect(DATASETS).toContain(DEFAULT_DATASET)
  })
})

describe('resolveProjectId', () => {
  it('falls back to the committed project id', () => {
    expect(resolveProjectId()).toBe(PROJECT_ID)
  })
})

/**
 * `scripts/switch-dataset.sh` validates its argument against a hardcoded list,
 * because a bash script cannot import a TypeScript const. This is the seam
 * that keeps the two in step — add a dataset to `DATASETS` without adding it
 * to the script and `pnpm dataset <name>` would reject a name the code
 * accepts.
 */
describe('scripts/switch-dataset.sh', () => {
  const script = readFileSync(resolve(repoRoot, 'scripts/switch-dataset.sh'), 'utf8')

  it('knows exactly the datasets DATASETS declares', () => {
    const known = /^KNOWN=\(([^)]*)\)/m.exec(script)?.[1]
    expect(known, 'KNOWN=(...) not found in the script').toBeDefined()
    expect(known!.trim().split(/\s+/).sort()).toEqual([...DATASETS].sort())
  })

  it('writes the same variable name every entry point reads', () => {
    expect(/^VAR=NEXT_PUBLIC_SANITY_DATASET$/m.test(script)).toBe(true)
  })
})

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { brandConfig } from './brand'
import { COLLECTION_PREFIXES, readsNeedToken, resolveDataset, resolveProjectId } from './constants'

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
})

/**
 * `readsNeedToken` is what the web app's fetch checks before it believes an
 * empty answer, because Content Lake answers a private dataset's anonymous
 * query with `200 {"result": null}` rather than a 401 (#100). An unconfigured
 * checkout has no `SANITY_API_READ_TOKEN`, so the dataset it lands on by
 * default has to be one that reads without one — otherwise every query comes
 * back empty and nothing in the log says why.
 */
describe('which datasets a tokenless read can trust', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('reads the dataset an unconfigured checkout lands on without a token', () => {
    // "Unconfigured" means the variable is unset — CI's test job sets it to a
    // literal for module-level config validation, so clear it here.
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', '')
    expect(readsNeedToken(resolveDataset())).toBe(false)
  })

  it('does not need one for a public dataset', () => {
    expect(readsNeedToken('production')).toBe(false)
  })

  it('treats a dataset nobody has vouched for as needing one', () => {
    // Fail closed: an unknown name is more likely a private scratch dataset
    // than a public one, and being wrong the other way is silent.
    expect(readsNeedToken('scratch-2026')).toBe(true)
  })

  it('answers for the brand this process runs as, not for o3', () => {
    // o3xo's project has no `development` dataset at all, so o3's answer for
    // that name is not o3xo's.
    vi.stubEnv('NEXT_PUBLIC_BRAND', 'o3xo')
    expect(readsNeedToken('development')).toBe(true)
    expect(readsNeedToken('production')).toBe(false)
  })
})

describe('the project a Sanity entry point talks to', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is the brand’s own, with nothing set', () => {
    // CI sets NEXT_PUBLIC_SANITY_PROJECT_ID to a literal for module-level
    // config validation (checks.yml); the fallback only shows with it unset.
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', '')
    expect(resolveProjectId()).toBe('naorcr6k')
  })

  it('prefers the environment when set', () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'from-env')
    expect(resolveProjectId()).toBe('from-env')
  })

  it('is o3xo’s project, and o3xo’s dataset, when the brand is o3xo', () => {
    vi.stubEnv('NEXT_PUBLIC_BRAND', 'o3xo')
    // Set, and deliberately ignored: o3's variables are not o3xo's.
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'naorcr6k')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'development')
    vi.stubEnv('XO_SANITY_PROJECT_ID', '')
    vi.stubEnv('XO_SANITY_DATASET', '')

    expect(resolveProjectId()).toBe('tunpgire')
    expect(resolveDataset()).toBe('production')
  })
})

/**
 * The prefix table is a brand fact (ADR 0028) and this is the current brand's
 * view of it — which is what every route, the sitemap and the redirect map
 * read.
 */
describe('where a collection serves', () => {
  it('is o3’s prefixes in the o3 app', () => {
    expect(COLLECTION_PREFIXES).toEqual({ insight: '/insights', caseStudy: '/work' })
  })

  it('is the same table brand config declares', () => {
    const { collections } = brandConfig('o3')
    expect(COLLECTION_PREFIXES).toEqual({
      insight: collections.insight.prefix,
      caseStudy: collections.caseStudy.prefix,
    })
  })
})

/**
 * `scripts/switch-dataset.sh` validates its argument against a hardcoded list,
 * because a bash script cannot import a TypeScript const. This is the seam
 * that keeps the two in step — add a dataset to o3's brand config without
 * adding it to the script and `pnpm dataset <name>` would reject a name the
 * code accepts. The script switches o3's dataset: it writes o3's variable.
 */
describe('scripts/switch-dataset.sh', () => {
  const script = readFileSync(resolve(repoRoot, 'scripts/switch-dataset.sh'), 'utf8')

  it('knows exactly the datasets o3’s project has', () => {
    const known = /^KNOWN=\(([^)]*)\)/m.exec(script)?.[1]
    expect(known, 'KNOWN=(...) not found in the script').toBeDefined()
    expect(known!.trim().split(/\s+/).sort()).toEqual([...brandConfig('o3').datasets].sort())
  })

  it('writes the same variable name every entry point reads', () => {
    expect(/^VAR=NEXT_PUBLIC_SANITY_DATASET$/m.test(script)).toBe(true)
  })
})

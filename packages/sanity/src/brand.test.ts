import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  brandConfig,
  collectionPrefixes,
  readsNeedToken,
  resolveDataset,
  resolveProjectId,
} from './brand'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

afterEach(() => vi.unstubAllEnvs())

describe('the site a checkout runs as when nothing says otherwise', () => {
  it('carries the project and prefixes the code shipped with', () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', '')

    const config = brandConfig()

    expect(config.projectId).toBe('naorcr6k')
    expect(config.domain).toBe('o3world.com')
    expect(config.collections.insight.prefix).toBe('/insights')
    expect(config.collections.caseStudy.prefix).toBe('/work')
  })
})

describe('the environment the config reads', () => {
  it('lets the environment override the project and dataset', () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'from-env')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'production')

    expect(brandConfig()).toMatchObject({ projectId: 'from-env', dataset: 'production' })
  })

  it('treats an empty assignment as unset, because `vercel env pull` leaves those behind', () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', '')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', '')

    expect(brandConfig()).toMatchObject({ projectId: 'naorcr6k', dataset: 'development' })
  })
})

/**
 * The dataset default is a safety property, not a preference.
 *
 * A CLI config once read a `SANITY_DATASET` variable that nothing in the repo
 * set, so an unconfigured checkout wrote to the live dataset. These tests pin
 * the fix: unset means scratch, and production is only ever reached by asking.
 */
describe('the dataset an unconfigured checkout resolves to', () => {
  it('is what resolveDataset returns when the variable is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', undefined)
    expect(resolveDataset()).toBe('development')
  })

  it('is what resolveDataset returns when the variable is set but empty', () => {
    // `vercel env pull` can leave an empty assignment behind; `??` would have
    // let that through as a valid dataset name and failed at the API instead.
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', '')
    expect(resolveDataset()).toBe('development')
  })

  it('yields to an explicit value, which is how CI and deploys reach production', () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'production')
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
})

describe('the project a Sanity entry point talks to', () => {
  it('is the site’s own, with nothing set', () => {
    // CI sets NEXT_PUBLIC_SANITY_PROJECT_ID to a literal for module-level
    // config validation (checks.yml); the fallback only shows with it unset.
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', '')
    expect(resolveProjectId()).toBe('naorcr6k')
  })

  it('prefers the environment when set', () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'from-env')
    expect(resolveProjectId()).toBe('from-env')
  })
})

/**
 * `collectionPrefixes` is the flattened view of the collections table that
 * every route, the sitemap and the redirect map read. A function, not a module
 * constant: the knob entry ships this package's modules to the browser, and a
 * constant would read the environment at import time (#288).
 */
describe('where a collection serves', () => {
  it('is the site’s prefixes', () => {
    expect(collectionPrefixes()).toEqual({ insight: '/insights', caseStudy: '/work' })
  })

  it('is the same table brand config declares', () => {
    const { collections } = brandConfig()
    expect(collectionPrefixes()).toEqual({
      insight: collections.insight.prefix,
      caseStudy: collections.caseStudy.prefix,
    })
  })
})

/**
 * `scripts/switch-dataset.sh` validates its argument against a hardcoded list,
 * because a bash script cannot import a TypeScript const. This is the seam
 * that keeps the two in step — add a dataset to brand config without adding
 * it to the script and `pnpm dataset <name>` would reject a name the code
 * accepts.
 */
describe('scripts/switch-dataset.sh', () => {
  const script = readFileSync(resolve(repoRoot, 'scripts/switch-dataset.sh'), 'utf8')

  it('knows exactly the datasets the project has', () => {
    const known = /^KNOWN=\(([^)]*)\)/m.exec(script)?.[1]
    expect(known, 'KNOWN=(...) not found in the script').toBeDefined()
    expect(known!.trim().split(/\s+/).sort()).toEqual([...brandConfig().datasets].sort())
  })

  it('writes the same variable name every entry point reads', () => {
    expect(/^VAR=NEXT_PUBLIC_SANITY_DATASET$/m.test(script)).toBe(true)
  })
})

describe('the datasets the project has', () => {
  it('is the live dataset and the scratch one, both public', () => {
    const { datasets, publicDatasets } = brandConfig()
    expect([...datasets]).toEqual(['production', 'development'])
    expect([...publicDatasets]).toEqual(['production', 'development'])
  })

  it('includes the dataset it falls back to, or the fallback is unreachable', () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', '')
    const config = brandConfig()
    expect(config.datasets).toContain(config.dataset)
  })

  it('vouches only for datasets the project declares', () => {
    const config = brandConfig()
    expect(config.datasets).toEqual(expect.arrayContaining([...config.publicDatasets]))
  })
})

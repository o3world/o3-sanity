import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  BRANDS,
  brandConfig,
  collectionPrefixes,
  currentBrand,
  readsNeedToken,
  resolveDataset,
  resolveProjectId,
} from './brand'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

afterEach(() => vi.unstubAllEnvs())

/** A checkout with nothing set is the o3 site, exactly as it was before brands existed. */
describe('the brand a process runs as when nothing says otherwise', () => {
  it('is o3, carrying the project and prefixes the code shipped with', () => {
    vi.stubEnv('NEXT_PUBLIC_BRAND', '')
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', '')

    const config = brandConfig()

    expect(config.brand).toBe('o3')
    expect(config.projectId).toBe('naorcr6k')
    expect(config.collections.insight.prefix).toBe('/insights')
    expect(config.collections.caseStudy.prefix).toBe('/work')
  })
})

/**
 * o3xo's project is its own, with its own members — the whole reason the
 * brands do not share one (ADR 0028). Its prefixes differ from o3's at exactly
 * one collection: case studies serve at `/case-studies`, insights at
 * `/insights` for both.
 */
describe('o3xo', () => {
  it('is its own Sanity project on its own domain', () => {
    vi.stubEnv('XO_SANITY_PROJECT_ID', '')

    const config = brandConfig('o3xo')

    expect(config.projectId).toBe('tunpgire')
    expect(config.domain).toBe('o3xo.ai')
  })

  it('serves case studies at /case-studies and shares /insights with o3', () => {
    expect(brandConfig('o3xo').collections).toEqual({
      insight: { prefix: '/insights', title: 'Insights' },
      caseStudy: { prefix: '/case-studies', title: 'Case studies' },
    })
  })

  /**
   * o3xo.ai is dateless by design, and its migrated insights carry a synthetic
   * `publishedAt` that exists to order the collection (#218). A rendered date
   * would assert a publication nobody published, so the brand says it prints
   * none and every surface that draws one asks.
   */
  it('prints no publication date, because its source publishes none', () => {
    expect(brandConfig('o3xo').showsPublishDates).toBe(false)
    expect(brandConfig('o3').showsPublishDates).toBe(true)
  })
})

/**
 * Each brand owns its own variable names, so one checkout can hold both
 * brands' settings at once — which the repo root's `.env.local` already does.
 * A shared name would mean `pnpm dataset production` silently re-pointing the
 * other brand's Studio at a dataset its project does not have.
 */
describe('the environment a brand reads', () => {
  it('lets o3 override its project and dataset the way it always has', () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'from-env')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'production')

    expect(brandConfig('o3')).toMatchObject({ projectId: 'from-env', dataset: 'production' })
  })

  it('lets o3xo override its own, under XO-prefixed names', () => {
    vi.stubEnv('XO_SANITY_PROJECT_ID', 'xo-from-env')
    vi.stubEnv('XO_SANITY_DATASET', 'staging')

    expect(brandConfig('o3xo')).toMatchObject({ projectId: 'xo-from-env', dataset: 'staging' })
  })

  it('does not let one brand’s variables reach the other', () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'o3-only')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'development')
    vi.stubEnv('XO_SANITY_PROJECT_ID', 'o3xo-only')
    vi.stubEnv('XO_SANITY_DATASET', 'production')

    expect(brandConfig('o3')).toMatchObject({ projectId: 'o3-only', dataset: 'development' })
    expect(brandConfig('o3xo')).toMatchObject({ projectId: 'o3xo-only', dataset: 'production' })
  })

  it('treats an empty assignment as unset, because `vercel env pull` leaves those behind', () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', '')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', '')

    expect(brandConfig('o3')).toMatchObject({ projectId: 'naorcr6k', dataset: 'development' })
  })
})

/**
 * The dataset default is a safety property (see `resolveDataset` above): an
 * unconfigured checkout writes to the scratch dataset, never the live one.
 * o3xo has no scratch dataset — `development` does not exist in its project —
 * so its default is the only dataset it has.
 */
describe('the dataset a brand falls back to', () => {
  it('is o3’s scratch dataset, never its live one', () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', '')
    expect(brandConfig('o3').dataset).toBe('development')
  })

  it('is the only dataset o3xo’s project has', () => {
    vi.stubEnv('XO_SANITY_DATASET', '')
    expect(brandConfig('o3xo').dataset).toBe('production')
  })
})

/**
 * Which brand a process runs as is ambient — the app's build sets it once, and
 * the module-level entry points (the shared client, the CLI configs) read it
 * where they cannot be handed an argument.
 */
describe('the brand named by the environment', () => {
  it('is o3 when nothing names one', () => {
    vi.stubEnv('NEXT_PUBLIC_BRAND', '')
    expect(currentBrand()).toBe('o3')
  })

  it('is what the variable names', () => {
    vi.stubEnv('NEXT_PUBLIC_BRAND', 'o3xo')
    expect(currentBrand()).toBe('o3xo')
  })

  it('is what brandConfig answers with when given no brand', () => {
    vi.stubEnv('NEXT_PUBLIC_BRAND', 'o3xo')
    vi.stubEnv('XO_SANITY_PROJECT_ID', '')
    expect(brandConfig().projectId).toBe('tunpgire')
  })

  it('refuses a name no brand has, rather than falling back to the other brand', () => {
    // Failing closed matters here: `xo` is the bare form ADR 0028 forbids, and
    // swallowing it would point o3xo's Studio at o3's project and its editors
    // at o3's content.
    vi.stubEnv('NEXT_PUBLIC_BRAND', 'xo')
    expect(() => currentBrand()).toThrow(/o3xo/)
  })

  it('names every brand it accepts', () => {
    expect([...BRANDS]).toEqual(['o3', 'o3xo'])
  })
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

  it('answers for the brand this process runs as, not for o3', () => {
    // o3xo's project has no `development` dataset at all, so o3's answer for
    // that name is not o3xo's.
    vi.stubEnv('NEXT_PUBLIC_BRAND', 'o3xo')
    expect(readsNeedToken('development')).toBe(true)
    expect(readsNeedToken('production')).toBe(false)
  })
})

describe('the project a Sanity entry point talks to', () => {
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
 * The prefix table is a brand fact (ADR 0028), and `collectionPrefixes` is the
 * flattened view of it that every route, the sitemap and the redirect map
 * read. A function, not a module constant: the knob entry ships this package's
 * modules to the browser, and a constant would resolve the brand at import
 * time (#288).
 */
describe('where a collection serves', () => {
  it('is o3’s prefixes in the o3 app', () => {
    expect(collectionPrefixes()).toEqual({ insight: '/insights', caseStudy: '/work' })
  })

  it('is o3xo’s own view when asked for o3xo', () => {
    expect(collectionPrefixes('o3xo')).toEqual({
      insight: '/insights',
      caseStudy: '/case-studies',
    })
  })

  it('is the same table brand config declares', () => {
    const { collections } = brandConfig('o3')
    expect(collectionPrefixes('o3')).toEqual({
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

/**
 * Which datasets exist, and which of them answer an unauthenticated read, are
 * facts about one Sanity project — so they are a brand's to declare. o3xo's
 * project has one dataset, and it is public: an anonymous
 * `count(*)` against `tunpgire/production` answers `200 {"result": 0}` and
 * against `tunpgire/development` answers `404 Dataset not found`.
 */
describe('the datasets a brand’s project has', () => {
  it('is o3’s live dataset and its scratch one, both public', () => {
    const { datasets, publicDatasets } = brandConfig('o3')
    expect([...datasets]).toEqual(['production', 'development'])
    expect([...publicDatasets]).toEqual(['production', 'development'])
  })

  it('is o3xo’s one dataset, which reads without a token', () => {
    const { datasets, publicDatasets } = brandConfig('o3xo')
    expect([...datasets]).toEqual(['production'])
    expect([...publicDatasets]).toEqual(['production'])
  })

  it('includes the dataset each brand falls back to, or the fallback is unreachable', () => {
    for (const brand of BRANDS) {
      vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', '')
      vi.stubEnv('XO_SANITY_DATASET', '')
      const config = brandConfig(brand)
      expect(config.datasets, brand).toContain(config.dataset)
    }
  })

  it('vouches only for datasets the project declares', () => {
    for (const brand of BRANDS) {
      const config = brandConfig(brand)
      expect(config.datasets, brand).toEqual(expect.arrayContaining([...config.publicDatasets]))
    }
  })
})

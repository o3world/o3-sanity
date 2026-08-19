import { afterEach, describe, expect, it, vi } from 'vitest'

import { BRANDS, brandConfig, currentBrand } from './brand'

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
 * The dataset default is a safety property (see `constants.ts`): an
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

/**
 * Brand config: the one place a brand's facts live.
 *
 * A brand is one of the two site identities this repo ships (`CONTEXT.md` →
 * Brands, ADR 0028). Its facts — Sanity project, datasets, collection
 * prefixes, domain — used to be constants with one brand's answers baked in.
 * They live here now, one record per brand, so nothing downstream has to know
 * which brand it is running as.
 *
 * Pure: no client, no filesystem, no network. `process.env` is the only input,
 * and it is read through the per-brand closures below.
 */

export const BRANDS = ['o3', 'o3xo'] as const
export type Brand = (typeof BRANDS)[number]

/** Where an unconfigured checkout points, and what every entry point resolved before brands. */
const DEFAULT_BRAND: Brand = 'o3'

/** A document type with a URL prefix and a collection index (`CONTEXT.md` → Routing). */
export type CollectionType = 'insight' | 'caseStudy'

/** Where a collection serves, and what this brand calls it. */
export type CollectionFacts = {
  readonly prefix: string
  readonly title: string
}

/** One brand's facts, with the environment applied to the two it can override. */
export type BrandConfig = {
  readonly brand: Brand
  readonly domain: string
  readonly projectId: string
  /** The dataset this process talks to: the brand's own variable, or its fallback. */
  readonly dataset: string
  /** Every dataset the brand's project has. */
  readonly datasets: readonly string[]
  /**
   * The subset of those that answer an **unauthenticated** read — an ACL fact
   * `readsNeedToken` depends on being true, and one only an anonymous query
   * settles (sanity.io/manage agreeing is not the same evidence):
   *
   *     curl "https://<projectId>.api.sanity.io/v2021-06-07/data/query/<dataset>?query=count(*)"
   */
  readonly publicDatasets: readonly string[]
  readonly collections: Readonly<Record<CollectionType, CollectionFacts>>
  /**
   * Whether this brand's pages print a publication date.
   *
   * o3xo.ai publishes none — not on an article, not in its head, not as a
   * sitemap `lastmod` — so its migrated insights carry a **synthetic**
   * `publishedAt` taken from their sitemap position, which is the only ordering
   * evidence the site gives (#218, `tools/migration/src/map/framer.ts`). The
   * value is a sort key, so a surface that drew it would assert a date nobody
   * published: `false` is what keeps it off the page. o3's dates are WordPress's
   * own, and its frames draw them.
   */
  readonly showsPublishDates: boolean
}

/** What the environment may override, read from that brand's own variables. */
type BrandEnv = {
  readonly projectId: string | undefined
  readonly dataset: string | undefined
}

type BrandFacts = {
  readonly domain: string
  readonly projectId: string
  readonly datasets: readonly string[]
  readonly publicDatasets: readonly string[]
  /** Where an unset variable lands. o3's is scratch; o3xo has only the one. */
  readonly defaultDataset: string
  readonly collections: Readonly<Record<CollectionType, CollectionFacts>>
  readonly showsPublishDates: boolean
  /**
   * The brand's own variables, read as literal member expressions.
   *
   * Not a lookup by name: a bundler inlines `process.env.NEXT_PUBLIC_X` by
   * rewriting exactly that expression, and `process.env[name]` is not it — so
   * a table of variable names would resolve to `undefined` in every client
   * bundle, silently, and only in production.
   */
  readonly readEnv: () => BrandEnv
}

const FACTS: Readonly<Record<Brand, BrandFacts>> = {
  o3: {
    domain: 'o3world.com',
    projectId: 'naorcr6k',
    datasets: ['production', 'development'],
    publicDatasets: ['production', 'development'],
    // `development`, not `production`: `pnpm --filter migration load` deletes
    // and rewrites documents, so an unconfigured checkout has to land on the
    // scratch dataset and production has to be asked for out loud
    // (`pnpm dataset production`, or an explicit value in CI). Deploys set the
    // dataset explicitly and never reach this.
    defaultDataset: 'development',
    collections: {
      insight: { prefix: '/insights', title: 'Insights' },
      caseStudy: { prefix: '/work', title: 'Work' },
    },
    showsPublishDates: true,
    readEnv: () => ({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    }),
  },
  o3xo: {
    domain: 'o3xo.ai',
    projectId: 'tunpgire',
    // One dataset, and it is public: an anonymous `count(*)` against
    // `tunpgire/production` answers `200 {"result": 0}`, against
    // `tunpgire/development` a `404 Dataset not found`.
    datasets: ['production'],
    publicDatasets: ['production'],
    // o3xo has no scratch dataset to fall back to, so the fallback is the one
    // dataset it has, and it holds nothing but this pipeline's output.
    defaultDataset: 'production',
    collections: {
      insight: { prefix: '/insights', title: 'Insights' },
      caseStudy: { prefix: '/case-studies', title: 'Case studies' },
    },
    // o3xo.ai prints no date anywhere, and its insights' dates are synthetic.
    showsPublishDates: false,
    readEnv: () => ({
      projectId: process.env.XO_SANITY_PROJECT_ID,
      dataset: process.env.XO_SANITY_DATASET,
    }),
  },
}

/**
 * Which brand this process runs as, for the entry points that cannot be handed
 * one: the shared client, the CLI configs, the Studio config. An app sets
 * `NEXT_PUBLIC_BRAND` once; everything else follows.
 *
 * A name no brand has throws. Falling back would point one brand's Studio at
 * the other brand's project — including `xo`, the bare form ADR 0028 forbids,
 * which is the typo most likely to be made.
 */
export function currentBrand(): Brand {
  const named = process.env.NEXT_PUBLIC_BRAND
  if (!named) return DEFAULT_BRAND
  if (!(BRANDS as readonly string[]).includes(named)) {
    throw new Error(
      `NEXT_PUBLIC_BRAND="${named}" is not a brand. Use one of: ${BRANDS.join(', ')}.`,
    )
  }
  return named as Brand
}

/**
 * One brand's config: its facts, with its own environment applied.
 *
 * `||` and not `??` — an empty assignment is unset. `vercel env pull` leaves
 * those behind, and letting one through means a dataset name of `''` that
 * fails at the API instead of here.
 */
export function brandConfig(brand: Brand = currentBrand()): BrandConfig {
  const facts = FACTS[brand]
  const env = facts.readEnv()
  return {
    brand,
    domain: facts.domain,
    projectId: env.projectId || facts.projectId,
    dataset: env.dataset || facts.defaultDataset,
    datasets: facts.datasets,
    publicDatasets: facts.publicDatasets,
    collections: facts.collections,
    showsPublishDates: facts.showsPublishDates,
  }
}

/**
 * The one place the dataset is resolved. Every Sanity entry point — the web
 * app's Studio, the CLI configs, the shared client, the migration and
 * guidance tools — calls this, so they cannot disagree about which dataset
 * they are talking to. Which brand's dataset is brand config's answer.
 */
export function resolveDataset(): string {
  return brandConfig().dataset
}

/** Same for the project, which was hardcoded in two configs and imported in two others. */
export function resolveProjectId(): string {
  return brandConfig().projectId
}

/**
 * True when reading `dataset` anonymously would come back silently empty.
 * `apps/web/src/sanity/live.ts` turns that into a thrown error at the fetch.
 *
 * The check exists because Content Lake answers a private dataset's anonymous
 * query with `200 {"result": null}` rather than a 401, so nothing in the
 * response tells "no such document" apart from "you may not see it" (#100). A
 * checkout with no `SANITY_API_READ_TOKEN` pointed at a private dataset reads
 * back silently empty: the homepage and the catch-all 404, the collection
 * indexes render themselves empty, and the server log says nothing at all.
 *
 * Which datasets read publicly is a fact about one Sanity project, so each
 * brand declares its own (`publicDatasets` above). A dataset missing from
 * that list is treated as needing a token — an anonymous query is the only
 * evidence that settles it.
 */
export function readsNeedToken(dataset: string): boolean {
  return !brandConfig().publicDatasets.includes(dataset)
}

/**
 * URL prefixes per collection, for the brand this process runs as; `page`
 * slugs are multi-segment and carry their own prefix.
 *
 * The table itself is a brand fact (ADR 0028) — `o3xo` serves case studies at
 * `/case-studies` where `o3` serves `/work` — and this is the flattened view
 * of it that routes, the sitemap and the redirect map read. A function rather
 * than a module constant: `@o3/sanity/knobs` is bundled into the browser, and
 * a constant here would resolve the brand — the whole FACTS table, plus a
 * `process.env` read — at import time, in every module graph that can reach
 * it.
 */
export function collectionPrefixes(brand?: Brand): Readonly<Record<CollectionType, string>> {
  const { collections } = brandConfig(brand)
  return {
    insight: collections.insight.prefix,
    caseStudy: collections.caseStudy.prefix,
  }
}

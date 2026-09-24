/**
 * Brand config: the one place the site's facts live.
 *
 * Its facts (Sanity project, datasets, collection prefixes, domain) are
 * declared here and nowhere else, so nothing downstream hard-codes them.
 *
 * Pure: no client, no filesystem, no network. `process.env` is the only input.
 */

import type { CollectionType } from './constants'

/**
 * A document type with a URL prefix and a collection index (`CONTEXT.md` →
 * Routing). The set is `COLLECTION_TYPES` in `constants.ts` — a vocabulary
 * table rather than a site fact, because which collections exist is the
 * model's business and only where they serve is this file's.
 */
export type { CollectionType }

/** Where a collection serves, and what the site calls it. */
export type CollectionFacts = {
  readonly prefix: string
  readonly title: string
}

/** The site's facts, with the environment applied to the two it can override. */
export type BrandConfig = {
  readonly domain: string
  readonly projectId: string
  /** The dataset this process talks to: the environment's, or the fallback. */
  readonly dataset: string
  /** Every dataset the project has. */
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
}

const FACTS = {
  domain: 'o3world.com',
  projectId: 'naorcr6k',
  datasets: ['production', 'development'],
  publicDatasets: ['production', 'development'],
  // `development`, not `production`: an unconfigured checkout has to land on
  // the scratch dataset and production has to be asked for out loud
  // (`pnpm dataset production`, or an explicit value in CI). Deploys set the
  // dataset explicitly and never reach this.
  defaultDataset: 'development',
  collections: {
    insight: { prefix: '/insights', title: 'Insights' },
    caseStudy: { prefix: '/work', title: 'Work' },
  },
} as const

/**
 * The site's config: its facts, with the environment applied.
 *
 * The variables are read as literal member expressions, not by name: a bundler
 * inlines `process.env.NEXT_PUBLIC_X` by rewriting exactly that expression, and
 * `process.env[name]` is not it, so a lookup by name would resolve to
 * `undefined` in every client bundle, silently, and only in production.
 *
 * `||` and not `??` — an empty assignment is unset. `vercel env pull` leaves
 * those behind, and letting one through means a dataset name of `''` that
 * fails at the API instead of here.
 */
export function brandConfig(): BrandConfig {
  return {
    domain: FACTS.domain,
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || FACTS.projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || FACTS.defaultDataset,
    datasets: FACTS.datasets,
    publicDatasets: FACTS.publicDatasets,
    collections: FACTS.collections,
  }
}

/**
 * The one place the dataset is resolved. Every Sanity entry point — the web
 * app's Studio, the CLI configs, the shared client, the migration and
 * guidance tools — calls this, so they cannot disagree about which dataset
 * they are talking to.
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
 * Which datasets read publicly is a fact about the Sanity project
 * (`publicDatasets` above). A dataset missing from that list is treated as
 * needing a token — an anonymous query is the only evidence that settles it.
 */
export function readsNeedToken(dataset: string): boolean {
  return !brandConfig().publicDatasets.includes(dataset)
}

/**
 * URL prefixes per collection; `page` slugs are multi-segment and carry their
 * own prefix.
 *
 * The flattened view of the collections table that routes, the sitemap and the
 * redirect map read. A function rather than a module constant:
 * `@o3/sanity/knobs` is bundled into the browser, and a constant here would
 * read `process.env` at import time in every module graph that can reach it.
 */
export function collectionPrefixes(): Readonly<Record<CollectionType, string>> {
  const { collections } = brandConfig()
  return {
    insight: collections.insight.prefix,
    caseStudy: collections.caseStudy.prefix,
  }
}

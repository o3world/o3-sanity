export const PROJECT_ID = 'naorcr6k'
export const DATASETS = ['production', 'development'] as const
export type Dataset = (typeof DATASETS)[number]

/**
 * Where an unconfigured checkout points: **`development`**, not `production`.
 *
 * The fallback used to be `production` in seven separate places, and one of
 * them was `tools/migration/sanity.cli.ts` reading a `SANITY_DATASET` variable
 * that nothing ever set — so `pnpm --filter migration load`, which deletes and
 * rewrites documents, always wrote to the live dataset no matter what
 * `apps/web/.env.local` said. A missing variable now means the scratch
 * dataset, and production is something you ask for out loud
 * (`pnpm dataset production`, or an explicit value in CI).
 *
 * Deploys are unaffected: `.github/workflows/deploy.yml` and `promote.yml`
 * set the dataset explicitly, so they never reach this default.
 */
export const DEFAULT_DATASET: Dataset = 'development'

/**
 * The one place the dataset is resolved. Every Sanity entry point — the web
 * app's Studio, the CLI configs, the shared client, the migration and
 * guidance tools — calls this, so they cannot disagree about which dataset
 * they are talking to.
 */
export function resolveDataset(): string {
  return process.env.NEXT_PUBLIC_SANITY_DATASET || DEFAULT_DATASET
}

/** Same for the project, which was hardcoded in two configs and imported in two others. */
export function resolveProjectId(): string {
  return process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || PROJECT_ID
}

/** Document types the web app routes (ADR 0001: every one carries a required slug). */
export const ROUTABLE_TYPES = ['insight', 'caseStudy', 'page'] as const
export type RoutableType = (typeof ROUTABLE_TYPES)[number]

/** URL prefixes per collection; `page` slugs are multi-segment and carry their own prefix. */
export const COLLECTION_PREFIXES = {
  insight: '/insights',
  caseStudy: '/work',
} as const

/**
 * Where WordPress serves a collection, when this redesign moved it (ADR 0017).
 *
 * `insight` was `perspective` in every layer — type, route and URL — until the
 * word the design had used since the first mockup became the word the code
 * uses. WordPress still serves `/perspectives/*` and will until it is retired,
 * so the old prefix has to survive in exactly three places: the parity check
 * that proves every live URL still resolves, the 301s that make it resolve,
 * and the nav hrefs built from WordPress's own menus. One declaration feeds
 * all three — a second copy of it is how they drift apart.
 */
export const WORDPRESS_PREFIXES: Readonly<Partial<Record<RoutableType, string>>> = {
  insight: '/perspectives',
}

export const PAGE_TYPES = ['standard', 'service'] as const
export type PageType = (typeof PAGE_TYPES)[number]

export const SURFACES = ['white', 'bone', 'ink'] as const
export type Surface = (typeof SURFACES)[number]

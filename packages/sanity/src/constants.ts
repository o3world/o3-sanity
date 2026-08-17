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

/**
 * The datasets that answer an **unauthenticated** read.
 *
 * `production` and `development` both are. The list still has to exist because
 * Content Lake answers a private dataset's anonymous query with
 * `200 {"result": null}` rather than a 401, so nothing in the response tells
 * "no such document" apart from "you may not see it" (#100). A checkout with no
 * `SANITY_API_READ_TOKEN` pointed at a dataset missing from this list reads
 * back silently empty: the homepage and the catch-all 404, the collection
 * indexes render themselves empty, and the server log says nothing at all.
 *
 * Naming the public datasets is the only way to see that coming, so this list
 * is an ACL fact and has to be kept true — a dataset missing from it is treated
 * as needing a token. An anonymous query is the check, and the only one that
 * settles it; sanity.io/manage agreeing is not the same evidence:
 *
 *     curl "https://naorcr6k.api.sanity.io/v2021-06-07/data/query/<dataset>?query=count(*)"
 */
export const PUBLIC_DATASETS: readonly string[] = ['production', 'development']

/**
 * True when reading `dataset` anonymously would come back silently empty.
 * `apps/web/src/sanity/live.ts` turns that into a thrown error at the fetch.
 */
export function readsNeedToken(dataset: string): boolean {
  return !PUBLIC_DATASETS.includes(dataset)
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

/**
 * What a `page` is, for the two things that read it: the conditional `card`
 * fieldset, and `listingSection`.
 *
 * `partner` is a platform-partnership landing page — `/partners/sanity`
 * (`2354:2446`, #92), with Vercel and Lovable behind it: the Home platforms
 * rail already names all three. It is the first value with both a document and
 * a frame; `service` still has neither (CONTEXT.md → Known drift).
 */
export const PAGE_TYPES = ['standard', 'service', 'partner'] as const
export type PageType = (typeof PAGE_TYPES)[number]

export const SURFACES = ['white', 'bone', 'ink'] as const
export type Surface = (typeof SURFACES)[number]

/**
 * How far a piece has got through the authoring pipeline. The first five are
 * the pipeline's own skills, each owning one artifact on the brief; the sixth
 * is where a finished run stops. A brief that no run has touched has no stage.
 */
export const BRIEF_STAGES = ['gather', 'brief', 'draft', 'review', 'typeset', 'handed-off'] as const
export type BriefStage = (typeof BRIEF_STAGES)[number]

/**
 * A verdict's two outcomes, shared by `verdict.result` and each gate's own
 * result. No initial value anywhere it is used: a default here would be a
 * verdict nobody ran.
 */
export const VERDICT_RESULTS = ['pass', 'fail'] as const
export type VerdictResult = (typeof VERDICT_RESULTS)[number]

/**
 * What a `mark` can draw: the animated orb, or the halftone disc the canonical
 * frames draw. First value is the default, so a mark left alone animates.
 */
export const MARK_KINDS = ['orb', 'disc'] as const
export type MarkKind = (typeof MARK_KINDS)[number]

/**
 * The nine animations `thinking-orbs` ships (orbs.jakubantalik.com). Values
 * are the library's own state names, so the schema, the seed JSON and the
 * canvas all say the same word — a translation table here would be a third
 * vocabulary for something the library already named.
 */
export const ORB_STATES = [
  'working',
  'searching',
  'solving',
  'listening',
  'connecting',
  'weaving',
  'composing',
  'breathing',
  'shaping',
] as const
export type OrbState = (typeof ORB_STATES)[number]

/**
 * The two tuned presets, in CSS px. Not a diameter an author picks freely:
 * each preset carries its own dot count, dot size and speed, so 20 is a
 * different drawing from 64 rather than a smaller one.
 */
export const ORB_SIZES = [64, 20] as const
export type OrbSize = (typeof ORB_SIZES)[number]

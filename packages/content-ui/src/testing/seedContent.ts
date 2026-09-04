/**
 * The committed content trees, projected for the browser — what the page
 * mockups and the section-block stories render.
 *
 * ## Why this exists beside the app's `@/test/fixtures`
 *
 * Both answer "what does the real content look like through the real
 * renderer", and both apply the same projections (`./seedProjection`, which
 * they share). They differ in the two things that cannot be shared:
 *
 * | | `apps/web`'s `@/test/fixtures` (render layer) | this module (stories layer) |
 * | --- | --- | --- |
 * | Loads JSON with | `node:fs`, by directory sweep | **static imports** — it runs in Chromium |
 * | Asset ids | a sha1 of the source, fabricated | the **real** ids from `data/assets.json` |
 *
 * The asset difference is the interesting one. The render layer renders to a
 * string and never fetches, so an id only has to parse. A story renders in a
 * real browser that really loads the picture, so a mockup with fabricated ids
 * is a mockup of empty boxes. `data/assets.json` is the manifest `load` writes
 * when it uploads each binary — committed, so the CDN URL for every seeded
 * image is knowable without a dataset, a token or a network call at build
 * time.
 *
 * ## Why the imports are written out
 *
 * `import.meta.glob` would collapse the list below to four lines, and it is
 * Vite-only, while this file is also covered by the package's `tsc --noEmit`.
 * So the documents each mockup stands on are named explicitly. That is more
 * lines, and it also means the failure mode of a renamed seed is a build
 * error naming the file rather than a page that quietly renders one fewer
 * card.
 *
 * Nothing here is authored. Every string on a page mockup came out of
 * `tools/migration/data/`, which is what makes the mockups worth comparing to
 * a Figma frame at all.
 */
import type {
  PAGE_QUERY_RESULT,
  INSIGHT_QUERY_RESULT,
  SITE_SETTINGS_QUERY_RESULT,
} from '@o3/sanity/types/generated'

import type { PageSection, SectionBlockData, SectionProps } from '@o3/content-runtime/blocks'
import {
  projectCard,
  projectSeedPage,
  resolveAssetMarkers,
  type SeedDoc,
  type ResolveRef,
} from './seedProjection'

import assetManifest from '../../../../tools/migration/data/assets.json'

// ── Site chrome ────────────────────────────────────────────────────────────
import settingsDoc from '../../../../tools/migration/data/converted/siteSettings/settings.json'

// ── Seed pages ─────────────────────────────────────────────────────────────
import pageIndex from '../../../../tools/migration/data/seed/page/index.json'
import pageAbout from '../../../../tools/migration/data/seed/page/about.json'
import pageSolutions from '../../../../tools/migration/data/seed/page/solutions.json'
import pageLive from '../../../../tools/migration/data/seed/page/live.json'
// The first partner landing page (#92) — the only seed carrying
// `railPanelsSection` `layout: rows` and the two new `featureGridSection`
// compositions, so it is where those arms get real content to render.
import pagePartnersSanity from '../../../../tools/migration/data/seed/page/partners-sanity.json'
// The first service landing page (#93) — the only seed carrying
// `railPanelsSection` `layout: grid` and `layoutSection`'s molecule
// decoration, so it is where those arms get real content to render.
import pageSolutionsSoftwareEngineering from '../../../../tools/migration/data/seed/page/solutions-software-engineering.json'
import pageContact from '../../../../tools/migration/data/seed/page/contact.json'
import pageVentures from '../../../../tools/migration/data/seed/page/ventures.json'
// The one seeded page carrying a `mediaSection`, so the block has a real
// instance to render rather than a hand-built one.
import pageVenturesUrvin from '../../../../tools/migration/data/seed/page/ventures-urvin.json'
import page1682 from '../../../../tools/migration/data/seed/page/1682-conference-ai-innovation.json'

// The chrome around a collection's feed (#347) — the bands the index mockups
// draw above and below the listing the route owns.
import collectionIndexInsights from '../../../../tools/migration/data/seed/collectionIndex/insights.json'
import collectionIndexWork from '../../../../tools/migration/data/seed/collectionIndex/work.json'

// ── Clients the homepage logo wall and the showcase cards dereference ──────
import clientChop from '../../../../tools/migration/data/seed/client/chop.json'
import clientIronman from '../../../../tools/migration/data/seed/client/ironman.json'
import clientAramark from '../../../../tools/migration/data/seed/client/aramark.json'
import clientAmerigas from '../../../../tools/migration/data/seed/client/amerigas.json'
import clientCaron from '../../../../tools/migration/data/seed/client/caron.json'
import clientLaColombe from '../../../../tools/migration/data/seed/client/la-colombe.json'
import clientVertex from '../../../../tools/migration/data/seed/client/vertex.json'
import clientHireHeroes from '../../../../tools/migration/data/seed/client/hire-heroes-usa.json'

// ── The fifteen marks the /partners/sanity strip draws ─────────────────────
// Borrowed vendor artwork rather than seeded content — `brand-assets` fetches
// each one and records where it came from.
import clientPuma from '../../../../tools/migration/data/seed/client/puma.json'
import clientFigma from '../../../../tools/migration/data/seed/client/figma.json'
import clientArcteryx from '../../../../tools/migration/data/seed/client/arcteryx.json'
import clientPinterest from '../../../../tools/migration/data/seed/client/pinterest.json'
import clientShopify from '../../../../tools/migration/data/seed/client/shopify.json'
import clientLoom from '../../../../tools/migration/data/seed/client/loom.json'
import clientAnthropic from '../../../../tools/migration/data/seed/client/anthropic.json'
import clientReplit from '../../../../tools/migration/data/seed/client/replit.json'
import clientAthenahealth from '../../../../tools/migration/data/seed/client/athenahealth.json'
import clientFrontier from '../../../../tools/migration/data/seed/client/frontier.json'
import clientSamsung from '../../../../tools/migration/data/seed/client/samsung.json'
import clientSiemens from '../../../../tools/migration/data/seed/client/siemens.json'
import clientMoma from '../../../../tools/migration/data/seed/client/moma.json'
import clientNordstrom from '../../../../tools/migration/data/seed/client/nordstrom.json'
import clientNike from '../../../../tools/migration/data/seed/client/nike.json'

// ── Industries those case studies carry ────────────────────────────────────
import industryHealthcare from '../../../../tools/migration/data/seed/industry/healthcare.json'
import industrySports from '../../../../tools/migration/data/seed/industry/sports.json'
import industryTechnology from '../../../../tools/migration/data/seed/industry/technology.json'

// ── The three translated case studies the homepage showcase references ─────
import caseCaron from '../../../../tools/migration/data/translated/caseStudy/caron.json'
import caseIronman from '../../../../tools/migration/data/translated/caseStudy/case-studies-ironman-digital-experience-drupal-acquia.json'
import caseVertex from '../../../../tools/migration/data/translated/caseStudy/vertex.json'

// ── People: the About team band, plus the insight bylines ──────────────
import personGadsby from '../../../../tools/migration/data/converted/person/person-wp-18.json'
import personHandler from '../../../../tools/migration/data/converted/person/person-wp-3.json'
import personSheller from '../../../../tools/migration/data/converted/person/person-wp-3984.json'
import personGaitonde from '../../../../tools/migration/data/converted/person/person-wp-4706.json'
import personForbes from '../../../../tools/migration/data/converted/person/person-wp-11.json'
import personNavari from '../../../../tools/migration/data/converted/person/person-wp-4.json'
import personLewis from '../../../../tools/migration/data/converted/person/person-wp-8710.json'
import personHalligan from '../../../../tools/migration/data/converted/person/person-wp-9147.json'
import personLeone from '../../../../tools/migration/data/converted/person/person-wp-7875.json'
import personScandone from '../../../../tools/migration/data/converted/person/person-wp-21.json'
import personEdmundson from '../../../../tools/migration/data/converted/person/person-wp-10.json'
import personOst from '../../../../tools/migration/data/converted/person/person-wp-6195.json'
import personBoenisch from '../../../../tools/migration/data/converted/person/person-wp-10559.json'

// ── Categories those insights carry ────────────────────────────────────
import categoryAi from '../../../../tools/migration/data/converted/category/artificial-intelligence-ai.json'
import categoryInnovation from '../../../../tools/migration/data/converted/category/innovation.json'
import categoryResearch from '../../../../tools/migration/data/converted/category/research.json'
import categoryTechnology from '../../../../tools/migration/data/converted/category/technology.json'

// ── The insights feed the carousels fall back to ───────────────────────
import insightSaas from '../../../../tools/migration/data/converted/insight/we-replaced-a-35000-saas-tool-in-527-prompts.json'
import insightGeo from '../../../../tools/migration/data/converted/insight/google-weighs-in-on-geo-what-just-changed-for-your-ai-search-strategy.json'
import insightCms from '../../../../tools/migration/data/converted/insight/what-a-marketing-director-actually-gets-out-of-an-ai-connected-cms.json'
import insightConversion from '../../../../tools/migration/data/converted/insight/why-your-conversion-rates-are-stuck-and-how-ai-breaks-the-cycle.json'

// ── The three articles `/1682-conference-ai-innovation` curates by hand ────
import insightRecap from '../../../../tools/migration/data/converted/insight/1682-conference-recap-unveiling-ais-realities-and-innovation-insights.json'
import insightBrand from '../../../../tools/migration/data/converted/insight/1682-the-making-of-the-brand.json'
import insightSahay from '../../../../tools/migration/data/converted/insight/sahay-ai-triumphs-1682-venture-awards.json'

/**
 * `data/assets.json` keys converted sources by their WordPress URL and seeded
 * ones by `file:<repo path>` — the two marker forms, one map. A miss returns
 * a parseable id with an unreachable hash so the layout still measures and the
 * gap is visibly a gap; throwing here would take a whole mockup down over one
 * asset that has not been uploaded yet.
 */
const ASSETS = assetManifest as Record<string, { assetId: string }>

function assetIdFor(source: string): string {
  const entry = ASSETS[source] ?? ASSETS[`file:${source}`]
  if (entry) return entry.assetId
  const ext = /\.(\w+)$/.exec(source)?.[1]?.toLowerCase() ?? 'png'
  return `image-${'0'.repeat(40)}-1200x630-${ext}`
}

/** Every committed document these mockups can dereference, by `_id`. */
const DOCUMENTS: readonly SeedDoc[] = [
  clientChop,
  clientIronman,
  clientAramark,
  clientAmerigas,
  clientCaron,
  clientLaColombe,
  clientVertex,
  clientHireHeroes,
  clientPuma,
  clientFigma,
  clientArcteryx,
  clientPinterest,
  clientShopify,
  clientLoom,
  clientAnthropic,
  clientReplit,
  clientAthenahealth,
  clientFrontier,
  clientSamsung,
  clientSiemens,
  clientMoma,
  clientNordstrom,
  clientNike,
  industryHealthcare,
  industrySports,
  industryTechnology,
  caseCaron,
  caseIronman,
  caseVertex,
  personGadsby,
  personHandler,
  personSheller,
  personGaitonde,
  personForbes,
  personNavari,
  personLewis,
  personHalligan,
  personLeone,
  personScandone,
  personEdmundson,
  personOst,
  personBoenisch,
  categoryAi,
  categoryInnovation,
  categoryResearch,
  categoryTechnology,
].map((doc) => resolveAssetMarkers(doc, assetIdFor) as SeedDoc)

const BY_ID = new Map(DOCUMENTS.map((doc) => [doc._id as string, doc]))

const resolve: ResolveRef = (ref) => {
  const id = (ref as { _ref?: string } | null)?._ref
  return id ? (BY_ID.get(id) ?? null) : null
}

/**
 * The reading time the GROQ projection returns, ported —
 * `math::max([1, round(length(pt::text(body)) / 5 / 200)])`. Reading time is
 * computed and never stored (#45), so a fixture standing in for the query has
 * to compute it; a hardcoded number would let a card show a figure the real
 * projection never produces.
 */
function readingMinutesOf(body: unknown): number {
  const text = Array.isArray(body)
    ? body
        .map((block) =>
          ((block as { children?: unknown[] })?.children ?? [])
            .map((child) => (child as { text?: unknown })?.text)
            .filter((span): span is string => typeof span === 'string')
            .join(''),
        )
        // `pt::text` separates blocks with a blank line.
        .join('\n\n')
    : ''
  return Math.max(1, Math.round(text.length / 5 / 200))
}

type InsightCard = NonNullable<INSIGHT_QUERY_RESULT>

/** The `author->{name, title, headshot}` / `categories[]->{title, slug}` projection. */
function projectInsight(raw: SeedDoc): InsightCard {
  const doc = resolveAssetMarkers(raw, assetIdFor) as SeedDoc
  const author = resolve(doc.author) as SeedDoc | null
  return {
    _id: doc._id,
    _type: 'insight',
    title: doc.title ?? null,
    slug: (doc.slug as { current?: string } | undefined)?.current ?? null,
    excerpt: doc.excerpt ?? null,
    publishedAt: doc.publishedAt ?? null,
    // The committed corpus holds the picture as `cardMedia` since #418; the
    // renderers still draw `featuredImage`, and #419 moves them over.
    featuredImage: doc.cardMedia ?? null,
    author: author
      ? { name: author.name, title: author.title ?? null, headshot: author.headshot ?? null }
      : null,
    categories: ((doc.categories ?? []) as unknown[])
      .map((ref) => resolve(ref))
      .filter((category): category is SeedDoc => Boolean(category))
      .map((category) => ({
        title: category.title ?? null,
        slug: (category.slug as { current?: string } | undefined)?.current ?? null,
      })),
    readingMinutes: readingMinutesOf(doc.body),
    body: doc.body,
    seo: doc.seo ?? null,
    related: [],
    latest: [],
  } as unknown as InsightCard
}

/**
 * The insights feed, newest first — four migrated articles that carry a hero
 * image, a byline and an excerpt (most of the 272 carry none of the three, so
 * an unfiltered feed would draw blank cards and say nothing about the
 * composition).
 */
export const INSIGHTS: readonly InsightCard[] = [
  insightSaas,
  insightGeo,
  insightCms,
  insightConversion,
].map((doc) => projectInsight(doc as SeedDoc))

/**
 * The case-study feed the /work index draws, newest first — the three
 * translated case studies the homepage showcase already references (ADR 0016
 * retired the invented seeds it used to hold).
 *
 * Card projections, because that is what `CASE_STUDIES_PAGE_QUERY` returns:
 * `slug` flattened, `headlineStat` lifted off `stats[0]`, client and
 * industries dereferenced. `projectCard` is the same helper the showcase band
 * goes through, so the index and the homepage draw one shape.
 */
export const CASE_STUDIES: readonly SeedDoc[] = [caseCaron, caseIronman, caseVertex]
  .map((doc) => projectCard(BY_ID.get((doc as SeedDoc)._id as string) ?? null, resolve))
  .filter((card): card is SeedDoc => Boolean(card))

/**
 * Every insight a seed page names outright, by `_id` — the curated arm of
 * `insightsCarouselSection`. Only `/1682-conference-ai-innovation` uses
 * it today; the rest fall back to `INSIGHTS`.
 */
const CURATED_INSIGHTS = new Map(
  [insightRecap, insightBrand, insightSahay].map((doc) => [
    (doc as SeedDoc)._id as string,
    projectInsight(doc as SeedDoc),
  ]),
)

function curatedInsight(ref: unknown): InsightCard | null {
  const id = (ref as { _ref?: string } | null)?._ref
  return id ? (CURATED_INSIGHTS.get(id) ?? null) : null
}

/**
 * Site Settings as `SITE_SETTINGS_QUERY` returns them — the real committed
 * document, with its markers resolved: the utility strip's `brandLogo` members
 * carry a `_localSrc` where an asset reference belongs, and a renderer handed
 * one raw draws nothing.
 */
export const SITE_SETTINGS = resolveAssetMarkers(
  settingsDoc,
  assetIdFor,
) as unknown as SITE_SETTINGS_QUERY_RESULT

/**
 * The year the footer prints in a story. Fixed rather than read off the
 * clock, so a screenshot taken on 31 December matches one taken the next
 * morning.
 */
export const STORY_YEAR = 2026

const SEED_PAGES = {
  index: pageIndex,
  about: pageAbout,
  solutions: pageSolutions,
  live: pageLive,
  'partners-sanity': pagePartnersSanity,
  'solutions-software-engineering': pageSolutionsSoftwareEngineering,
  contact: pageContact,
  ventures: pageVentures,
  'ventures-urvin': pageVenturesUrvin,
  '1682-conference-ai-innovation': page1682,
} as const

export type SeedPageName = keyof typeof SEED_PAGES

/**
 * A committed seed page, shaped into what `PAGE_QUERY` returns: `slug`
 * flattened, references expanded from the committed trees, asset markers
 * swapped for the real uploaded ids.
 *
 * This is the whole basis of the page mockups. The blocks, their order, their
 * copy and their surfaces are the seed's, so a mockup drifting from its Figma
 * frame is a real divergence rather than a story that fell out of date.
 */
export function seededPage(name: SeedPageName): NonNullable<PAGE_QUERY_RESULT> {
  const page = resolveAssetMarkers(SEED_PAGES[name], assetIdFor) as SeedDoc
  return projectSeedPage({
    page,
    resolve,
    latestInsights: INSIGHTS,
    projectInsight: curatedInsight,
  }) as unknown as NonNullable<PAGE_QUERY_RESULT>
}

const SEED_COLLECTION_INDEXES = {
  insights: collectionIndexInsights,
  work: collectionIndexWork,
} as const

export type SeedCollectionIndexName = keyof typeof SEED_COLLECTION_INDEXES

/**
 * A committed collection-index seed, shaped the way `COLLECTION_INDEX_QUERY`
 * returns it — both band arrays projected like a page's `sections`.
 *
 * This is what lets an index mockup draw the same hero and closer the route
 * does. Without it a story would show the feed with nothing around it, and the
 * visual check would be comparing a page against half of itself.
 */
export function seededCollectionIndex(name: SeedCollectionIndexName) {
  const doc = resolveAssetMarkers(SEED_COLLECTION_INDEXES[name], assetIdFor) as SeedDoc
  const project = (sections: unknown) =>
    projectSeedPage({
      page: { ...doc, sections: (sections ?? []) as SeedDoc[] },
      resolve,
      latestInsights: INSIGHTS,
      projectInsight: curatedInsight,
    }).sections as PageSection[]

  return {
    _id: doc._id as string,
    sectionsAbove: project(doc.sectionsAbove),
    sectionsBelow: project(doc.sectionsBelow),
  }
}

/** The sections of a seed page, for a story that renders one block from real content. */
export function seededSections(name: SeedPageName) {
  return seededPage(name).sections ?? []
}

/**
 * One block off a seed page, by `_type` — the source of the "as seeded"
 * story every section block carries.
 *
 * Throws rather than returning undefined: a story whose block has been renamed
 * out of the seed should fail loudly in the sidebar, not render nothing and
 * look like a layout bug.
 */
export function seededSection<K extends PageSection['_type']>(
  name: SeedPageName,
  type: K,
  index = 0,
): SectionBlockData<K> {
  const matches = seededSections(name).filter((section) => section._type === type)
  const section = matches[index]
  if (!section) {
    throw new Error(
      `seededSection: no ${type}[${index}] on the "${name}" seed — it has ${matches.length}.`,
    )
  }
  return section as SectionBlockData<K>
}

/**
 * One block off a seed page as **props** — `_key` and `_type` stripped, which
 * is exactly `SectionProps<T>`.
 *
 * This is what a section-block story's "as seeded" case takes for `args`. A
 * story built this way cannot drift from the content the site ships: rename a
 * field in the schema and it is a typecheck error here, change the seed's copy
 * and the story follows.
 */
export function seededSectionArgs<K extends PageSection['_type']>(
  name: SeedPageName,
  type: K,
  index = 0,
): SectionProps<K> {
  const section: Record<string, unknown> = { ...seededSection(name, type, index) }
  delete section._key
  delete section._type
  // One cast: `SectionProps<K>` is `Omit<SectionBlockData<K>, '_key' |
  // '_type'>` by definition, which is precisely what was just removed.
  // (Written as two deletes rather than a rest destructure because
  // destructuring a generic `Extract<…>` widens each rest property
  // independently and loses the discriminated member on the way out.)
  return section as SectionProps<K>
}

/**
 * An image object pointing at a committed asset, for a hand-built story —
 * either marker form the manifest keys (a repo path under
 * `tools/migration/data/`, or the WordPress URL a converted asset came from).
 *
 * The asset is written **as the projection delivers it**, dereferenced: an
 * `_id` the URL builder reads and the metadata the blur-up comes from. The
 * manifest records ids, not metadata, so a story carries none and draws no
 * placeholder — which is what a story wants anyway, since a blurred plate
 * under a loaded image is noise in a visual diff.
 */
export function seedImage(source: string) {
  return {
    _type: 'image' as const,
    asset: { _id: assetIdFor(source), metadata: null },
  }
}

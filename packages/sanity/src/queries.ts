import { defineQuery } from 'groq'

/**
 * Shared card projections — single source for showcase blocks, listings, and
 * route pages. Exported so the web app's card registry can reference the same
 * fragments (`CARD_PROJECTIONS`) instead of duplicating them.
 *
 * Fragments are plain template-literal consts (never the `groq` tag) so their
 * literal types survive into the `defineQuery` calls below — that is what
 * keeps each query a `keyof SanityQueries` after typegen (TS#33304).
 */
export const PERSPECTIVE_CARD = /* groq */ `
  _id,
  _type,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  featuredImage,
  ${
    /* `headshot` is here for the DETAIL byline (`1710:2946`), not the card —
      the card draws no author at all. It rides on the shared fragment because
      splitting the author projection in two would leave two places to keep in
      step for one image reference. */ ''
  }
  "author": author->{name, title, headshot},
  "categories": categories[]->{title, "slug": slug.current},
  ${
    /* READING TIME IS COMPUTED AT RENDER, NOT STORED (#45). Derived here in
      GROQ rather than in the renderer: 5 characters to a word, 200 words a
      minute, at least 1. Doing it in the projection keeps the whole body out
      of every card and related-article payload — the point of computing it
      here — and means the value can never drift from the body the way a
      stored field silently would after an edit.

      The card meta reads "3 MINS · 7/27/26" (1683:2490); the detail byline
      reads "Jun 2026 · 6 min read" (1710:2951). Same number, one source. */ ''
  }
  "readingMinutes": math::max([1, round(length(pt::text(body)) / 5 / 200)])
` as const

export const CASE_STUDY_CARD = /* groq */ `
  _id,
  _type,
  title,
  "slug": slug.current,
  narrativeHeadline,
  "headlineStat": stats[0],
  heroMedia,
  "client": client->{name, logo},
  "industries": industries[]->{title},
  industryDetail
` as const

/** Dereference a cta's internal target into the `{_type, title, slug}` shape `hrefForDoc` consumes. */
const CTA_TARGET = /* groq */ `"target": target->{_type, title, "slug": slug.current}` as const

/**
 * The section-array projection shared by `page.sections` and
 * `caseStudy.extraSections`. Per-type conditional arms expand exactly what
 * each block renderer needs beyond the raw fields:
 * - cta targets are dereferenced everywhere a cta appears (incl. layoutSection
 *   column items);
 * - logo wall / case showcase / perspectives carousel expand their references
 *   into card projections, and personGridSection does the same for the
 *   `person` documents the About team band points at;
 * - perspectivesCarouselSection also fetches a `latest` fallback feed so an
 *   empty curated list auto-fills (renderer picks `curated` when non-empty);
 * - listingSection resolves its page list at query time so the renderer stays
 *   a pure component.
 */
const SECTION_FIELDS = /* groq */ `
  ...,
  _type == "heroSection" => {
    cta{..., ${CTA_TARGET}}
  },
  _type == "logoWallSection" => {
    "clients": clients[]->{_id, name, logo},
    cta{..., ${CTA_TARGET}}
  },
  _type == "caseShowcaseSection" => {
    "caseStudies": caseStudies[]->{${CASE_STUDY_CARD}},
    cta{..., ${CTA_TARGET}}
  },
  _type == "railPanelsSection" => {
    panels[]{..., cta{..., ${CTA_TARGET}}}
  },
  _type == "perspectivesCarouselSection" => {
    "curated": perspectives[]->{${PERSPECTIVE_CARD}},
    "latest": *[_type == "perspective" && (!defined(^.category) || ^.category._ref in categories[]._ref)] | order(publishedAt desc)[0...8]{${PERSPECTIVE_CARD}}
  },
  _type == "ctaSection" => {
    cta{..., ${CTA_TARGET}}
  },
  _type == "personGridSection" => {
    "people": people[]->{_id, name, title, headshot}
  },
  _type == "roleListSection" => {
    roles[]{..., cta{..., ${CTA_TARGET}}}
  },
  _type == "layoutSection" => {
    items[]{..., _type == "cta" => {${CTA_TARGET}}}
  },
  _type == "listingSection" => {
    "pages": *[_type == "page" && pageType == ^.pageType && slug.current != "index"] | order(title asc){_id, _type, title, "slug": slug.current, card}
  }
` as const

export const SITE_SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings"][0]{
  title,
  perspectivesLabel,
  navItems[]{..., ${CTA_TARGET}},
  primaryCta{..., ${CTA_TARGET}},
  footerTagline,
  footerGroups[]{..., links[]{..., ${CTA_TARGET}}},
  socialsLabel,
  socialLinks,
  legalLinks[]{..., ${CTA_TARGET}},
  legalName,
  copyrightNote,
  defaultSeo
}`)

/**
 * The perspective detail route (#45).
 *
 * `related` / `latest` feed the frame's closing "Keep reading." band
 * (`1751:1947`), which is the Home Blog row's carousel drawn onto the article
 * page. Two lists rather than one, the same shape `perspectivesCarouselSection`
 * uses: `related` shares a category with the article, `latest` is the fallback
 * for a perspective whose category is a dead end. Both exclude the article
 * itself — the one thing a reader is guaranteed not to want next.
 *
 * ⚠️ **`^.^` in the category match is not a typo.** `^` inside the `*[]`
 * filter is this document (which is why `_id != ^._id` works), but the array
 * filter inside `count()` opens a further scope, so one caret there resolves
 * to the *candidate* document — comparing every perspective's categories to
 * its own and matching all 272. Two carets reach back out to the article.
 */
export const PERSPECTIVE_QUERY = defineQuery(`*[_type == "perspective" && slug.current == $slug][0]{
  ${PERSPECTIVE_CARD},
  body,
  seo,
  "related": *[_type == "perspective" && _id != ^._id && count((categories[]._ref)[@ in ^.^.categories[]._ref]) > 0] | order(publishedAt desc)[0...8]{${PERSPECTIVE_CARD}},
  "latest": *[_type == "perspective" && _id != ^._id] | order(publishedAt desc)[0...8]{${PERSPECTIVE_CARD}}
}`)

export const PERSPECTIVE_SLUGS_QUERY = defineQuery(
  `*[_type == "perspective" && defined(slug.current)].slug.current`,
)

export const PERSPECTIVES_PAGE_QUERY = defineQuery(`{
  "items": *[_type == "perspective"] | order(publishedAt desc) [$offset...$end]{${PERSPECTIVE_CARD}},
  "total": count(*[_type == "perspective"])
}`)

/**
 * The /work index (#43). Ordered newest first on `publishedAt`, falling back
 * to `_createdAt` so the seeded case studies — which carry no publish date —
 * still take a stable position instead of sorting as nulls.
 */
export const CASE_STUDIES_PAGE_QUERY = defineQuery(`{
  "items": *[_type == "caseStudy"] | order(coalesce(publishedAt, _createdAt) desc) [$offset...$end]{${CASE_STUDY_CARD}},
  "total": count(*[_type == "caseStudy"])
}`)

export const LATEST_PERSPECTIVES_QUERY = defineQuery(
  `*[_type == "perspective" && ($categoryId == null || $categoryId in categories[]._ref)] | order(publishedAt desc) [0...$limit]{${PERSPECTIVE_CARD}}`,
)

export const CASE_STUDY_QUERY = defineQuery(`*[_type == "caseStudy" && slug.current == $slug][0]{
  ${CASE_STUDY_CARD},
  stats,
  chapters,
  deliverables,
  "extraSections": extraSections[]{${SECTION_FIELDS}},
  seo,
  "next": *[_type == "caseStudy" && _id != ^._id] | order(_createdAt desc) [0]{title, "slug": slug.current, heroMedia, "client": client->{name}}
}`)

export const CASE_STUDY_SLUGS_QUERY = defineQuery(
  `*[_type == "caseStudy" && defined(slug.current)].slug.current`,
)

export const CASE_STUDIES_QUERY = defineQuery(
  `*[_type == "caseStudy"] | order(_createdAt desc){${CASE_STUDY_CARD}}`,
)

export const CASE_STUDIES_BY_REF_QUERY = defineQuery(
  `*[_type == "caseStudy" && _id in $ids]{${CASE_STUDY_CARD}}`,
)

export const PAGE_QUERY = defineQuery(`*[_type == "page" && slug.current == $slug][0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  pageType,
  "sections": sections[]{${SECTION_FIELDS}},
  seo
}`)

export const PAGE_SLUGS_QUERY = defineQuery(
  `*[_type == "page" && defined(slug.current)].slug.current`,
)

export const PAGES_BY_TYPE_QUERY = defineQuery(
  `*[_type == "page" && pageType == $pageType] | order(title asc){
    _id,
    title,
    "slug": slug.current,
    card
  }`,
)

/**
 * Every routable type filters `seo.noIndex` identically: listing a page in
 * the sitemap while its own `<meta robots>` says noindex is the kind of
 * contradiction that costs crawl budget and trust (#26, verified by #24).
 */
export const SITEMAP_QUERY = defineQuery(`{
  "perspectives": *[_type == "perspective" && defined(slug.current) && (seo.noIndex != true)]{"slug": slug.current, _updatedAt},
  "caseStudies": *[_type == "caseStudy" && defined(slug.current) && (seo.noIndex != true)]{"slug": slug.current, _updatedAt},
  "pages": *[_type == "page" && defined(slug.current) && (seo.noIndex != true)]{"slug": slug.current, _updatedAt}
}`)

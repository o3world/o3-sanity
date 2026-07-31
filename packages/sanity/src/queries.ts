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
  "author": author->{name, title},
  "categories": categories[]->{title, "slug": slug.current}
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
 *   into card projections;
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
  footerLinks[]{..., ${CTA_TARGET}},
  socialLinks,
  defaultSeo
}`)

export const PERSPECTIVE_QUERY = defineQuery(`*[_type == "perspective" && slug.current == $slug][0]{
  ${PERSPECTIVE_CARD},
  body,
  seo
}`)

export const PERSPECTIVE_SLUGS_QUERY = defineQuery(
  `*[_type == "perspective" && defined(slug.current)].slug.current`,
)

export const PERSPECTIVES_PAGE_QUERY = defineQuery(`{
  "items": *[_type == "perspective"] | order(publishedAt desc) [$offset...$end]{${PERSPECTIVE_CARD}},
  "total": count(*[_type == "perspective"])
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
  "next": *[_type == "caseStudy" && _id != ^._id] | order(_createdAt desc) [0]{title, "slug": slug.current, heroMedia}
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

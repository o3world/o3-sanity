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
export const INSIGHT_CARD = /* groq */ `
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

/** Dereference a button's internal target into the `{_type, title, slug}` shape `hrefForDoc` consumes. */
const BUTTON_TARGET = /* groq */ `"target": target->{_type, title, "slug": slug.current}` as const

/**
 * The section-array projection shared by `page.sections` and
 * `caseStudy.story`. Per-type conditional arms expand exactly what
 * each block renderer needs beyond the raw fields:
 * - button targets are dereferenced everywhere a button appears (incl.
 *   layoutSection column items);
 * - logo wall / case showcase / insights carousel expand their references
 *   into card projections, and personGridSection does the same for the
 *   `person` documents the About team band points at;
 * - insightsCarouselSection also fetches a `latest` fallback feed so an
 *   empty curated list auto-fills (renderer picks `curated` when non-empty);
 * - listingSection resolves its page list at query time so the renderer stays
 *   a pure component.
 */
const SECTION_FIELDS = /* groq */ `
  ...,
  _type == "heroSection" => {
    button{..., ${BUTTON_TARGET}}
  },
  _type == "logoWallSection" => {
    "clients": clients[]->{_id, name, logo},
    button{..., ${BUTTON_TARGET}}
  },
  _type == "caseShowcaseSection" => {
    "caseStudies": caseStudies[]->{${CASE_STUDY_CARD}},
    button{..., ${BUTTON_TARGET}}
  },
  _type == "railPanelsSection" => {
    panels[]{..., button{..., ${BUTTON_TARGET}}}
  },
  _type == "insightsCarouselSection" => {
    "curated": insights[]->{${INSIGHT_CARD}},
    "latest": *[_type == "insight" && (!defined(^.category) || ^.category._ref in categories[]._ref)] | order(publishedAt desc)[0...8]{${INSIGHT_CARD}}
  },
  _type == "ctaSection" => {
    button{..., ${BUTTON_TARGET}}
  },
  _type == "formSection" => {
    button{..., ${BUTTON_TARGET}}
  },
  _type == "personGridSection" => {
    ${
      /* `_key` is the ARRAY ITEM's, not the person's, and the dereference
        would drop it — so the projection spreads the person into the item
        rather than replacing it. The band stamps each card with
        `…people[_key=="…"]` (#107), which is the reference's own path: the
        thing an editor reorders or removes here is the slot, not the
        `person` document behind it. */ ''
    }
    "people": people[]{_key, ...@->{_id, name, title, bio, headshot}}
  },
  _type == "roleListSection" => {
    roles[]{..., button{..., ${BUTTON_TARGET}}}
  },
  _type == "inFlightSection" => {
    entries[]{..., button{..., ${BUTTON_TARGET}}}
  },
  _type == "layoutSection" => {
    items[]{
      ...,
      _type == "button" => {${BUTTON_TARGET}},
      _type == "buttonGroup" => {buttons[]{..., ${BUTTON_TARGET}}},
      _type == "mediaCard" => {button{..., ${BUTTON_TARGET}}}
    }
  },
  _type == "listingSection" => {
    "pages": *[_type == "page" && pageType == ^.pageType && slug.current != "index"] | order(title asc){_id, _type, title, "slug": slug.current, card}
  }
` as const

export const SITE_SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings"][0]{
  title,
  utilityNavItems[]{..., ${BUTTON_TARGET}},
  navItems[]{
    ...,
    _type == "button" => {${BUTTON_TARGET}},
    _type == "navGroup" => {
      items[]{..., button{..., ${BUTTON_TARGET}}},
      button{..., ${BUTTON_TARGET}}
    }
  },
  primaryButton{..., ${BUTTON_TARGET}},
  footerTagline,
  footerGroups[]{..., links[]{..., ${BUTTON_TARGET}}},
  socialsLabel,
  socialLinks,
  legalLinks[]{..., ${BUTTON_TARGET}},
  legalName,
  copyrightNote,
  defaultSeo
}`)

/**
 * The insight detail route (#45).
 *
 * `related` / `latest` feed the frame's closing "Keep reading." band
 * (`1751:1947`), which is the Home Blog row's carousel drawn onto the article
 * page. Two lists rather than one, the same shape `insightsCarouselSection`
 * uses: `related` shares a category with the article, `latest` is the fallback
 * for an insight whose category is a dead end. Both exclude the article
 * itself — the one thing a reader is guaranteed not to want next.
 *
 * ⚠️ **`^.^` in the category match is not a typo.** `^` inside the `*[]`
 * filter is this document (which is why `_id != ^._id` works), but the array
 * filter inside `count()` opens a further scope, so one caret there resolves
 * to the *candidate* document — comparing every insight's categories to
 * its own and matching all 272. Two carets reach back out to the article.
 */
export const INSIGHT_QUERY = defineQuery(`*[_type == "insight" && slug.current == $slug][0]{
  ${INSIGHT_CARD},
  body,
  seo,
  "related": *[_type == "insight" && _id != ^._id && count((categories[]._ref)[@ in ^.^.categories[]._ref]) > 0] | order(publishedAt desc)[0...8]{${INSIGHT_CARD}},
  "latest": *[_type == "insight" && _id != ^._id] | order(publishedAt desc)[0...8]{${INSIGHT_CARD}}
}`)

export const INSIGHT_SLUGS_QUERY = defineQuery(
  `*[_type == "insight" && defined(slug.current)].slug.current`,
)

/**
 * The /insights index (#61), filtered by one category slug.
 *
 * `$category` is null on the unfiltered index, which the `== null` arm short-
 * circuits — the same shape `LATEST_INSIGHTS_QUERY` uses for its optional
 * category. Matching on the **slug** rather than the reference id is what lets
 * the filter live in the URL (`/insights?category=design`) instead of leaking
 * a document id into it.
 *
 * `total` repeats the filter deliberately: the pager counts the filtered feed,
 * so switching category re-pages rather than leaving page 4 of an unfiltered
 * collection pointing at nothing.
 *
 * The third key is the **filter bar's own options** (`2337:4486`), fetched in
 * the same round-trip rather than as a second request. Two rules shape it:
 *
 * - **only categories that have an article** — a chip that returns an empty
 *   grid is a broken control, and 11 categories exist against a feed that does
 *   not use all of them;
 * - **never `uncategorized`** — WordPress's "nobody filed this" sentinel, which
 *   migrated as an ordinary document. As a chip it would promise a topic and
 *   deliver 45 unrelated articles. They stay reachable under All.
 *
 * Ordered by title, the same ordering `listingSection` gives its pages. The
 * frame draws five chips (AI, Design, Technology, 1682 Conference, Life at O3)
 * — a curated subset no schema field can express today, so this returns every
 * category that earns one and the bar wraps.
 */
export const INSIGHTS_PAGE_QUERY = defineQuery(`{
  "items": *[_type == "insight" && ($category == null || $category in categories[]->slug.current)] | order(publishedAt desc) [$offset...$end]{${INSIGHT_CARD}},
  "total": count(*[_type == "insight" && ($category == null || $category in categories[]->slug.current)]),
  "categories": *[_type == "category" && slug.current != "uncategorized" && count(*[_type == "insight" && references(^._id)]) > 0] | order(title asc){title, "slug": slug.current}
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

export const LATEST_INSIGHTS_QUERY = defineQuery(
  `*[_type == "insight" && ($categoryId == null || $categoryId in categories[]._ref)] | order(publishedAt desc) [0...$limit]{${INSIGHT_CARD}}`,
)

export const CASE_STUDY_QUERY = defineQuery(`*[_type == "caseStudy" && slug.current == $slug][0]{
  ${CASE_STUDY_CARD},
  stats,
  deliverables,
  ${
    /* The interleaved narrative — chapters and section blocks in one array
      (ADR 0018). SECTION_FIELDS opens with `...`, so a `chapter` member falls
      through it untouched (its `body` and `details` are inline) and each
      section member still gets its own expansion arm. */ ''
  }
  "story": story[]{${SECTION_FIELDS}},
  seo,
  ${
    /* The next-project band draws a whole Case Study Card at 1440
      (`2250:1564`), so the neighbour it fetches is the card projection —
      logo, eyebrow, narrative line and stat included. */ ''
  }
  "next": *[_type == "caseStudy" && _id != ^._id] | order(_createdAt desc) [0]{${CASE_STUDY_CARD}}
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
  "insights": *[_type == "insight" && defined(slug.current) && (seo.noIndex != true)]{"slug": slug.current, _updatedAt},
  "caseStudies": *[_type == "caseStudy" && defined(slug.current) && (seo.noIndex != true)]{"slug": slug.current, _updatedAt},
  "pages": *[_type == "page" && defined(slug.current) && (seo.noIndex != true)]{"slug": slug.current, _updatedAt}
}`)

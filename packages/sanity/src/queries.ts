import { defineQuery } from 'groq'

/**
 * THE BLUR-UP EXPANSION. A bare `...` spread carries an image field's asset as
 * a reference and nothing else, so the LQIP — the ~20px data URI every Sanity
 * asset already stores — never reaches the renderer. These fragments join the
 * asset document for it; `SanityImage` paints whatever arrives as the `<img>`'s
 * own background and the full image covers it on decode.
 *
 * **Applied to photographic fields only, and that is the scoping mechanism.**
 * A logo is knocked out or sits transparent over a surface, and an LQIP is
 * rendered onto a flat ground — behind one it reads as a coloured plate. So
 * `client.logo`, the partner-hero `logo`, the rail-panel `logo` and the service
 * card's `icon` stay unexpanded and get no background at all. `isOpaque` is the
 * second guard, for a photographic field holding artwork with alpha anyway.
 *
 * `_id` rather than a full asset spread: it is the one field the URL builder
 * needs (it reads `_ref` or `_id`), and the rest of an asset document — palette,
 * EXIF, dimensions — is weight on every card payload for nothing.
 */
const PHOTO_FIELDS = /* groq */ `..., asset->{_id, metadata{lqip, isOpaque}}` as const

/** The same, for the objects that wrap a photo in a field called `image` — `figure` and `backgroundMedia`. */
const PHOTO_OBJECT_FIELDS = /* groq */ `..., image{${PHOTO_FIELDS}}` as const

/** Portable text carries `figure` members inline; they are photos like any other. */
const BODY_FIELDS = /* groq */ `..., _type == "figure" => {${PHOTO_OBJECT_FIELDS}}` as const

/**
 * THE CARD-SIDE FALLBACK, EXPRESSED ONCE (#416).
 *
 * A document carries two figures with one job each: `heroMedia` leads the
 * detail page, `cardMedia` is what it shows on cards and in feeds. Neither is
 * required, so a card draws `cardMedia` and falls back to `heroMedia`.
 *
 * It resolves here rather than in each card renderer because every card
 * consumer — the two collection feeds, the case showcase band, the insights
 * carousel, the next-case band — reads one of the two card projections below.
 * A consumer added later inherits the chain instead of having to remember it,
 * and the payload still carries one figure: a card never draws a hero.
 */
const CARD_MEDIA =
  /* groq */ `"cardMedia": coalesce(cardMedia, heroMedia){${PHOTO_OBJECT_FIELDS}}` as const

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
  featuredImage{${PHOTO_OBJECT_FIELDS}},
  ${
    /* `headshot` is here for the DETAIL byline (`1710:2946`), not the card —
      the card draws no author at all. It rides on the shared fragment because
      splitting the author projection in two would leave two places to keep in
      step for one image reference. */ ''
  }
  "author": author->{name, title, headshot{${PHOTO_FIELDS}}},
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
  ${CARD_MEDIA},
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
  ${
    /* Unconditional because every section block carries the field
      (`backgroundMediaField()`), so there is no arm to hang it off. */ ''
  }
  backgroundMedia{${PHOTO_OBJECT_FIELDS}},
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
    panels[]{..., media{${PHOTO_OBJECT_FIELDS}}, button{..., ${BUTTON_TARGET}}}
  },
  _type == "mediaSection" => {
    media{${PHOTO_OBJECT_FIELDS}}
  },
  _type == "screenGridSection" => {
    screens[]{..., media{${PHOTO_OBJECT_FIELDS}}}
  },
  _type == "insightsCarouselSection" => {
    "curated": insights[]->{${INSIGHT_CARD}},
    "latest": *[_type == "insight" && (!defined(^.category) || ^.category._ref in categories[]._ref)] | order(publishedAt desc)[0...8]{${INSIGHT_CARD}}
  },
  _type == "ctaSection" => {
    button{..., ${BUTTON_TARGET}}
  },
  _type == "formSection" => {
    media{${PHOTO_OBJECT_FIELDS}},
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
    "people": people[]{_key, ...@->{_id, name, title, bio, headshot{${PHOTO_FIELDS}}}}
  },
  _type == "roleListSection" => {
    roles[]{..., button{..., ${BUTTON_TARGET}}}
  },
  _type == "inFlightSection" => {
    entries[]{..., media{${PHOTO_OBJECT_FIELDS}}, button{..., ${BUTTON_TARGET}}}
  },
  _type == "layoutSection" => {
    items[]{
      ...,
      _type == "button" => {${BUTTON_TARGET}},
      _type == "buttonGroup" => {buttons[]{..., ${BUTTON_TARGET}}},
      _type == "figure" => {${PHOTO_OBJECT_FIELDS}},
      _type == "richText" => {body[]{${BODY_FIELDS}}},
      _type == "mediaCard" => {media{${PHOTO_OBJECT_FIELDS}}, button{..., ${BUTTON_TARGET}}}
    }
  },
  ${
    /* A `chapter` is a story member, not a section block, and it otherwise
      falls straight through the opening `...` — including the figures inside
      its portable-text body. */ ''
  }
  _type == "chapter" => {
    body[]{${BODY_FIELDS}}
  },
  _type == "listingSection" => {
    "pages": *[_type == "page" && pageType == ^.pageType && slug.current != "index"] | order(title asc){_id, _type, title, "slug": slug.current, card}
  }
` as const

export const SITE_SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings"][0]{
  title,
  ${
    /* The strip's two member kinds. A `brandLogo`'s `logo` stays unexpanded —
      it is a knocked-out mark, so it takes no LQIP, for the reason
      `PHOTO_FIELDS` states above. */ ''
  }
  utilityNavItems[]{
    ...,
    _type == "button" => {${BUTTON_TARGET}},
    _type == "brandLogo" => {button{..., ${BUTTON_TARGET}}}
  },
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
/** The Keep-reading band's first choice: insights sharing a category with this one. */
const RELATED_INSIGHTS =
  /* groq */ `*[_type == "insight" && _id != ^._id && count((categories[]._ref)[@ in ^.^.categories[]._ref]) > 0]` as const

export const INSIGHT_QUERY = defineQuery(`*[_type == "insight" && slug.current == $slug][0]{
  ${INSIGHT_CARD},
  body[]{${BODY_FIELDS}},
  seo,
  "related": ${RELATED_INSIGHTS} | order(publishedAt desc)[0...8]{${INSIGHT_CARD}},
  ${
    /* THE FALLBACK IS FETCHED ONLY WHEN IT IS THE ANSWER. `select` evaluates
      the arm it matches and nothing else, so an article with related reading
      pays a `count` over the same filter instead of eight more card
      projections — half the response of the site's most-requested query, on
      every request. Today no insight in the dataset has an empty `related`,
      so `latest` was dead weight on all 107,694 of them in the week to
      2026-08-26; it stays because a first article under a new category is one
      publish away, and an empty band is the one thing this key exists to
      prevent.

      The filter is repeated rather than referenced — GROQ has no way to name
      the sibling key's result — which is why it is a fragment. The trailing
      `[]` is the unmatched arm: without it `select` answers null, and the
      generated type would go on promising an array. */ ''
  }
  "latest": select(count(${RELATED_INSIGHTS}) == 0 => *[_type == "insight" && _id != ^._id] | order(publishedAt desc)[0...8]{${INSIGHT_CARD}}, [])
}`)

export const INSIGHT_SLUGS_QUERY = defineQuery(
  `*[_type == "insight" && defined(slug.current)].slug.current`,
)

/**
 * THE HEAD OF A COLLECTION FEED, AS ITS INDEX DOCUMENT ORDERS IT.
 *
 * `collectionIndex.pinnedItems` is a hand-ordered list of documents an editor
 * wants first; everything the list does not name follows newest-first, which
 * is the ordering the whole feed had before the field existed. An empty or
 * absent list therefore changes nothing.
 *
 * Fragments rather than one expression, because GROQ has no way to name a
 * sub-result: the ids are needed to exclude the pinned documents from the
 * tail, and both halves are needed twice over (once for `items`, once for
 * `total`). Consts and not functions — a function returns a widened `string`
 * and the query stops being a `keyof SanityQueries` after typegen (TS#33304).
 *
 * The dereference is parenthesised before it is filtered —
 * `(…pinnedItems[]->)[_type == "…"]` — so the predicate reads the resolved
 * **documents**. Written without the parentheses it binds to the reference
 * array instead and answers a list of nulls. Filtering there is what drops a
 * reference pointing at nothing and one pointing at the other collection:
 * both are states a dataset reaches without Studio — a deleted document, an
 * API write — and neither may put a null in the feed or an extra in the
 * count. `coalesce(…, [])` covers the third case, no index document at all,
 * whose `+` operand would otherwise be null and take the feed with it.
 */
const INSIGHT_INDEX =
  /* groq */ `*[_type == "collectionIndex" && collection == "insight"] | order(_id)[0]` as const
const PINNED_INSIGHT_REFS = /* groq */ `coalesce(${INSIGHT_INDEX}.pinnedItems[]._ref, [])` as const
const PINNED_INSIGHTS =
  /* groq */ `coalesce((${INSIGHT_INDEX}.pinnedItems[]->)[_type == "insight"], [])` as const
const UNPINNED_INSIGHTS =
  /* groq */ `*[_type == "insight" && !(_id in ${PINNED_INSIGHT_REFS})]` as const

const CASE_STUDY_INDEX =
  /* groq */ `*[_type == "collectionIndex" && collection == "caseStudy"] | order(_id)[0]` as const
const PINNED_CASE_STUDY_REFS =
  /* groq */ `coalesce(${CASE_STUDY_INDEX}.pinnedItems[]._ref, [])` as const
const PINNED_CASE_STUDIES =
  /* groq */ `coalesce((${CASE_STUDY_INDEX}.pinnedItems[]->)[_type == "caseStudy"], [])` as const
const UNPINNED_CASE_STUDIES =
  /* groq */ `*[_type == "caseStudy" && !(_id in ${PINNED_CASE_STUDY_REFS})]` as const

/**
 * The /insights index (#61), filtered by one category slug.
 *
 * `$category` is null on the unfiltered index, which the `== null` arm short-
 * circuits — the same shape `LATEST_INSIGHTS_QUERY` uses for its optional
 * category. Matching on the **slug** rather than the reference id is what lets
 * the filter live in the URL (`/insights/category/design`) instead of leaking
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
 *
 * **The unfiltered feed leads with the index's `pinnedItems`.** See
 * `pinnedRefs` above; a category filter takes the plain date order.
 */
export const INSIGHTS_PAGE_QUERY = defineQuery(`{
  "items": select(
    $category == null => (${PINNED_INSIGHTS} + (${UNPINNED_INSIGHTS} | order(publishedAt desc) [0...$end]))[$offset...$end]{${INSIGHT_CARD}},
    *[_type == "insight" && $category in categories[]->slug.current] | order(publishedAt desc) [$offset...$end]{${INSIGHT_CARD}}
  ),
  "total": select(
    $category == null => count(${PINNED_INSIGHTS}) + count(${UNPINNED_INSIGHTS}),
    count(*[_type == "insight" && $category in categories[]->slug.current])
  ),
  "categories": *[_type == "category" && slug.current != "uncategorized" && count(*[_type == "insight" && references(^._id)]) > 0] | order(title asc){title, "slug": slug.current}
}`)

/**
 * The category slugs `/insights` has a filtered path for (#370).
 *
 * The same set the filter bar draws — every category with an article, minus
 * WordPress's `uncategorized` sentinel — reduced to the slugs, because what
 * reads it is `generateStaticParams` and a path is all it builds. The two
 * conditions are repeated rather than shared: a fragment would have to be
 * interpolated into both, and the `defineQuery` a build enumerates is the one
 * that has to be readable on its own.
 */
export const INSIGHT_CATEGORY_SLUGS_QUERY = defineQuery(
  `*[_type == "category" && slug.current != "uncategorized" && count(*[_type == "insight" && references(^._id)]) > 0].slug.current`,
)

/**
 * The /work index (#43). The index document's `pinnedItems` lead, in the
 * order they are listed; the rest follow newest first on `publishedAt`,
 * falling back to `_createdAt` so the seeded case studies — which carry no
 * publish date — still take a stable position instead of sorting as nulls.
 *
 * **The slice runs over the joined sequence**, so a page boundary may fall
 * inside the pinned head or after it. The tail is capped at `[0...$end]`
 * before the join: the page needs at most `$end` documents in total, and
 * without the cap the whole collection is materialised to hand back nine.
 */
export const CASE_STUDIES_PAGE_QUERY = defineQuery(`{
  "items": (${PINNED_CASE_STUDIES} + (${UNPINNED_CASE_STUDIES} | order(coalesce(publishedAt, _createdAt) desc) [0...$end]))[$offset...$end]{${CASE_STUDY_CARD}},
  "total": count(${PINNED_CASE_STUDIES}) + count(${UNPINNED_CASE_STUDIES})
}`)

/**
 * The chrome around a collection's feed (#347) — the bands an editor composes
 * above and below a listing the route keeps for itself.
 *
 * Matched on `collection` rather than a slug: this document has no URL of its
 * own, and the route it belongs to is the fact that identifies it.
 *
 * Ordered before the slice even though `collection` is validated unique. The
 * uniqueness rule runs in Studio, and a document can reach a dataset without
 * passing through one — a migration load, an import, an API write. Ordering
 * costs nothing here and turns "whichever came back first" into a stable
 * answer, so a duplicate shows up as one index consistently winning rather
 * than as a page that changes between requests.
 */
export const COLLECTION_INDEX_QUERY =
  defineQuery(`*[_type == "collectionIndex" && collection == $collection] | order(_id)[0]{
  _id,
  _type,
  title,
  collection,
  "sectionsAbove": sectionsAbove[]{${SECTION_FIELDS}},
  "sectionsBelow": sectionsBelow[]{${SECTION_FIELDS}},
  seo
}`)

export const LATEST_INSIGHTS_QUERY = defineQuery(
  `*[_type == "insight" && ($categoryId == null || $categoryId in categories[]._ref)] | order(publishedAt desc) [0...$limit]{${INSIGHT_CARD}}`,
)

export const CASE_STUDY_QUERY = defineQuery(`*[_type == "caseStudy" && slug.current == $slug][0]{
  ${CASE_STUDY_CARD},
  ${
    /* The card projection carries `cardMedia` and no hero — a card never
      draws one. The detail page draws both sides, so it asks for the lead
      figure by name on top of the spread. */ ''
  }
  heroMedia{${PHOTO_OBJECT_FIELDS}},
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

# 0013. The 24 WordPress services consolidate into `/solutions`, and there is no service detail layer

- **Status:** Accepted
- **Date:** 2026-08-02
- **Deciders:** NickO3 + Claude
- **Related:** [issue #47](https://github.com/o3world/o3-sanity/issues/47), [issue #24](https://github.com/o3world/o3-sanity/issues/24), [issue #40](https://github.com/o3world/o3-sanity/issues/40), [issue #3](https://github.com/o3world/o3-sanity/issues/3), [issue #33](https://github.com/o3world/o3-sanity/issues/33), [ADR 0007](./0007-content-sourcing-and-provenance.md)

## Context

CONTEXT.md puts "the consolidated services story" in the greenfield column and
#40 recorded the open half of it: **24 WordPress service pages** that get
consolidated rather than migrated one-to-one, with the Solutions frame deciding
what they consolidate _into_. Two facts had to be established before that
sentence could become a decision, and both were cheap to get and load-bearing.

### What the 24 actually are

They are not pages. `services` is a **custom post type hidden from REST** (#3
counted it from `services-sitemap.xml`, which still lists exactly 24 URLs,
`lastmod` 2024-08-06). The extractor pulls `post_type => "page"` and got 22
documents, of which only three sit under `/solutions/` — which is why
`data/extract/page/` has never held a service and why `KEEPER_SLUGS` never had
to rule on one. Nothing in the repo has ever seen this content.

### WordPress has already consolidated them once

Checked live, all 24 (2026-08-02). **`/services/` is a 404** and **21 of the 24
detail URLs already 301**, through a set of verb-named hubs — `/engage/`,
`/convert/`, `/include/`, `/analyze/`, `/innovate/`, `/transcend/` — which
themselves redirect on, two and three hops deep, to:

| Terminal destination                                  | Services landing there |
| ----------------------------------------------------- | ---------------------: |
| `/solutions/conversion-rate-optimization-consultant/` |                     18 |
| `/solutions/digital-experience-consulting-services/`  |                      1 |
| `https://www.o3xo.ai/`                                |                      1 |
| `/`                                                   |                      1 |
| still serving their own page                          |                      3 |

So the site's owners already decided these 24 are not 24 things. The redesign is
not proposing a consolidation; it is finishing one that ran out of road at a
pair of landing pages the new design does not have either.

### What the Solutions frame does with them

Read in full — `1925:6138`, the only Solutions frame in the Design Concept
section. Four bands: the hero, the orbital discipline diagram (`1928:6524`),
the "Three ways in" engagement cards (`1925:6108`), the CTA.

**There is no listing anywhere on it.** No card grid of services, no index, no
link into a service, no "our capabilities" band. The page answers "what do you
do" with four disciplines and "how do we buy it" with three engagement models,
and then sends the reader to `/contact`. That is the consolidation, stated by
the design: the 24 nouns become **four disciplines**.

## Decision

**The 24 services consolidate into `/solutions` — the page, not a namespace
beneath it. There is no `/services` route on the new site and no service detail
layer.**

Three parts, each independently checkable:

### 1. No `services/*` documents

Nothing is migrated from the `services` CPT. The four disciplines on the frame
(Strategy · AI · Engineering · Design) are the consolidated story, and they are
inline `discipline` objects on `disciplineGridSection`, not documents — they
have no URL, no detail page, and nothing links to one.

### 2. Every `/services/{slug}/` redirects to `/solutions`, bar two

The map #24 inherits. `/solutions` is the destination because it is where the
existing chain was already heading — the two landing pages 21 of these resolve
to today both die in this redesign, so pointing at them would be a redirect to
a 404. The two exceptions keep the destination the current site chose, because
overriding a live editorial decision is not a migration's job:

| WordPress URL                                       | New destination          |
| --------------------------------------------------- | ------------------------ |
| `/services/ux-audit/`                               | `/solutions`             |
| `/services/benchmark-surveys/` \*                   | `/solutions`             |
| `/services/content-strategy/`                       | `/solutions`             |
| `/services/customer-journey-mapping/` \*            | `/solutions`             |
| `/services/accessibility-audit/`                    | `/solutions`             |
| `/services/advanced-technology-cms-audit/`          | `/solutions`             |
| `/services/brand-audit/`                            | `/solutions`             |
| `/services/user-type-workshop/`                     | `/solutions`             |
| `/services/data-analysis-benchmarking/`             | `/solutions`             |
| `/services/conversion-rate-optimization/`           | `/solutions`             |
| `/services/personalization-strategy/`               | `/solutions`             |
| `/services/experience-design/`                      | `/` †                    |
| `/services/custom-web-mobile-applications/`         | `/solutions`             |
| `/services/innovation-strategy/`                    | `/solutions`             |
| `/services/api-creation/`                           | `/solutions`             |
| `/services/marketing-automation/`                   | `/solutions`             |
| `/services/systems-integration/`                    | `/solutions`             |
| `/services/software-development/`                   | `/solutions`             |
| `/services/content-management-solutions/`           | `/solutions`             |
| `/services/video-production/`                       | `/solutions`             |
| `/services/data-analytics-ai-consulting/`           | `/solutions`             |
| `/services/ensuring-accessibility-in-higher-ed/` \* | `/solutions`             |
| `/services/accessibility-consulting-optimization/`  | `/solutions`             |
| `/services/ai-consulting/`                          | `https://www.o3xo.ai/` † |

\* the three that still serve their own page today — they lose one, and are the
only real content loss in this ADR. † the destination WordPress already chose.

**Nine more URLs come with them**, and they are the reason this table is not
just the sitemap: every link in the existing chain is itself a live, indexable
URL, and none of them is in `services-sitemap.xml`.

| URL                                                   | New destination        |
| ----------------------------------------------------- | ---------------------- |
| `/engage/`                                            | `/solutions`           |
| `/convert/`                                           | `/solutions`           |
| `/include/`                                           | `/solutions`           |
| `/analyze/`                                           | `/solutions`           |
| `/innovate/`                                          | `/solutions`           |
| `/transcend/`                                         | `https://www.o3xo.ai/` |
| `/enterprise-digital-products/`                       | `/solutions`           |
| `/solutions/conversion-rate-optimization-consultant/` | `/solutions`           |
| `/solutions/digital-experience-consulting-services/`  | `/solutions`           |

**Redirect to the terminal, never to a redirect.** The current site chains
three deep; rebuilding the chain would ship the latency and the leaked link
equity along with the URLs.

### 3. `listingSection` does not serve this layer, and nothing else does either

The block lists `page` documents by `pageType` through their `card` fieldset.
With no service documents there is nothing to list, and the frame draws no
listing to put them in. That leaves `listingSection`, `pageType: 'service'` and
the conditional `card` fieldset with **no consumer anywhere in the repo** — a
schema conversation under working agreement 3, raised on #47 rather than
resolved here. Deleting them is a plausible outcome; doing it inside a page
layer is not.

## Alternatives considered

### Migrate the 24 one-to-one as `service` pages under `services/{slug}`

- **Pros:** the schema was built for exactly this — multi-segment slugs, `pageType`, the card fieldset, `listingSection`. 24 URLs keep their content and their rankings, and the redirect map is empty.
- **Cons:** it contradicts CONTEXT.md, it contradicts the frame (which has nowhere to link them from), and it contradicts **WordPress**, which redirected 21 of them away years ago. It would also mean extracting a CPT nobody has looked at since 2023 and building a listing band no canonical frame draws.
- **Why not:** three sources agree these are not 24 things. Re-creating them would be the redesign's only act of deliberately restoring content its owners had already retired.

### Carry WordPress's own consolidation forward — keep the two `/solutions/*` landing pages

- **Pros:** exactly preserves today's URL graph; 21 redirects already point there, so nothing has to be re-decided. The pages have real, recent marketing copy.
- **Cons:** both are ACF `multiple_columns` marketing pages the frame replaces wholesale, and `map/page.ts` already put them in the greenfield column. Keeping them means `/solutions` has two children saying a similar thing in the old voice, directly under a page whose whole argument is "we don't sell services".
- **Why not:** it preserves the URL and discards the point. The redirect achieves the URL half at no content cost.

### Redirect all 24 to `/`

- **Pros:** the safest single target — the homepage will always exist, and a service enquiry is a lead wherever it lands.
- **Cons:** it throws away the one thing the source URL tells you, which is that the visitor was looking for what O3 does. `/solutions` is that answer, and it is one click from `/contact`.
- **Why not:** relevance is the whole reason to redirect rather than 410. (`/services/experience-design/` still goes to `/` — because that is where WordPress sends it, not because it is a better rule.)

## Consequences

- **#24 has its input.** The table above is the services half of the redirect
  map; `_yoast_post_redirect_info` on 20 posts and `PATH_EXCEPTIONS` remain the
  other halves. Nothing here implements a redirect — that is #24's job, and
  doing it in two places is how they drift.
- **Three URLs lose a live page** (`benchmark-surveys`,
  `customer-journey-mapping`, `ensuring-accessibility-in-higher-ed`). Named so
  the loss is a decision rather than a discovery, and recoverable: the content
  is still on the live site if anyone wants it back.
- **`listingSection`, `pageType: 'service'` and `page.card` are now orphaned.**
  Raised on #47 as a schema conversation. `docs/specs/schema.md`'s claim that
  `listingSection` "powers `/services`" is no longer true and is corrected in
  the same commit.
- **Service detail pages are ruled out, not deferred.** If one is ever wanted,
  it arrives as an ordinary Page with a multi-segment slug and needs no schema
  work — which is exactly why ruling them out now costs nothing.
- **`/solutions` gains no new inbound structure.** It stays a single seeded
  `page` document resolved by the catch-all, the same route kind as `/about`
  and `/live`.

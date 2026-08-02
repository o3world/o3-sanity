# SEO parity with WordPress

What the new site owes the old one, and whether it pays it (#24). Three
questions, each with an executable answer rather than a promise:

| Question                                 | Answered by                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| Does every live URL still resolve?       | `tools/migration/src/map/redirects.test.ts` → "against the live Yoast sitemaps" |
| Does the redirect table match WordPress? | The same file → "matches the file the app actually serves"                      |
| Does per-document Yoast meta survive?    | `apps/web/src/content/documents/seoParity.render.test.tsx`                      |

Everything below is a snapshot of the 2026-08-02 run. The tests are the live
version; this file is the reasoning.

---

## The URL diff

`data/extract/site/yoast-sitemaps.json` is the committed snapshot of all five
Yoast sitemaps — **339 URLs**, fetched 2026-08-02. Every one of them either
resolves at the same path on the new site or redirects. There are no gaps.

| Yoast sitemap | URLs | Served at the same path | Redirected | Gaps |
| ------------- | ---: | ----------------------: | ---------: | ---: |
| `post`        |  272 |                     272 |          0 |    0 |
| `page`        |   21 |                      10 |         11 |    0 |
| `work`        |   20 |                      20 |          0 |    0 |
| `services`    |   24 |                       0 |         24 |    0 |
| `ventures`    |    2 |                       2 |          0 |    0 |
| **Total**     |  339 |                     304 |         35 |    0 |

Path parity is not an accident: every mapper calls `checkPathParity` against
Yoast's own `canonicalRendered`, `PATH_EXCEPTIONS` is still empty, and
`translated.test.ts` now applies the same check to the 20 translated case
studies, which have no mapper to do it for them.

### The other direction — what the new site adds

Five paths this site serves that no live sitemap lists. All greenfield, none a
slug that moved:

| Path                                                              | Why it is new                                                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `/live`                                                           | A net-new layer (ADR 0011)                                                              |
| `/perspectives/how-we-redesigned-our-website-in-a-single-weekend` | A seeded perspective about this build                                                   |
| `/work/aramark`, `/work/chop`, `/work/ironman`                    | The three hand-authored showcase placeholders — provisional, and #48's gate covers them |

`/ventures/rec-philly` and `/ventures/urvin` were in this list until #23 seeded
them. They are the reason this diff exists: `ventures` is a custom post type,
nothing had extracted it, and only a sitemap comparison would have found it.

---

## The redirect map

**317 redirects**, generated from the committed export by
`pnpm --filter @o3/migration redirects` and written to
`apps/web/src/lib/redirects.generated.ts`, which `next.config.ts` serves and
`app/sitemap.ts` reads. Regenerating is a build-out act with a diff, not
something `next build` does over the network.

### Where they come from

| Source                                                     | Rows |
| ---------------------------------------------------------- | ---: |
| Redirection plugin (`{prefix}redirection_items`)           |  290 |
| Yoast SEO Premium (`wpseo-premium-redirects-export-plain`) |   55 |
| ADR 0013's service + chain tables                          |   33 |
| Live URLs with no redirect row at all (see below)          |    8 |

Both plugins are active and neither knows about the other, so exporting only
the one the ticket names would have missed the `/services/*` chains — which is
to say the half ADR 0013 is about. Overlaps resolve to Redirection, which is
the plugin the site is administered through.

### Where they go

| Destination                | Rows | Note                                                              |
| -------------------------- | ---: | ----------------------------------------------------------------- |
| `/solutions`               |   59 | ADR 0013's consolidation, plus the partner pages                  |
| External (o3xo.ai)         |   39 | 32 of them shadow a migrated document — see below                 |
| `/about`                   |   30 | Team bios, careers, culture                                       |
| `/perspectives` and a post |  138 | Mostly `/news/*` → `/perspectives/*`, the 2022 rename             |
| `/`                        |   25 | Campaign landing pages WordPress already retired                  |
| Everything else            |   26 | `/work/*`, `/live`, `/1682-conference-ai-innovation`, `/ventures` |

Nothing chains: every source points at its terminal, per ADR 0013's "redirect
to the terminal, never to a redirect". The resolver walks WordPress's own
chains (three deep in places — `/transcend` → `/ai-solutions` →
`/solutions/ai-solutions` → …) and emits only where they end.

### The 32 that shadow a migrated document

The finding worth reading twice. WordPress still **holds** 29 posts and 3 case
studies — which is why the extractor found them and the loader loaded them —
while **301ing their URLs to o3xo.ai**, where their owners moved the content.

Serving them here would republish content the site deliberately gave away, on
the domain it gave it to, and compete with it for the ranking. So:

- the app redirects those URLs, exactly as WordPress does;
- `app/sitemap.ts` reads the same generated list and refuses to advertise any
  path that appears in it, so the sitemap and the redirect table cannot
  disagree;
- the documents stay in the dataset. **Editorial has to decide whether to
  unpublish them** — a 301 makes the URL unreachable, not the document.

Three of them are among #22's translated case studies
(`case-studies-ai-electrical-safety-e-hazard`,
`delivering-generative-ai-solution-legal-documents`, `rfp-automation-o3`), and
o3xo.ai's version of the second one names its client "Fortune 500 insurance
provider" — which is a lead on the anonymized-client flag #22 raised, from a
source outside this migration.

### Eight live URLs with no redirect row

WordPress serves these and this site will not, so they need a redirect nobody
had written. Each is decided in `UNREDIRECTED_LIVE_URLS` with its reason, on
ADR 0013's relevance rule — the source URL tells you what the visitor wanted:

| URL                                                             | Goes to                          |
| --------------------------------------------------------------- | -------------------------------- |
| `/careers`                                                      | `/about#careers`                 |
| `/community-engagement`                                         | `/about`                         |
| `/mike-gadsby-chief-innovation-officer`                         | `/about`                         |
| `/1682-photos`                                                  | `/1682-conference-ai-innovation` |
| `/lunch-and-learn-with-o3-empower-your-team-with-ai-insights`   | `/live`                          |
| `/conversing-with-the-future-an-interactive-chatgpt-experience` | `/perspectives`                  |
| `/acquia-o3`                                                    | `/solutions`                     |
| `/sitecore`                                                     | `/solutions`                     |

### Nine rules deliberately not carried

| Rule                                       | Why not                                                                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3 × `journey-mapping-workshop*`            | Yoast answers **410 Gone**. Next.js redirects cannot return 410; the app 404s, which is the closest true thing it can say.                                |
| `/?resource_type=ebook`                    | Matches on a **query string**. Redirection strips the query into `match_url`, so reading that column would have put a permanent redirect on the homepage. |
| `/404-2` → `/error404`                     | A redirect into WordPress's own 404 page.                                                                                                                 |
| 2 × `/resources/*` → a PDF in `wp-content` | The destination is an upload, not a page, and the uploads do not migrate. A 301 into a dead file is worse than a 404.                                     |
| `/source URL` → `/target URL`              | A placeholder row somebody saved by accident.                                                                                                             |
| `/utm_source…` → `/unknown`                | Same — a mangled campaign URL pointing at a page that never existed.                                                                                      |

One row was **corrected** rather than carried: `/perspectives/ai-roi-beyond-efficiency`
points at `https://www.o3xo.ai.com/…`, a host that does not resolve (checked
2026-08-02) while its 32 siblings all use `o3xo.ai`. Shipping the typo would be
a redirect into DNS failure; the correction is recorded in `TERMINAL_OVERRIDES`.

---

## Per-document Yoast meta

`seo` holds **overrides, never resolved values** (#26, `map/seo.ts`), and
`apps/web/src/lib/seo.ts` re-derives the rest at render time. What actually
migrated:

| Field                  |             Documents carrying an override |
| ---------------------- | -----------------------------------------: |
| `title`                |  106 perspectives, 12 case studies, 1 page |
| `description`          | 179 perspectives, 20 case studies, 7 pages |
| `ogImage`              |                             6 perspectives |
| `canonical`            |  0 — unset across the whole WordPress site |
| `noIndex` / `noFollow` |                              0 — see below |

`seoParity.render.test.tsx` renders one of each kind through its real route
and asserts the tags: a perspective that overrode all three fields, a
translated case study that overrode title and description and falls back to
its hero for the social card, and a migrated page that overrode only its
description.

Two rules the tests pin because they are invisible until they break: the
site-name suffix is stripped on the way in and re-appended by the root
layout's `title.template` (keeping both ships `Foo | O3 | O3`), and `og:title`
appends it itself, because a social scraper never sees the template.

## robots and noIndex

**One** WordPress document resolves to `noindex`: `error404`, a page that does
not migrate. Nothing in the migrated corpus is noindexed or nofollowed, and
`seoParity.render.test.tsx` asserts that over the whole committed corpus
rather than trusting it.

Everything else renders `index, follow` plus the crawl maxima Yoast emitted on
every page (`max-snippet: -1`, `max-image-preview: large`,
`max-video-preview: -1`) — the difference between "not blocked" and the rich
results the old site had.

`app/robots.ts` blanket-disallows any non-production deployment, so previews
and the staging alias never get indexed, and serves `/robots.txt` +
`sitemap.xml` only from the promoted production deployment. WordPress's own
`robots.txt` disallows nothing but `/wp-admin/`, which has no equivalent here;
`/studio` and `/api/` take its place.

---

## What is still open

- **32 documents are loaded and redirected away.** The redirect is right; what
  to do with the documents is an editorial call.
- **Case studies are draft-only** until a reviewer publishes them, so
  `sitemap.ts` currently lists three `/work/*` URLs (the seeded placeholders)
  rather than twenty. The redirect map and the diff above are computed from the
  committed corpus, which is complete; the sitemap catches up the moment the
  drafts are published.
- **The snapshot is a snapshot.** `data/extract/site/{redirects,yoast-sitemaps}.json`
  are re-fetchable (`extract -- --redirects`; the sitemaps by hand), and the
  parity test runs against whatever is committed. Re-fetch before cutover.

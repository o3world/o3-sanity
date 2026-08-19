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
| `post`        |  272 |                       0 |        272 |    0 |
| `page`        |   21 |                      10 |         11 |    0 |
| `work`        |   20 |                      17 |          3 |    0 |
| `services`    |   24 |                       0 |         24 |    0 |
| `ventures`    |    2 |                       2 |          0 |    0 |
| **Total**     |  339 |                      29 |        310 |    0 |

`work`'s "Redirected" column is the o3xo.ai-shadowed URLs described below —
WordPress still lists those documents in its sitemaps while 301ing their URLs
away, and the app mirrors both halves. A row here counts what the URL _does_,
not whether the document is loaded.

## What ADR 0017 cost

**Every `post` URL now redirects.** Until [ADR 0017](adr/0017-the-collection-is-an-insight.md)
this table read `243 served at the same path, 29 redirected`: the collection
lived at `/perspectives/*` on both sites, so all but the o3xo-shadowed posts
resolved at their own address. Renaming the collection to `/insights/*` moved
243 of them behind a 301.

That is a real cost, not a re-tabulation. A 301 preserves most but not all
link equity, and 243 URLs have to be recrawled before the new address is the
one search engines serve. It was accepted because the alternative — a URL that
disagrees forever with the word in the nav next to it — is a cost paid on every
visit rather than once. The figure is asserted in
`map/redirects.test.ts` → "moves exactly the URLs ADR 0017 said it would", so
it cannot drift quietly, and a future collection rename shows up there as a
change rather than a silently larger number.

Path parity is still not an accident: every mapper calls `checkPathParity`
against Yoast's own `canonicalRendered`, and a moved path has to be declared in
`PATH_EXCEPTIONS` / `PATH_PREFIX_EXCEPTIONS` (`map/paths.ts`) or conversion
fails. `translated.test.ts` applies the same check to the 20 translated case
studies, which have no mapper to do it for them.

### The other direction — what the new site adds

Two paths this site serves that no live sitemap lists. Both greenfield, neither
a slug that moved:

| Path                                                          | Why it is new                     |
| ------------------------------------------------------------- | --------------------------------- |
| `/live`                                                       | A net-new layer (ADR 0011)        |
| `/insights/how-we-redesigned-our-website-in-a-single-weekend` | A seeded insight about this build |

`/ventures/rec-philly` and `/ventures/urvin` were in this list until #23 seeded
them. They are the reason this diff exists: `ventures` is a custom post type,
nothing had extracted it, and only a sitemap comparison would have found it.

`/work/aramark`, `/work/chop` and `/work/ironman` were in it until
[ADR 0016](./adr/0016-publish-what-wordpress-publishes.md) deleted the three
invented showcase case studies. They are the other thing this diff is for: a
`/work/*` path the live site has never advertised is a case study nobody wrote.

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

| Destination            | Rows | Note                                                              |
| ---------------------- | ---: | ----------------------------------------------------------------- |
| `/solutions`           |   59 | ADR 0013's consolidation, plus the partner pages                  |
| External (o3xo.ai)     |   39 | 32 of them shadow a migrated document — see below                 |
| `/about`               |   30 | Team bios, careers, culture                                       |
| `/insights` and a post |  138 | Mostly `/news/*` → `/insights/*`, the 2022 rename                 |
| `/`                    |   25 | Campaign landing pages WordPress already retired                  |
| Everything else        |   26 | `/work/*`, `/live`, `/1682-conference-ai-innovation`, `/ventures` |

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
- the documents stay in the dataset, **published**, exactly as WordPress
  publishes them ([ADR 0016](./adr/0016-publish-what-wordpress-publishes.md)).
  A 301 makes the URL unreachable, not the document. Whether these documents
  should exist at all is an editorial call for whoever owns the o3xo
  relationship; the redirect layer does not wait on it.

Three of them are among #22's translated case studies
(`case-studies-ai-electrical-safety-e-hazard`,
`delivering-generative-ai-solution-legal-documents`, `rfp-automation-o3`), and
o3xo.ai's version of the second one names its client "Fortune 500 insurance
provider" — which is a lead on the anonymized-client flag #22 raised, from a
source outside this migration.

Those three are the whole of the difference between "published" and
"advertised" for `/work`: 20 case studies publish, `sitemap.ts` lists **17**,
and the three it drops are dropped by `REDIRECTED_PATHS` matching their real
slugs — not by a list anyone maintains.

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
| `/conversing-with-the-future-an-interactive-chatgpt-experience` | `/insights`                      |
| `/acquia-o3`                                                    | `/solutions`                     |
| `/sitecore`                                                     | `/solutions`                     |

### Rules deliberately not carried

| Rule                                       | Why not                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3 × `journey-mapping-workshop*`            | Yoast answers **410 Gone**. Next.js redirects cannot return 410; the app 404s, which is the closest true thing it can say.                                                                                                                                                                                   |
| `/?resource_type=ebook`                    | Matches on a **query string**. Redirection strips the query into `match_url`, so reading that column would have put a permanent redirect on the homepage.                                                                                                                                                    |
| `/404-2` → `/error404`                     | A redirect into WordPress's own 404 page.                                                                                                                                                                                                                                                                    |
| 2 × `/resources/*` → a PDF in `wp-content` | The destination is an upload, not a page, and the uploads do not migrate. A 301 into a dead file is worse than a 404.                                                                                                                                                                                        |
| `/source URL` → `/target URL`              | A placeholder row somebody saved by accident.                                                                                                                                                                                                                                                                |
| `/utm_source…` → `/unknown`                | Same — a mangled campaign URL pointing at a page that never existed.                                                                                                                                                                                                                                         |
| 10 duplicate-source rows                   | Redirection lets two rows claim one source; **position decides which one WordPress serves**, so the earlier row is carried and the later recorded here. 8 are trailing-slash twins whose targets normalize identically; the two that differ are decided by ADR 0013 or resolve to the position-first target. |

One row was **corrected** rather than carried: `/insights/ai-roi-beyond-efficiency`
points at `https://www.o3xo.ai.com/…`, a host that does not resolve (checked
2026-08-02) while its 32 siblings all use `o3xo.ai`. Shipping the typo would be
a redirect into DNS failure; the correction is recorded in `TERMINAL_OVERRIDES`.

---

## Per-document Yoast meta

`seo` holds **overrides, never resolved values** (#26, `map/seo.ts`), and
`packages/content-runtime/src/seo.ts` re-derives the rest at render time. What actually
migrated:

| Field                  |            Documents carrying an override |
| ---------------------- | ----------------------------------------: |
| `title`                |     106 insights, 12 case studies, 1 page |
| `description`          |    179 insights, 20 case studies, 7 pages |
| `ogImage`              |                                6 insights |
| `canonical`            | 0 — unset across the whole WordPress site |
| `noIndex` / `noFollow` |                             0 — see below |

`seoParity.render.test.tsx` renders one of each kind through its real route
and asserts the tags: an insight that overrode all three fields, a
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

- **32 documents are published and redirected away.** The redirect is right and
  ADR 0016 settles the publish state (WordPress publishes them, so this site
  does too); what to do with the documents themselves is still an editorial
  call.
- **The snapshot is a snapshot.** `data/extract/site/{redirects,yoast-sitemaps}.json`
  are re-fetchable (`extract -- --redirects`; the sitemaps by hand), and the
  parity test runs against whatever is committed. Re-fetch before cutover.

# Content sourcing per route

Where each route's content comes from: **migrate** from WordPress, **seed** by
transcribing the canonical Figma frame, or ship **provisional** so the link
resolves. The rules behind this table — and why migration outranks Figma on
facts while Figma outranks everything on the page — are
[ADR 0007](./adr/0007-content-sourcing-and-provenance.md).

This table changes as pages get built. The ADR does not.

## The order

**Migrate → seed-from-frame → provisional.** Reach for the next one only when
the previous has nothing to offer.

Seeding from a frame is a **transcription** job, not a writing job: the
canonical frames carry finished copy, and the frame it came from is recorded in
`migration.figmaNode`.

## Per route

| Route                                     | Frame                      | Source                | Documents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Ticket         |
| ----------------------------------------- | -------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `/`                                       | `1680:2134` / `1814:1618`  | seed-from-frame       | `page-seed-index` — **reconciled against the frame** (#42): composition, section order and copy all now the frame's. The showcase's three cards are the real IRONMAN, Vertex and Caron case studies, the clients the frame's own cards carry (ADR 0016)                                                                                                                                                                                                                                                                                                                                                                                                          | #42 ✅         |
| `/work`                                   | `1634:1167` / `1906:851`   | migrate               | **Dedicated route**, not a document — lists `caseStudy`; composition is code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | #43 ✅         |
| `/work/{slug}`                            | `1710:2300` / `1906:928`   | migrate ✅            | **All 20 translated** (#22) and **published** — WordPress publishes all 20 today ([ADR 0016](./adr/0016-publish-what-wordpress-publishes.md)). 17 serve here; the other 3 are among the o3xo.ai-shadowed set, so their URLs 301 away and the sitemap declines them                                                                                                                                                                                                                                                                                                                                                                                               | #44, #22       |
| `/insights`                               | `2336:4310` — **no 402**   | seed-from-frame       | **Dedicated route**, not a document — lists `insight`; composition is code. The frame #61 commissioned settles it, filter bar included, so the route is no longer provisional                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | #61 ✅         |
| `/insights/{slug}`                        | `1710:2823` / `1906:1046`  | migrate               | 272 insights, 12 persons, 11 categories — **loaded**. 33 carry a byline (the ACF `author`); the other 239 carry none, because the live site shows none (#32)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | #45            |
| `/about`                                  | `1924:5344`                | seed-from-frame       | `page-seed-about` — transcribed; the feature grid, team and Careers bands render through their own blocks (#56), and the frame's band imagery is committed under `seed/assets/`. Careers is a section, not a route. Provisional: the "What we optimize for" rail's third panel is the Services component's unoverridden default (the note on the seed itemizes it)                                                                                                                                                                                                                                                                                               | #46 ✅         |
| `/solutions`                              | `1925:6138` — **no 402**   | seed-from-frame       | `page-seed-solutions` — transcribed; the orbital diagram is `featureGridSection` `layout: orbital` (#56) and the engagement cards `railPanelsSection` `layout: cards` (#47). The 24 WordPress services consolidate **into this page** — [ADR 0013](./adr/0013-services-consolidate-into-solutions.md)                                                                                                                                                                                                                                                                                                                                                            | #47 ✅         |
| `/solutions/software-engineering`         | `2360:2879` — **no 402**   | seed-from-frame       | `page-seed-solutions-software-engineering` — the first `pageType: 'service'` page (#93; the frame is named "Solutions" in the file but draws a standalone service landing page). Interior Hero, an Overview `layoutSection` (photo committed under `seed/assets/`), the service grid as `railPanelsSection` `layout: grid`, the proof-point band as `layoutSection` with the molecule `decoration`, use cases as `featureGridSection` `layout: rows`. Provisional: the frame authors one use case ×3 and its foil/typo copy is amended (the note on the seed itemises it), and **nothing links here yet** — no nav, footer, or frame carries a service-page link | #93            |
| `/live`                                   | `1644:1889` / `1906:334`   | seed-from-frame       | `page-seed-live` — net-new layer, transcribed; three bands ride one new `inFlightSection`. Route named in [ADR 0011](./adr/0011-live-route-name.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | #50            |
| `/partners/sanity`                        | `2354:2446` — **no 402**   | seed-from-frame       | `page-seed-partners-sanity` — net-new layer under a new `pageType: 'partner'`. The services band is `railPanelsSection` `layout: rows`; the reasons, use cases and enablements are all `featureGridSection`, which is what renamed it from `disciplineGridSection`. Provisional: the frame authors one service and one use case and duplicates each three times                                                                                                                                                                                                                                                                                                  | #92            |
| `/contact`                                | `2960:7557` / `2975:10037` | transcribe            | `page-seed-contact` — two bands: the interior hero, then a form card beside a rail carrying the Handler portrait, his quote and the studio's address (#331). The form carries Gravity Form 1's real field set and posts to the app's `/api/contact` route, which forwards to HubSpot (#412)                                                                                                                                                                                                                                                                                                                                                                      | #48, #58, #331 |
| `/1682-conference-ai-innovation`          | **none**                   | migrate → provisional | `page-seed-1682-conference-ai-innovation` — all copy carried from the WordPress page (wpId 9545), including a CTA advertising a date that has passed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | #48            |
| `/accessibility-statement`                | none                       | migrate ✅            | `page` — converted and loaded                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | #18            |
| `/privacy-policy`                         | none                       | migrate ✅            | `page` — converted and loaded                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | #18            |
| `/ventures`                               | **none**                   | migrate → provisional | `page-seed-ventures` — all copy carried from the WordPress page (wpId 155): header, the five partner criteria, REC Philly / Sahay AI / 1682 Venture Awards, and the closing callout. An ordinary standard page per CONTEXT.md                                                                                                                                                                                                                                                                                                                                                                                                                                    | #23            |
| `/ventures/rec-philly`, `/ventures/urvin` | **none**                   | migrate → provisional | `page-seed-ventures-rec-philly`, `page-seed-ventures-urvin` — the `ventures` **CPT**: two published posts nothing had extracted, because the extractor pulls `post_type => page`. Found by #24's diff against `ventures-sitemap.xml`                                                                                                                                                                                                                                                                                                                                                                                                                             | #23            |
| Site chrome                               | `1710:2271` (NavBar)       | migrate + frame       | `siteSettings` singleton; nav gains **Live**, and **Solutions** replaces "Services"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | #41            |

✅ = loaded and done.

Four routes have a canonical desktop frame and **no 402 counterpart**: `/about`
(`1924:5344`), `/solutions` (`1925:6138`), `/partners/sanity` (`2354:2446`) and
`/solutions/software-engineering` (`2360:2879`).
No gap is the file hiding a frame — the Design Concept section holds one frame
each, at 1440. The "About Us" and "Solutions" **sections** elsewhere in the file
(`1924:4768` is the Solutions one) are generation-1 captures at 1920/390, not
the breakpoint pair #34 describes; building a mobile layout from them would ship
the old site. So every mobile composition on these three pages is a renderer
decision under ADR 0006, and the render tests say so where it matters.

## Provisional inventory

A provisional document exists so a route resolves. Its content is **not
authoritative**, it carries `migration.provisional: true` and a
`provisionalNote` saying what would clear it, and `pnpm --filter @o3/migration
verify` lists every one on each run.

**No document may still be provisional at launch** — that is #48's gate.

| Document                                  | Why                                                                                                                                                                                                            | Cleared by                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `page-seed-live`                          | The appearances band asserts a **date**, and the frame's is a placeholder duplicated four times                                                                                                                | Someone owning the page's cadence and supplying real appearances                              |
| `page-seed-ventures`                      | No canonical frame; the copy is WordPress's and its links point at a Pantheon staging host. Nothing in the site chrome links here                                                                              | A commissioned ventures frame, a nav decision, and an owner confirming the portfolio          |
| `page-seed-ventures-rec-philly`           | No canonical frame for a venture detail page, and the WordPress copy is from 2022 — it still describes the MVP as ahead                                                                                        | A commissioned frame and an owner confirming where the engagement stands                      |
| `page-seed-ventures-urvin`                | Same: no frame, and 2022 copy that predates the current AI story                                                                                                                                               | A commissioned frame and an owner confirming the engagement                                   |
| `page-seed-1682-conference-ai-innovation` | No canonical frame; the copy is faithful to WordPress and WordPress is out of date — the hero CTA advertises a date that has passed                                                                            | A canonical frame, and an owner keeping the event list and CTA true                           |
| `page-seed-about`                         | The "What we optimize for" rail's third panel is the Services component's **unoverridden default**, and its 402 second panel is Home's engagement model — so `opt-quality` is O3-voice fill, not transcription | A frame that authors three panels for About, or an owner confirming the three the seed writes |

### Retired: the three invented case studies

`caseStudy-seed-aramark`, `caseStudy-seed-chop` and `caseStudy-seed-ironman`
were on this list until [ADR 0016](./adr/0016-publish-what-wordpress-publishes.md).
They are **deleted**, with `industry-seed-enterprise`, which existed only to
give the Aramark card an eyebrow. ADR 0007 carried them because the homepage
showcase is a canonical frame with three cards and no real case study could
fill them; all 20 now publish, so the showcase points at
`caseStudy-wp-10028` (IRONMAN), `caseStudy-wp-5804` (Vertex) and
`caseStudy-wp-5805` (Caron) — the three clients whose logos the frame's own
cards carry.

Their `client` documents stay. `client-seed-ironman` is what the real IRONMAN
translation references, and `client-seed-aramark` / `client-seed-chop` are two
of the six logos on the homepage logo wall — a real client list, asserting
nothing about an engagement.

### Provisional routes — the half `verify` cannot see

Reasoning: [ADR 0012](./adr/0012-provisional-routes.md).

A **collection index has no backing document** (CONTEXT.md), so `migration.provisional`
has nothing to sit on and `verify` — which reads the dataset and the committed
JSON — has nothing to list. The marker therefore lives on the **route entry**,
under the same two field names, with the same rule that the note is required:

| Route    | Entry | Why | Cleared by |
| -------- | ----- | --- | ---------- |
| _(none)_ | —     | —   | —          |

**`/insights` was the case that forced this mechanism, and #61 cleared it.**
The frame it asked for (`2336:4310`) landed on 2026-08-13, so the entry now
carries `figmaNode: '2336:4310'` instead of the marker: the hero standfirst it
used to invent is the frame's own copy, the desktop row gap is the frame's 64,
and the category filter #49 declined to invent is drawn as a chip bar. The
pager is the one element still unsourced — no frame paginates anything — and it
stays because 273 articles do not fit a canvas; that is recorded on
`InsightIndexView` rather than as a provisional route, since a page is not
provisional for keeping one control a frame had no reason to draw.

Enforcement is `apps/web/src/content/documents/provisionalRoutes.render.test.tsx`,
which applies `seed.test.ts`'s three rules to route entries. Both collection
indexes now carry a `figmaNode` and no `provisional`, and both are pinned by
name there, so a marker coming back is a deliberate act.

**#48's gate covers both halves.** No document and no route may still be
provisional at launch.

Live is provisional for a reason worth keeping after the case studies retired.
Its copy is a faithful transcription of a canonical frame, which is normally
enough (Solutions is not provisional; About is, for the reason above). What
makes it not-authoritative is that the frame fills its two lists by
**duplicating one authored row** — four identical appearances in `1710:1800`, three identical
ideas in `1732:1409` — and the one appearance it authors is dated. Transcribing
is a transcription job, so the seed carries the authored row once and nothing
invented; a page promising "what we're working on" with a workshop nobody
scheduled is exactly what #48's gate is for.

The homepage showcase had the same shape and a different ending: `1683:2661`
also repeats one authored card three times, so the frame decided which three
clients appear (their logos) and nothing about what the cards say. Real case
studies could fill it, and did. Live has no equivalent — nothing in WordPress
holds the appearances.

Contact and 1682 are a third kind, and the reason is worth naming because more
routes will land this way: **the content migrated cleanly and the composition
had nowhere to come from.** Neither route has a canonical frame, so the copy is
WordPress's — carried, restructured, never invented — while the section order is
assembled from blocks other frames authored. That is a design gap, not a content
gap, and it is why the two carry no `figmaNode`. 1682 also carries its own
second problem: its WordPress copy is stale, a CTA advertising a date that has
passed. Contact's form is settled: #58 built `formSection` and the page draws
Gravity Form 1's real field set — first name, last name, email, Reason,
message, newsletter opt-in, recovered from the live markup because the extract
only ever recorded `form_id: "1"` — and #412 gave it a destination. The submit
posts to the app's `/api/contact` route, which validates the submission and
forwards it to the HubSpot form the site's portal holds.

## The conflict rule, in one line

**Migration wins the facts. Figma wins the page.**

The Case Study frame contains a fully written case study as _demo copy_. It is
authoritative for how a case study is composed and never for what a client
achieved. Full reasoning: [ADR 0007](./adr/0007-content-sourcing-and-provenance.md).

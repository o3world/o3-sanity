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

| Route                            | Frame                     | Source                | Documents                                                                                                                                                                                                                                                                                                | Ticket   |
| -------------------------------- | ------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `/`                              | `1680:2134` / `1814:1618` | seed-from-frame       | `page-seed-index` — **reconciled against the frame** (#42): composition, section order and copy all now the frame's                                                                                                                                                                                      | #42 ✅   |
| `/work`                          | `1634:1167` / `1906:851`  | migrate               | **Dedicated route**, not a document — lists `caseStudy`; composition is code                                                                                                                                                                                                                             | #43 ✅   |
| `/work/{slug}`                   | `1710:2300` / `1906:928`  | migrate               | **All 20 translated** (#22) and loaded as drafts; publishing is a human act, so the collection renders in draft preview until editorial takes them over                                                                                                                                                  | #44, #22 |
| `/perspectives`                  | **none**                  | provisional ⚠️        | Composition has no frame; borrows the Work hero + Home blog card rather than inventing one. **No document to mark**, so the marker is on the route entry — see below                                                                                                                                     | #49      |
| `/perspectives/{slug}`           | `1710:2823` / `1906:1046` | migrate               | 272 perspectives, 14 persons, 11 categories — **loaded**                                                                                                                                                                                                                                                 | #45      |
| `/about`                         | `1924:5344`               | seed-from-frame       | `page-seed-about` — transcribed; the disciplines grid, team and Careers bands render through their own blocks (#56), and the frame's band imagery is committed under `seed/assets/`. Careers is a section, not a route                                                                                   | #46 ✅   |
| `/solutions`                     | `1925:6138` — **no 402**  | seed-from-frame       | `page-seed-solutions` — transcribed; the orbital diagram is `disciplineGridSection` `layout: orbital` (#56) and the engagement cards `railPanelsSection` `layout: cards` (#47). The 24 WordPress services consolidate **into this page** — [ADR 0013](./adr/0013-services-consolidate-into-solutions.md) | #47 ✅   |
| `/live`                          | `1644:1889` / `1906:334`  | seed-from-frame       | `page-seed-live` — net-new layer, transcribed; three bands ride one new `inFlightSection`. Route named in [ADR 0011](./adr/0011-live-route-name.md)                                                                                                                                                      | #50      |
| `/contact`                       | **none**                  | migrate → provisional | `page-seed-contact` — copy from the WordPress page (wpId 158) + the studio's email/phone/address. The form band now exists (`formSection`, #58) and carries Gravity Form 1's real field set, but **it cannot send** — no handler, no destination — so the mailto CTA is still the only working path      | #48, #58 |
| `/1682-conference-ai-innovation` | **none**                  | migrate → provisional | `page-seed-1682-conference-ai-innovation` — all copy carried from the WordPress page (wpId 9545), including a CTA advertising a date that has passed                                                                                                                                                     | #48      |
| `/accessibility-statement`       | none                      | migrate ✅            | `page` — converted and loaded                                                                                                                                                                                                                                                                            | #18      |
| `/privacy-policy`                | none                      | migrate ✅            | `page` — converted and loaded                                                                                                                                                                                                                                                                            | #18      |
| Ventures (`/ventures/*`)         | **none**                  | provisional           | Ordinary standard pages per CONTEXT.md — deliberately not a type                                                                                                                                                                                                                                         | —        |
| Site chrome                      | `1710:2271` (NavBar)      | migrate + frame       | `siteSettings` singleton; nav gains **Live**, and **Solutions** replaces "Services"                                                                                                                                                                                                                      | #41      |

✅ = loaded and done.

Two routes have a canonical desktop frame and **no 402 counterpart**: `/about`
(`1924:5344`) and `/solutions` (`1925:6138`). Neither gap is the file hiding a
frame — the Design Concept section holds one frame each, at 1440. The "About
Us" and "Solutions" **sections** elsewhere in the file (`1924:4768` is the
Solutions one) are generation-1 captures at 1920/390, not the breakpoint pair
#34 describes; building a mobile layout from them would ship the old site. So
every mobile composition on these two pages is a renderer decision under
ADR 0006, and the render tests say so where it matters.

## Provisional inventory

A provisional document exists so a route resolves. Its content is **not
authoritative**, it carries `migration.provisional: true` and a
`provisionalNote` saying what would clear it, and `pnpm --filter @o3/migration
verify` lists every one on each run.

**No document may still be provisional at launch** — that is #48's gate.

| Document                                  | Why                                                                                                                                 | Cleared by                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `caseStudy-seed-ironman`                  | The real case study is translated (`caseStudy-wp-10028`) but loads as a **draft**, and the homepage showcase reference is strong    | A reviewer publishing that draft, then repointing the showcase                                                                  |
| `caseStudy-seed-aramark`                  | **No WordPress case study exists.** Real client, invented engagement write-up.                                                      | A real case study, or replacing the card                                                                                        |
| `caseStudy-seed-chop`                     | **No WordPress case study exists.** Real client, invented engagement write-up.                                                      | A real case study, or replacing the card                                                                                        |
| `page-seed-live`                          | The appearances band asserts a **date**, and the frame's is a placeholder duplicated four times                                     | Someone owning the page's cadence and supplying real appearances                                                                |
| `page-seed-contact`                       | Two halves. The form **cannot send** — #58 built the fields, not the mechanism or the destination. And there is no canonical frame  | #58's remaining halves (a handler with a spam story, and somewhere for a submission to land), plus a commissioned contact frame |
| `page-seed-1682-conference-ai-innovation` | No canonical frame; the copy is faithful to WordPress and WordPress is out of date — the hero CTA advertises a date that has passed | A canonical frame, and an owner keeping the event list and CTA true                                                             |

The homepage showcase is a canonical frame with three cards, which is why these
are carried rather than deleted — see ADR 0007.

### Provisional routes — the half `verify` cannot see

Reasoning: [ADR 0012](./adr/0012-provisional-routes.md).

A **collection index has no backing document** (CONTEXT.md), so `migration.provisional`
has nothing to sit on and `verify` — which reads the dataset and the committed
JSON — has nothing to list. The marker therefore lives on the **route entry**,
under the same two field names, with the same rule that the note is required:

| Route           | Entry                                                            | Why                                                                                                                                                                                                               | Cleared by                                                                                             |
| --------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `/perspectives` | `apps/web/src/content/documents/perspective/collectionIndex.tsx` | No canonical frame draws the index (#49). Hero, card and bone band are borrowed from `1634:1181`, `1683:2467`, `1924:5388`; the hero standfirst, the stacked-row gap above 402, and the whole pager are unsourced | A commissioned index frame — which would also settle the category filter this build declines to invent |

Enforcement is `apps/web/src/content/documents/provisionalRoutes.render.test.tsx`,
which applies `seed.test.ts`'s three rules to route entries. `/work` sits in the
same list carrying `figmaNode: '1634:1167'` and no `provisional`, so the
difference between the two collection indexes is a value rather than an
absence.

**#48's gate covers both halves.** No document and no route may still be
provisional at launch.

Live is provisional for a different reason from the three case studies. Its copy
is a faithful transcription of a canonical frame, which is normally enough (About
and Solutions are not provisional). What makes it not-authoritative is that the
frame fills its two lists by **duplicating one authored row** — four identical
appearances in `1710:1800`, three identical ideas in `1732:1409` — and the one
appearance it authors is dated. Transcribing is a transcription job, so the seed
carries the authored row once and nothing invented; a page promising "what we're
working on" with a workshop nobody scheduled is exactly what #48's gate is for. All 20
extracted case studies are now translated (#22), so replacing the two invented
cards is a question of which drafts editorial publishes — the pipeline cannot
do the swap itself, because a published page cannot hold a strong reference to
a draft-only document.

Contact and 1682 are a third kind, and the reason is worth naming because more
routes will land this way: **the content migrated cleanly and the composition
had nowhere to come from.** Neither route has a canonical frame, so the copy is
WordPress's — carried, restructured, never invented — while the section order is
assembled from blocks other frames authored. That is a design gap, not a content
gap, and it is why the two carry no `figmaNode`. Each also carries its own
second problem: 1682's WordPress copy is stale (a CTA advertising a date that has
passed), and Contact's second problem is its form. That one has moved rather
than cleared: #58 built `formSection` and the page now draws Gravity Form 1's
real field set — first name, last name, email, Reason, message, newsletter
opt-in, recovered from the live markup because the extract only ever recorded
`form_id: "1"`. But **the submit is deliberately disabled**. No submission
mechanism and no destination have been decided ([ADR 0014](./adr/0014-form-fields-are-code-form-copy-is-content.md)),
so the form says on the page that it is not connected and the mailto CTA
remains the only path that reaches a person. A form that silently discards what
it collects would be a worse regression than the one it replaced.

## The conflict rule, in one line

**Migration wins the facts. Figma wins the page.**

The Case Study frame contains a fully written case study as _demo copy_. It is
authoritative for how a case study is composed and never for what a client
achieved. Full reasoning: [ADR 0007](./adr/0007-content-sourcing-and-provenance.md).

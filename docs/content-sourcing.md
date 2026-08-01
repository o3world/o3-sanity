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

| Route                      | Frame                     | Source          | Documents                                                                                                                             | Ticket   |
| -------------------------- | ------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `/`                        | `1680:2134` / `1814:1618` | seed-from-frame | `page-seed-index` — seeded from the prototype (#20); copy **not yet reconciled** against the Figma frame, which writes it differently | #42      |
| `/work`                    | `1634:1167` / `1906:851`  | migrate         | Lists `caseStudy`; the index itself is composition only                                                                               | #43      |
| `/work/{slug}`             | `1710:2300` / `1906:928`  | migrate         | 20 extracted; **1 translated** (`la-colombe`), 19 outstanding                                                                         | #44, #22 |
| `/perspectives`            | **none**                  | provisional     | Composition has no frame; the content it lists is fully migrated                                                                      | #49      |
| `/perspectives/{slug}`     | `1710:2823` / `1906:1046` | migrate         | 272 perspectives, 14 persons, 11 categories — **loaded**                                                                              | #45      |
| `/about`                   | `1924:5344`               | seed-from-frame | Frame's prose is complete; Careers is a **section of About**, not a route                                                             | #46      |
| `/solutions`               | `1925:6138`               | seed-from-frame | 24 WordPress service pages **consolidate** into this, not 1:1                                                                         | #47      |
| `/live` _(name TBD)_       | `1644:1889` / `1906:334`  | seed-from-frame | Net-new page layer; the URL is still undecided on #33                                                                                 | #50      |
| `/accessibility-statement` | none                      | migrate ✅      | `page` — converted and loaded                                                                                                         | #18      |
| `/privacy-policy`          | none                      | migrate ✅      | `page` — converted and loaded                                                                                                         | #18      |
| Ventures (`/ventures/*`)   | **none**                  | provisional     | Ordinary standard pages per CONTEXT.md — deliberately not a type                                                                      | —        |
| Site chrome                | `1710:2271` (NavBar)      | migrate + frame | `siteSettings` singleton; nav gains **Live**, and **Solutions** replaces "Services"                                                   | #41      |

✅ = loaded and done.

## Provisional inventory

A provisional document exists so a route resolves. Its content is **not
authoritative**, it carries `migration.provisional: true` and a
`provisionalNote` saying what would clear it, and `pnpm --filter @o3/migration
verify` lists every one on each run.

**No document may still be provisional at launch** — that is #48's gate.

| Document                 | Why                                                                            | Cleared by                               |
| ------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------- |
| `caseStudy-seed-ironman` | Real case study exists but is not translated yet                               | #22 translating it                       |
| `caseStudy-seed-aramark` | **No WordPress case study exists.** Real client, invented engagement write-up. | A real case study, or replacing the card |
| `caseStudy-seed-chop`    | **No WordPress case study exists.** Real client, invented engagement write-up. | A real case study, or replacing the card |

The homepage showcase is a canonical frame with three cards, which is why these
are carried rather than deleted — see ADR 0007. Which real case studies replace
the two invented ones is #22's call: 19 of the 20 extracted are still
untranslated.

## The conflict rule, in one line

**Migration wins the facts. Figma wins the page.**

The Case Study frame contains a fully written case study as _demo copy_. It is
authoritative for how a case study is composed and never for what a client
achieved. Full reasoning: [ADR 0007](./adr/0007-content-sourcing-and-provenance.md).

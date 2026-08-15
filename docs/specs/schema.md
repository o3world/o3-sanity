# Schema spec — o3-sanity v1

Resolves wayfinder ticket #6. Inputs: the content model (ticket #5, `CONTEXT.md`), the routing contract (ADR 0001), the WP inventory (#3), and the vtx-web port inventory (#2). This is the implementation target for the schema package created by the scaffold.

## Conventions (ported from vtx-web)

- `defineBlock` / `defineSectionBlock` factories with the two-tier registry (base tier inside section tier).
- GROQ queries colocated in the schema package; `sanity typegen` runs in the studio app — the generated types are the compile-time contract: entry registries and `BLOCK_REGISTRY` are `satisfies`-checked against them (ADR 0001).
- Schema-symmetric folders: schema name === folder name in `apps/web/src/content/{documents,blocks/{base,section}}`. Enforced by convention (optionally a small lint script later — never a test suite).
- Every routable type has a required `slug`; `page` slugs may be multi-segment and carry their URL prefix (`services/ux-audit`).

## Document types (8)

### Routable

- **`insight`** — title, `slug` (req), excerpt, `author` → person (optional — the ACF byline where WordPress had one; 239 of 272 have none, #32), `categories` → category[], publishedAt, featuredImage (figure), `body` (Portable Text — see set below), seo. Read time computed at render, not stored.
- **`caseStudy`** — title, `slug` (req), `client` → client (req), `industries` → industry[], `industryDetail` (string — eyebrow's second half), `narrativeHeadline` (text, req — the card sentence), `stats[]` (stat; first = headline stat), `heroMedia` (figure), `story[]`, `deliverables[]` (string — "What we shipped"), seo. **`story` is one interleaved array** of `chapter` objects and section blocks ([ADR 0018](../adr/0018-case-study-story-interleaves-chapters-and-bands.md)) — the members are derived from the block registry, exactly as `page.sections` is — and a chapter's number derives from its order _among the chapter members_, so a band between two chapters costs no numeral. It replaces the `chapters` + appended `extraSections` pair, which could not express the alternation the frame draws.
- **`page`** — title, `slug` (req, multi-segment), `pageType` (`standard | service`, closed enum, initial `standard`), `card` fieldset conditional on `pageType == 'service'` ({shortTitle, excerpt, icon/image}) — projected by `listingSection`, `sections[]` (section blocks), seo. ⚠️ No `service` page exists or is planned — see `listingSection` below and [ADR 0013](../adr/0013-services-consolidate-into-solutions.md).

### Supporting

- **`person`** — name, title, headshot.
- **`client`** — name, logo.
- **`category`** — title, slug.
- **`industry`** — title, slug. (Deliberately minimal.)
- **`siteSettings`** (singleton) — nav items (button[]), footer content, social links, default seo, display labels (e.g. Insights collection shown as "Insights").

## Shared objects

- **`seo`** — title, description, ogImage, noIndex. (Yoast fields map here in migration.)
- **`button`** — label, a destination, variant (`brand | inverse | ghost`). The destination is a union of four arms — nothing, `target` (internal reference), `href` (external URL), `anchor` (a named place on the current page) — read in that precedence, and the renderer picks its element from the answer: a destination draws a link, no destination draws a `<button>`.
- **`figure`** — image, alt (req), caption (optional).
- **`stat`** — value (string — supports "89% → 114%"), label.
- **`chapter`** — kicker, title, body (Portable Text), `details[]` ({label (req), body} — the frame's hairline term/description rows, `2274:4009`). A member of `caseStudy.story`, never a document.
- **`embed`** — URL (video/oEmbed).
- **`pullQuote`** — text, attribution (optional).

## Portable Text (insight bodies, chapter bodies)

Standard marks + closed inline-object set: **`figure`, `embed`, `pullQuote`**. A `codeBlock` is added only if extraction reports code in the 272 WP bodies — do not pre-add.

## Blocks

### Section tier — bespoke (from the `prototype/` design)

`heroSection`, `logoWallSection` (statement + client refs or manual logos; layout `grid | marquee`), `caseShowcaseSection` (caseStudy refs; projects narrativeHeadline + first stat), `railPanelsSection` (heading, intro, `layout` (`rail | cards`), `rail` (`label | number`), panels {railLabel, heading, logo, body, note, button, media, mark} — serves Home's "platforms" and "how we work" bands as `rail`, and the Solutions frame's engagement cards (`1925:6108`) as `cards`), `quoteSection` (inline quote + attribution — no testimonial type; `decoration` is `orbs | molecule | none`, where `molecule` is the 2026-08 case-study band `2250:1525`), `insightsCarouselSection` (curated refs or latest-N by category), `ctaSection`.

### Section tier — from the canonical Figma frames (#56)

Surfaced by #46/#47 and built against the About (`1924:5344`) and Solutions (`1925:6138`) frames.

- **`disciplineGridSection`** — `heading`, `layout` (`grid | orbital`), `disciplines[]` ({heading, body, mark}). A row's `mark` draws the orb or the frame's disc, on the `grid` layout only — the orbital diagram places its own nodes. One block, not two: About draws the four disciplines as a 2×2 grid (`1925:5915`) and Solutions places the same four on a dotted tetrahedron (`1928:6524`). Slot position on the orbital layout derives from array order — apex first, then the base ring — and that layout takes exactly four.
- **`personGridSection`** — eyebrow, heading, `people[]` → person. The band the 12 migrated `person` documents existed for (`1927:6435`). People are **referenced**, never inlined.
- **`roleListSection`** — eyebrow, heading, `roles[]` ({heading, eyebrow, button, mark}). The Careers band (`1925:6061`), which the frame settles as a **section of About rather than its own route**. Roles are **inline objects, not a document type**: a `role` document would buy only a URL to link to, and nothing on the frame links to one — promote it when an /apply route, a cross-reference or an ATS feed needs an id.
- **`inFlightSection`** — heading, subheading, `layout` (`cards | rows`), `entries[]` ({heading, eyebrow, media, date, button, mark}). The three middle bands of the Live frame (`1644:1889` — #50): the studio cards (`1751:1994`) and the appearances/ideas rows (`1710:1800`, `1732:1409`) are the same entry in two compositions, the call `disciplineGridSection.layout` already makes. An entry with a `date` draws the red date column; one without draws its `mark` — derived, not a third enum. Entries are **inline objects**: the cards are deliberately anonymous (no caseStudy refs — ADR 0007), and an `event` document is justified only when an appearance needs its own URL.

### Section tier — generic

- **`layoutSection`** — the one true two-tier block: 1–3 columns of base blocks.
- **`mediaSection`** — media, `variant` (`plain | capture`), `width` (`contained | full-bleed`, hidden on `capture`). `plain` is the figure moment the block shipped with; `capture` is the case-study frame's page-capture band (`1647:1720`, #97) — a full-bleed dark stage 700px tall that a tall screenshot is **cropped by**, not fitted into.
- **`screenGridSection`** — `screens[]` ({media (req), `tone` (`ink | brand | bone`), `span` (`standard | wide`)}). The case-study frame's tiled product screenshots on gradient plates (`2230:3315`, `2230:7559`, #97): a two-column grid of 32px-radius plates, each clipping the screenshot inside it, a `wide` tile taking both columns. Registered as a general section block rather than a case-study element — ADR 0018's showcase rule is that every band the case study needs is available to `page.sections` too. Plate height is **not** a field: it follows `span` (ADR 0006).
- **`listingSection`** — lists pages by `pageType` via their `card` fieldset. ⚠️ **Orphaned.** It was specced to power `/services`, and [ADR 0013](../adr/0013-services-consolidate-into-solutions.md) removed that route: the Solutions frame draws no listing, no `service` page exists, and nothing else lists by `pageType`. The block, `pageType: 'service'` and `page.card` now have no consumer — a schema conversation raised on #47, not something a page layer deletes on the way past.

- **`formSection`** — eyebrow, `heading` (req), `note`, `reasons[]` (req), `consentLabel`, `button`. The inquiry band on `/contact` (#58). Its submit is an ordinary `button` instance, so it offers everything any other button does; an empty destination is what keeps it a control. **Its input set is code, not schema** — the six fields are transcribed from the Gravity Form 1 the live site serves, and `reasons` is the only part an editor owns ([ADR 0014](../adr/0014-form-fields-are-code-form-copy-is-content.md)). ⚠️ **No submission handler and no destination exist**, so the renderer disables its submit and says so on the page; #58 stays open for both.

No FAQ/accordion/tabs until a designed page needs them.

### Base tier

`richText`, `figure`, `video`, `button`, `statGroup`, `mark`.

`mark` is the dotted circle an item draws beside its copy — `kind` (`orb | disc`), plus the orb's knobs: `state` (nine tuned animations from `thinking-orbs`, MIT, orbs.jakubantalik.com), `size` (64 | 20 — two tuned drawings rather than one scaled, and beside copy it sets texture, not diameter), `speed`, `paused`. **The orb is the default**, including when the field is absent; `disc` is the deliberate step back to the frame's halftone. Like `figure`, `embed` and `button` it is a **shared object that doubles as a base block** (titled "Orb" in a `layoutSection` column), and it is the `mark` field on `disciplineGridSection`, `railPanelsSection`, `roleListSection` and `inFlightSection`. One renderer draws it everywhere: `blocks/base/mark/Mark.tsx`.

All section blocks render inside `SectionShell` with `surface: white | bone | ink` (the design's three-surface system) — surface is a section-block field, not per-page.

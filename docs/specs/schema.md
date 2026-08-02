# Schema spec — o3-sanity v1

Resolves wayfinder ticket #6. Inputs: the content model (ticket #5, `CONTEXT.md`), the routing contract (ADR 0001), the WP inventory (#3), and the vtx-web port inventory (#2). This is the implementation target for the schema package created by the scaffold.

## Conventions (ported from vtx-web)

- `defineBlock` / `defineSectionBlock` factories with the two-tier registry (base tier inside section tier).
- GROQ queries colocated in the schema package; `sanity typegen` runs in the studio app — the generated types are the compile-time contract: entry registries and `BLOCK_REGISTRY` are `satisfies`-checked against them (ADR 0001).
- Schema-symmetric folders: schema name === folder name in `apps/web/src/content/{documents,blocks/{base,section}}`. Enforced by convention (optionally a small lint script later — never a test suite).
- Every routable type has a required `slug`; `page` slugs may be multi-segment and carry their URL prefix (`services/ux-audit`).

## Document types (8)

### Routable

- **`perspective`** — title, `slug` (req), excerpt, `author` → person (req), `categories` → category[], publishedAt, featuredImage (figure), `body` (Portable Text — see set below), seo. Read time computed at render, not stored.
- **`caseStudy`** — title, `slug` (req), `client` → client (req), `industries` → industry[], `industryDetail` (string — eyebrow's second half), `narrativeHeadline` (text, req — the card sentence), `stats[]` (stat; first = headline stat), `heroMedia` (figure), `chapters[]` ({kicker, title, body: Portable Text}; numbering derived from order), `deliverables[]` (string — "What we shipped"), `extraSections[]` (section blocks, optional), seo.
- **`page`** — title, `slug` (req, multi-segment), `pageType` (`standard | service`, closed enum, initial `standard`), `card` fieldset conditional on `pageType == 'service'` ({shortTitle, excerpt, icon/image}) — projected by `listingSection`, `sections[]` (section blocks), seo.

### Supporting

- **`person`** — name, title, headshot.
- **`client`** — name, logo.
- **`category`** — title, slug.
- **`industry`** — title, slug. (Deliberately minimal.)
- **`siteSettings`** (singleton) — nav items (cta[]), footer content, social links, default seo, display labels (e.g. Perspectives collection shown as "Insights").

## Shared objects

- **`seo`** — title, description, ogImage, noIndex. (Yoast fields map here in migration.)
- **`cta`** — label, target (internal reference **or** external URL), variant (`brand | inverse | ghost`).
- **`figure`** — image, alt (req), caption (optional).
- **`stat`** — value (string — supports "89% → 114%"), label.
- **`chapter`** — kicker, title, body (Portable Text).
- **`embed`** — URL (video/oEmbed).
- **`pullQuote`** — text, attribution (optional).

## Portable Text (perspective bodies, chapter bodies)

Standard marks + closed inline-object set: **`figure`, `embed`, `pullQuote`**. A `codeBlock` is added only if extraction reports code in the 272 WP bodies — do not pre-add.

## Blocks

### Section tier — bespoke (from the `prototype/` design)

`heroSection`, `logoWallSection` (statement + client refs or manual logos; layout `grid | marquee`), `caseShowcaseSection` (caseStudy refs; projects narrativeHeadline + first stat), `railPanelsSection` (items {media, heading, body, note, cta} — serves both "platforms" and "how we work"), `quoteSection` (inline quote + attribution — no testimonial type), `perspectivesCarouselSection` (curated refs or latest-N by category), `ctaSection`.

### Section tier — from the canonical Figma frames (#56)

Surfaced by #46/#47 and built against the About (`1924:5344`) and Solutions (`1925:6138`) frames.

- **`disciplineGridSection`** — `heading`, `layout` (`grid | orbital`), `disciplines[]` ({heading, body}). One block, not two: About draws the four disciplines as a 2×2 grid (`1925:5915`) and Solutions places the same four on a dotted tetrahedron (`1928:6524`). Slot position on the orbital layout derives from array order — apex first, then the base ring — and that layout takes exactly four.
- **`personGridSection`** — eyebrow, heading, `people[]` → person. The band the 14 migrated `person` documents existed for (`1927:6435`). People are **referenced**, never inlined.
- **`roleListSection`** — eyebrow, heading, `roles[]` ({heading, eyebrow, cta}). The Careers band (`1925:6061`), which the frame settles as a **section of About rather than its own route**. Roles are **inline objects, not a document type**: a `role` document would buy only a URL to link to, and nothing on the frame links to one — promote it when an /apply route, a cross-reference or an ATS feed needs an id.
- **`inFlightSection`** — heading, subheading, `layout` (`cards | rows`), `entries[]` ({heading, eyebrow, media, date, cta}). The three middle bands of the Live frame (`1644:1889` — #50): the studio cards (`1751:1994`) and the appearances/ideas rows (`1710:1800`, `1732:1409`) are the same entry in two compositions, the call `disciplineGridSection.layout` already makes. An entry with a `date` draws the red date column; one without draws the halftone disc — derived, not a third enum. Entries are **inline objects**: the cards are deliberately anonymous (no caseStudy refs — ADR 0007), and an `event` document is justified only when an appearance needs its own URL.

### Section tier — generic

- **`layoutSection`** — the one true two-tier block: 1–3 columns of base blocks.
- **`mediaSection`** — full-width figure/video moment.
- **`listingSection`** — lists pages by `pageType` via their `card` fieldset (powers `/services`; reusable for future pageTypes).

No FAQ/accordion/tabs until a designed page needs them. No `formBlock` — forms strategy is map fog (what replaces Gravity Forms, where submissions go).

### Base tier

`richText`, `figure`, `video`, `cta`, `statGroup`.

All section blocks render inside `SectionShell` with `surface: white | bone | ink` (the design's three-surface system) — surface is a section-block field, not per-page.

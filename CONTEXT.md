# CONTEXT.md — o3-sanity ubiquitous language

Terms resolved so far. Use these exact words in schema names, code, issues, and copy discussions. (Decision detail lives in the wayfinder tickets and `docs/adr/`.)

## Content types

- **Perspective** — a blog article. The canonical term (not "post", not "insight" — the mockup's "Insights" nav label is display copy stored in Site Settings). URL: `/perspectives/{slug}`. Body is **Portable Text** with a small closed set of inline objects — never section blocks. 272 migrate from WordPress.
- **Case Study** — a client engagement write-up; the collection is called **Work**. URL: `/work/{slug}`. Fully **structured** (not section-built): client reference, industry references + industry detail string, **narrative headline** (the problem-framing sentence shown on cards), **stats** (array; first is the headline stat), hero media, **chapters** (ordered; kicker + title + body; numbers derived from order), **deliverables** ("What we shipped"), optional **extra sections** for per-case flourishes.
- **Page** — a modular marketing page composed of a two-tier **sections** array (see ADR 0001). Carries `pageType`, a closed developer-managed enum: `standard | service`. Service pages get a conditional **card** fieldset (short title, excerpt, icon) that listing blocks project. Slugs are multi-segment and carry their prefix (`services/ux-audit`, `ventures/rec-philly`). Ventures are ordinary standard pages — deliberately not a type.

## Supporting types

- **Person** — name, title, headshot. Authors of perspectives; 8 migrate from WordPress.
- **Client** — name + logo. Single source for the homepage logo wall and `caseStudy.client`.
- **Category** — editorial taxonomy for perspectives (11 migrate; cleanup is post-migration editorial work). WordPress tags do **not** migrate.
- **Industry** — minimal taxonomy (name + slug) referenced by case studies for the "Healthcare · Pediatric Systems" eyebrow; the second half is the case study's `industryDetail` string. Deliberately not invested in beyond that.
- **Site Settings** — singleton: nav, footer, social, default SEO, display labels.

Testimonials/quotes are **inline** in the quote section block — no document type until a quote is actually reused.

## Migration language

- **Extract → Translate → Review** — the pipeline stage that turns WordPress content into new-model documents. **Type-generic** by design (parameterized by source query, target schema, translation rules). Guarantees: output is always **unpublished drafts**; each draft carries its extracted source for side-by-side review; translation only restructures what the source contains — missing facts **stay empty**, proposed creative copy is flagged for rewrite-or-approve; re-runs are deterministic and never touch editor-modified drafts.
- **Migrate fully**: perspectives, authors, categories, ~3–5 utility pages, referenced media only. **Translate + review**: the 20 case studies. **Greenfield**: homepage, about, solutions, campaigns, the consolidated services story, ventures.

## Design language

- The `prototype/` `.dc.html` files are the **design source of truth**: three-surface system (white / bone / ink), brand red used sparingly, Figtree light display type, orbital motion vocabulary.

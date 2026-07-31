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

## Naming

One word per concept, everywhere. These rules bind schema names, field names, GROQ projections, and component/file names alike — the codebase is the thing agents imitate, so drift here costs more than it looks like it should.

### Type names

| Kind          | Rule                                 | Examples                                         |
| ------------- | ------------------------------------ | ------------------------------------------------ |
| Document      | camelCase singular noun              | `perspective`, `caseStudy`, `siteSettings`       |
| Section block | camelCase, **always** ends `Section` | `heroSection`, `layoutSection`, `listingSection` |
| Base block    | camelCase, **no** suffix             | `richText`, `statGroup`                          |
| Shared object | camelCase, no suffix                 | `cta`, `figure`, `stat`, `chapter`, `seo`        |

The `Section` suffix is the tier marker: if a name ends in `Section` it is a full-width page section rendered inside `SectionShell` and belongs in `SECTION_BLOCKS`; anything else that renders is a base block or a shared object, and lives inside a `layoutSection` column. A block name must never end in `Block` — the suffix carries no information (every block is a block) and the tier is what an agent actually needs to know. `figure`, `embed`, and `cta` are shared objects that double as base blocks; that dual use is why the base tier takes no suffix.

Both factories enforce this: `defineSectionBlock` rejects a name that doesn't end `Section`, `defineBaseBlock` rejects one that does, and both reject names missing from `registry.ts`.

### Field lexicon

Closed vocabulary. If the field you want isn't here and isn't obviously domain-specific (`industryDetail`, `narrativeHeadline`, `railLabel`), you're probably reaching for a synonym of something that is.

| Field        | Meaning                                                   | Don't use for it                                     |
| ------------ | --------------------------------------------------------- | ---------------------------------------------------- |
| `title`      | A document's own name; the `slug` source                  | Never on a block — blocks use `heading`              |
| `slug`       | URL segment(s); required on every routable type           | —                                                    |
| `eyebrow`    | Small label above a heading                               | `kicker` (reserved: `chapter.kicker`), `label`       |
| `heading`    | A block's primary display text                            | `title`, `headline`                                  |
| `subheading` | The secondary line under a `heading`                      | `subtitle`, `deck`                                   |
| `body`       | Long-form prose (`text` or `bodyText`)                    | `content`, `description`, `copy`                     |
| `excerpt`    | Short summary shown on cards and listings                 | `summary`, `intro`, `teaser`                         |
| `label`      | Short UI string on a leaf object                          | `name`, `text`                                       |
| `note`       | Quieter secondary line (the "Best when…" line)            | `caption` (reserved: `figure.caption`)               |
| `media`      | A `figure` on a block                                     | `image` — that's the raw asset field inside `figure` |
| `heroMedia`  | A document's lead `figure`                                | `featuredImage`, `banner`                            |
| `cta`        | A single call to action (type `cta`)                      | `link`, `button`, `action`                           |
| `name`       | A person's or organization's real-world name              | Anything that isn't a proper noun                    |
| `surface`    | `white \| bone \| ink` — injected by `defineSectionBlock` | Never hand-author it                                 |

Shape conventions: reference fields are singular for one (`client`, `author`), plural for arrays (`categories`, `caseStudies`); arrays of objects take a plural noun (`stats`, `chapters`, `panels`); closed enums are a bare noun with an `options.list` (`variant`, `layout`, `width`, `pageType`, `decoration`) and always carry an `initialValue`.

### Component and file names

Two conventions, split by whether the file is bound to a schema type:

- **Schema-symmetric** — `apps/web/src/content/blocks/{base,section}/<schemaName>/<PascalName>.tsx`. Folder name === schema name, exactly; component name === PascalCase of it. A renderer that doesn't match its schema name is a lint error (`tools/check-schema-symmetry`).
- **Generic presentational** — `packages/ui/src/components/<kebab-name>.tsx`, exporting a PascalCase component. These are design-system parts with no schema binding (`SectionShell`, `Eyebrow`, `ArrowLink`), so they take no schema name and use kebab-case files.

### Known drift

Fix on sight; don't imitate. As of 2026-07-31 the rules above are the target, and these three are the gap:

- Enforcement is not wired yet: the factories don't check name shape, and `tools/check-schema-symmetry` doesn't exist. Until both land, the suffix and folder rules are convention only — follow them anyway.
- `perspective.featuredImage` should be `heroMedia` (`caseStudy` already uses it). Requires touching the five converted JSON docs in `tools/migration/data/converted/perspective/` and the translate step.
- `heroSection.headlineLines` is an array because each line animates separately — a genuine exception to `heading`, not a synonym.
- The `decoration` enum is copy-pasted into three section blocks; it belongs in a shared field factory.

## Migration language

- **Extract → Translate → Review** — the pipeline stage that turns WordPress content into new-model documents. **Type-generic** by design (parameterized by source query, target schema, translation rules). Extraction and draft-loading are deterministic plumbing; **translation is performed by Claude Code** under the stage's guarantees. Guarantees: translated docs load as **unpublished drafts**; each draft carries its extracted source for side-by-side review; translation only restructures what the source contains — missing facts **stay empty**, proposed creative copy is flagged for rewrite-or-approve; re-runs are deterministic and **never touch a locked document**.
- **Migrate fully**: perspectives, authors, categories, ~3–5 utility pages, referenced media only. **Translate + review**: the 20 case studies. **Greenfield**: homepage, about, solutions, campaigns, the consolidated services story, ventures.
- **Seed** — a committed JSON document for greenfield content (`data/seed/<type>/<slug>.json`), authored by hand or agent, loaded by the same pipeline — so no content is ever entered manually twice. First seed: the homepage wireframe.
- **Migration lock** — `migrationLock` boolean in the hidden `migration` provenance object on every pipeline-owned document. The pipeline never touches a locked doc, in any mode; locking is an explicit act (Studio toggle), replacing edited-draft inference. Reviewers lock docs they take over.
- **Rebuild** — while building out, **committed JSON is the source of truth and the dataset is disposable**: `rebuild` deletes and recreates every unlocked pipeline-owned document from `data/`. Extract-derived and seed docs load **published**; translated case studies stay drafts-only. Deterministic IDs: `<type>-wp-<id>` (migrated), `<type>-seed-<slug>` (greenfield). Pipeline lives in `tools/migration` (temporary, deleted post-migration).

## Design language

- The `prototype/` `.dc.html` files are the **design source of truth**: three-surface system (white / bone / ink), brand red used sparingly, Figtree light display type, orbital motion vocabulary.

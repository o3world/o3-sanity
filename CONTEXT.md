# CONTEXT.md — o3-sanity ubiquitous language

Terms resolved so far. Use these exact words in schema names, code, issues, and copy discussions. (Decision detail lives in the wayfinder tickets and `docs/adr/`.)

## Content types

- **Insight** — a blog article. The canonical term (not "post", not "perspective" — that was the name until [ADR 0017](docs/adr/0017-the-collection-is-an-insight.md), and it survives only in `data/extract/`, which keeps WordPress's vocabulary). URL: `/insights/{slug}`; WordPress serves `/perspectives/{slug}` and 301s. Body is **Portable Text** with a small closed set of inline objects — never section blocks. 272 migrate from WordPress.
- **Case Study** — a client engagement write-up; the collection is called **Work**. URL: `/work/{slug}`. **Structured around a compositional middle** ([ADR 0018](docs/adr/0018-case-study-story-interleaves-chapters-and-bands.md)): client reference, industry references + industry detail string, **narrative headline** (the problem-framing sentence shown on cards), **stats** (array; first is the headline stat), hero media and **deliverables** ("What we shipped") are fixed fields — and between them sits the **story**, one array interleaving **chapters** (kicker + title + body + optional **details** rows; numbers derived from a chapter's order _among the chapters_) with whatever section blocks the case weaves between them.
- **Page** — a modular marketing page composed of a two-tier **sections** array (see ADR 0001). Carries `pageType`, a closed developer-managed enum: `standard | service`. Service pages get a conditional **card** fieldset (short title, excerpt, icon) that listing blocks project — but **no service page exists or is planned** (ADR 0013; see Known drift). Slugs are multi-segment and carry their prefix (`ventures/rec-philly`). Ventures are ordinary standard pages — deliberately not a type.

## Supporting types

- **Person** — name, title, headshot. Authors of insights; **12** migrate from WordPress — one per person something actually references, which is 11 bylines plus Kelly Navari, who is on the About team grid without having written anything. A **byline** is the ACF `author` field and nothing else: `post_author` is whoever hit publish, which o3world.com shows a reader nowhere, so 239 of the 272 articles have no author at all (#32). `insight.author` is optional for that reason.
- **Client** — name + logo. Single source for the homepage logo wall and `caseStudy.client`.
- **Category** — editorial taxonomy for insights (11 migrate; cleanup is post-migration editorial work). WordPress tags do **not** migrate.
- **Industry** — minimal taxonomy (name + slug) referenced by case studies for the "Healthcare · Pediatric Systems" eyebrow; the second half is the case study's `industryDetail` string. Deliberately not invested in beyond that.
- **Site Settings** — singleton: nav, **utility nav**, footer, social, default SEO, display labels.
- **Utility nav** — the brand-property strip above the nav pill: O3 World · 1682 Conference · O3XO. It names the properties O3 runs, not the pages this site has, which is why it is its own field (`siteSettings.utilityNavItems`) and its own component rather than a sixth nav item. Desktop only, and in flow — it scrolls away where the nav pill stays pinned.
- **Guidance** — a document that tells an _agent_ how to write, not a reader what to read — the voice guide, the brand foundation behind it, and the slop patterns its revision pass delegates to, stored so an MCP consumer (the Claude Desktop authoring skill, #68) can fetch them at session start. **The repo is source of truth** — each one is synced from markdown under `.claude/skills/` by `pnpm guidance:sync`, every field is `readOnly` in Studio, and `pnpm guidance:check` fails on drift. Deliberately outside the editorial model: not routable, no `slug`, no `seo`, no `migration` object, and ids (`guidance-o3-voice`) that miss the pipeline's ownership contract so `load` never retires them. Body is **raw markdown in a text field**, not Portable Text — agents consume it verbatim.

Testimonials/quotes are **inline** in the quote section block — no document type until a quote is actually reused.

## Routing

Not everything with a URL is a document. Four **route kinds** exist; the glossary term is the kind, not the file it lives in.

- **Detail** — one document at its own URL beneath a prefix (`/insights/{slug}`, `/work/{slug}`).
- **Catch-all** — a Page, resolved by matching its multi-segment slug (`solutions`, `ventures/rec-philly`).
- **Singleton** — a fixed route backed by one known document (the homepage).
- **Collection index** — the paginated landing page for a Collection (`/work`, `/insights`). **It has no backing document**: the entry is a query plus static SEO, so there is nothing in Studio to edit and nothing for the migration pipeline to own. This is the one route kind that breaks the document-per-URL assumption, which is why it gets a name.

A **Collection** is a document type with a URL prefix and a collection index. Two exist — Insight (`/insights`) and Case Study (`/work`, whose display name is **Work**). `COLLECTION_PREFIXES` is the single source of the prefix.

**"Listing" is the section block; "index" is the route.** `listingSection` projects page cards by `pageType` from inside a Page. A collection index is an entire route with pagination and no document. They share nothing but a word, so they no longer share one: the route kind is `index` (`caseStudyIndex`, `insightIndex`, `CaseStudyIndexView`).

## Preview

- **Draft mode** — Next.js's own switch (`draftMode()`), and the only thing that decides whether a page shows drafts. `defineLive` keys off it entirely, so nothing else in the app needs a notion of "published vs draft".
- **Editor toolbar** — the fixed corner chip an editor sees on the site (#60, #99). It carries the preview switcher and an **Edit this page** link into Presentation, opened on the page under it. The feature name is the toolbar; the app supplies four values (`src/sanity/editorToolbar.ts`) and everything else lives in `@o3/editor-chrome` ([ADR 0019](docs/adr/0019-editor-chrome-is-a-package.md)).
- **Preview switcher** — the Published ⇄ Drafts control **inside** the toolbar, for someone holding a Sanity Studio session. **Never call it a perspective switcher.** `perspective` now means exactly one thing here — Sanity's own published-vs-draft API parameter — and that is worth keeping. It used to mean this repo's blog type as well, which is part of why [ADR 0017](docs/adr/0017-the-collection-is-an-insight.md) renamed the type to `insight`. The control is the `preview switcher`; the state is `draft`.
- **Studio session** — there is no site auth. "Logged in" means holding a Sanity Studio token for this project, which the same-origin Studio at `/studio` leaves in `localStorage`. That token is a **hint** the browser may act on and a **claim** the server must verify against Sanity before enabling draft mode (`@o3/editor-chrome/draft-mode`); it is never a decision on its own.
- **Presentation is where `/studio` opens.** `sanity@6.8` has no `defaultTool` option — the first entry of the resolved `tools` array is the default — so `sanity.config.ts` sorts it there, and structure keeps a door back: every routable document carries an **Open in Presentation** action beside Publish (ADR 0019).
- **Canvas toolbar** — the hover bar on a block **inside the Presentation preview**, carrying that block's bar-visible knobs. Not the editor toolbar: that one is the corner chip on the site, this one is on the canvas. "Canvas" is Sanity's own word for the preview surface. Lives in `@o3/editor-chrome/canvas`, wired by exactly one prop — `<VisualEditing components={…}>` — so removing the feature is deleting that prop.
- **Knob menu** — the right-click surface on the canvas, carrying the subject's **complete** knob roster plus its item actions (duplicate, remove, move) and its insert menu. The bar carries a curated subset and the menu carries everything; that split is why both exist. Its subject is the innermost keyed array item under the cursor — the panel when you are in a panel, the block when you are in band padding.
- **Item action** — duplicate, remove, or move on that subject (#111). It is generic array plumbing over a GROQ path and a document snapshot: it takes no knob, no spec, and no block type, so a section in `page.sections` and a panel in `railPanelsSection.panels` are one problem. Two rules bind it. **`truncate` + `insert` against the parent array, never a whole-array `set`** — a `set` claims every item changed, so two editors reordering two different sections resolve as one clobbering the other and the history records a rewrite where a reorder happened; ours has to match the mutations Presentation's own menu emits. And **schema validation does not hide a row**: `railPanelsSection.panels` declares `min(2)`, but a control is dead when it cannot change the document, not when it produces a document the Studio will flag. Removing at the minimum is what the form already does, and refusing it here traps an editor at exactly the count where "remove and re-add" is the only way to fix a bad item.
- **Insert menu** — the "Add above / Add below" half of the knob menu (#112). What it offers is **the array's own declared members**, looked up by `<host type>.<field>` (`page.sections`, `railPanelsSection.panels`) — an address the overlay builds from the draft snapshot and the hovered path. `BLOCK_ARRAYS` in `schemas/blocks/registry.ts` is the one declaration, and the schema's `of:` is derived from it, so the menu and the form cannot disagree about what a page accepts. There is deliberately **no list of what may not be inserted**: the prior art's `NOT_INSERTABLE_TYPES` and array-name constants were mirrors of schema facts, and a mirror only ever drifts one way. `chapter` is not offered in `caseStudy.story` because it is a shared object rather than a block — a registry fact, not a denylist entry.
- **Placeholder** — what one newly inserted block starts with: a per-block artifact declared beside its knobs, typed `satisfies HeroSection` against the block's generated type. It is **commit-safe** — content that may be written to a real document and published without review — which binds two rules: **a document reference never** (`defineBlockKnobs` throws), and an **asset reference only against a seeded asset** (checked in `tools/migration` against `data/assets.json`, since only the pipeline knows what the dataset holds). A placeholder declares content and not design options: the knobs' own `initialValue`s are applied on insert, because Sanity writes those only when the _form_ creates an item and a canvas insert never goes near the form.
  - **Not the story fixture.** The `fixture` const in a block's `.stories.tsx` is the story-complete superset — real-looking copy, references and images — and it must never reach a document. The two are spelled apart on purpose: the failure mode is publishing demo copy as real content.
  - An inserted section **lives only in the dataset** until someone seeds it. `load` recreates every unlocked pipeline-owned document from `tools/migration/data/`, so the next run removes it. `verify` reports every placeholder nobody has written yet, under the same **provisional** heading it uses for documents, and an edited placeholder stops being reported — an edited placeholder is content.
- **The layout column is the one dark spot.** Nothing on the canvas attaches inside `layoutSection.items` — no toolbar, no menu, no item actions — and nothing reports it ([ADR 0022](docs/adr/0022-the-layout-column-stays-polymorphic.md)). It is the repo's only polymorphic array below a block root, the one shape `sanity@6.8.0` / `@sanity/visual-editing@5.7.3` cannot resolve, and the overlay's failure there is to hand our resolver an undefined context and never call it. We keep the array polymorphic rather than wrapping its members in a discriminator: the wrapper would outlive the bug. The two upstream bugs are written up in `docs/upstream/`, `nestedUnionArrays.test.ts` fails if a second such array appears, and the trigger to reopen the decision is a base block wanting a knob.
- **Canvas notice** — what an editor reads when the draft refuses a canvas edit (#124). It is a **sibling of `<VisualEditing />`**, not part of the toolbar, and it has to be: a custom overlay component renders only while its element is hovered, so a notice drawn from inside the toolbar disappears the moment the pointer moves to look at what happened. The toolbar writes to a module-level queue through `reportCanvasFailure`; `<CanvasNotices />` reads it. Notices **do not time out** — a notice that dismisses itself is one an editor can miss, and missing it is the bug ("the patch vanished"); repeats of one failure collapse into a count, and the corner holds three.

## Naming

One word per concept, everywhere. These rules bind schema names, field names, GROQ projections, component/file names, **and the props those components take** — the codebase is the thing agents imitate, so drift here costs more than it looks like it should.

### Type names

| Kind          | Rule                                 | Examples                                         |
| ------------- | ------------------------------------ | ------------------------------------------------ |
| Document      | camelCase singular noun              | `insight`, `caseStudy`, `siteSettings`           |
| Section block | camelCase, **always** ends `Section` | `heroSection`, `layoutSection`, `listingSection` |
| Base block    | camelCase, **no** suffix             | `richText`, `statGroup`                          |
| Shared object | camelCase, no suffix                 | `cta`, `figure`, `stat`, `chapter`, `seo`        |

The `Section` suffix is the tier marker: if a name ends in `Section` it is a full-width page section rendered inside `SectionShell` and belongs in `SECTION_BLOCKS`; anything else that renders is a base block or a shared object, and lives inside a `layoutSection` column. A block name must never end in `Block` — the suffix carries no information (every block is a block) and the tier is what an agent actually needs to know. `figure`, `embed`, and `cta` are shared objects that double as base blocks; that dual use is why the base tier takes no suffix.

The enforcement point is `registry.ts`, not the suffix: both factories reject a name missing from `SECTION_BLOCKS` / `BASE_BLOCKS`, and the web app's `BLOCK_REGISTRY` is compile-checked against the types generated from those lists. The suffix rule itself is upheld by whoever curates the registry — neither factory inspects name shape (see Known drift).

### Knobs

A **knob** is one design option on a block: a closed value set with a title, an icon, and a declared rule for when it applies. `heroSection.variant` is a knob; so are `decoration`, `surface`, and `railPanelsSection.layout`. One word covers both the declaration and the control an editor turns — there is deliberately no second word for the two halves.

A knob is **declared once** and everything else is derived from it: the Sanity field, the Storybook control, and the canvas toolbar's control all read the same object ([ADR 0020](docs/adr/0020-a-block-declares-its-knobs-once.md)). Declarations live in `packages/sanity/src/knobs/<blockName>.ts` — their own directory, because all sixteen section blocks share one `schemas/blocks/section.ts` and there is no "beside" — and that directory may not import `sanity` (lint-enforced; the whole point is that the preview bundle can read it).

The block's schema passes its declaration as `knobs:` and then **names each knob as a bare string where its field belongs** in `fields` — `fields: ['variant', eyebrowField, …, 'decoration']`. Field order is a fact about the form an editor reads, so it stays in one visible list; a knob nobody names is appended after the editorial fields, which is how `surface` keeps the last place it has always had. `knobs` is **required** — every section block paints a band, so every one declares at least `surfaceKnob()`, and a band with no other design option is a one-knob spec rather than a special case. The `defaultSurface` shorthand that carried unconverted blocks through the migration is gone ([#113](https://github.com/o3world/o3-sanity/issues/113)): a second way to declare the same thing is a second thing to keep in step.

This is the same concept the Figma rule names one step upstream, and the chain is worth holding in one piece:

> Figma variant **axis** → one `cva` variants key → one **knob** → one Sanity field

The Figma rule keeps Figma's word (`axis`) because that is what the design file calls it. Everything on this side of the seam is a knob.

A knob is delivered on two surfaces, and the split is deliberate. The **knob menu** (right-click) carries a subject's _complete_ roster. The **canvas toolbar** carries a curated subset — a knob rides it only when it declares `bar: true`.

What earns a bar slot: **`surface`, and the one axis that changes what the block is.** A block's composition — `heroSection.variant`, `railPanelsSection.layout`, `mediaSection.variant` — is the thing an editor is looking at, so it is the axis every bar shows. Everything else (`decoration`, `rail`, `width`) is menu-only: reachable, but not competing for the strip of chrome sitting over the design. There is no special-casing in code — `bar` is a plain declaration, and this rule is applied by whoever writes it.

Every knob belongs to a **knob surface** — the chrome that delivers it, decided by the container it configures, not by where it is declared:

| Surface | Configures                              | Example                           |
| ------- | --------------------------------------- | --------------------------------- |
| `band`  | the full-width strip the block occupies | `surface`                         |
| `block` | the block itself                        | `variant`, `layout`, `decoration` |
| `item`  | one member of the block's array         | a panel's own styling             |

**An array member is its own knob root** ([ADR 0021](docs/adr/0021-an-array-member-is-its-own-knob-root.md)). A screen's own styling is declared with `defineItemKnobs` against the screen — `tone`, not `screens[].tone` — and the block hangs that spec off the array it belongs to: `defineBlockKnobs({…, items: {screens: screenKnobs}})`. Its schema fields come from `defineArrayItem`, the same splice `defineSectionBlock` uses. Every reader and writer then works unchanged, because each one takes a path relative to the root it was handed: `visibleKnobs` resolves against one named screen, a gate on a sibling is an ordinary same-root gate, and `knobPatch` takes the member's path as its root. A member's spec is reached through its host block and never through its `_type` — member names are local to their array, so two blocks may each declare a `screen`.

Ownership is answered by a longest-matching-prefix table in `@o3/block-spec` and nowhere else, so no surface keeps its own roster of field names in step with the schema. **`item` is the exception, and it is not a prefix**: it is stamped on every knob `defineItemKnobs` takes, and `defineBlockKnobs` refuses a knob that claims it. `block` is the default — an unlisted knob configures the block, and nothing disappears into a menu nobody opened. There is no `header` surface: our blocks carry `eyebrow` / `heading` / `subheading` as plain fields rather than a `header` object, so there is no `header.*` cluster to deliver. The header element is still attributed, because that is what lets the canvas toolbar name what you are hovering.

A **nested block forms no band** — its host owns the strip — so band knobs drop when the block sits in another block's array. That is the surface table's job too, not a second flag per knob.

Three rules that are easy to get wrong:

- **Visibility is data, never a closure.** Write `showWhen: { at: 'variant', mode: 'oneOf', values: ['band'] }`, not `hidden: ({parent}) => …`. The declaration generates the form's predicate _and_ is read by the toolbar; a closure can only be read by the form, so a control gated with one silently disappears from the canvas with no error.
- **An enum is not a knob.** `options.list` declares a value domain and nothing else. `pageType` and `formSection.reasons` are closed enums and neither is a knob. The test is whether an editor changing it is making a **design** decision on the canvas.
- **A knob's option values are strings; its stored type is declared.** Write the options as strings whatever the field holds — `optionKey` coerces a stored number back to a string, so gates, controls and check-marks all compare one type. If the document field is not a string, say so with `valueType: 'number'` and the adapter generates that field type. Never inferred from the digits: `['1','2','3']` is `layoutSection.columns`, and it is also what a version or a zero-padded code would look like. Getting it wrong moves `generated.ts` and changes the renderer's props.

### Field lexicon

Closed vocabulary. If the field you want isn't here and isn't obviously domain-specific (`industryDetail`, `narrativeHeadline`, `railLabel`), you're probably reaching for a synonym of something that is.

| Field             | Meaning                                                          | Don't use for it                                     |
| ----------------- | ---------------------------------------------------------------- | ---------------------------------------------------- |
| `title`           | A document's own name; the `slug` source                         | Never on a block — blocks use `heading`              |
| `slug`            | URL segment(s); required on every routable type                  | —                                                    |
| `eyebrow`         | Small label above a heading                                      | `kicker` (reserved: `chapter.kicker`), `label`       |
| `heading`         | A block's primary display text                                   | `title`, `headline`                                  |
| `subheading`      | The secondary line under a `heading`                             | `subtitle`, `deck`                                   |
| `body`            | Long-form prose (`text` or `bodyText`)                           | `content`, `description`, `copy`                     |
| `excerpt`         | Short summary shown on cards and listings                        | `summary`, `intro`, `teaser`                         |
| `label`           | Short UI string on a leaf object                                 | `name`, `text`                                       |
| `note`            | Quieter secondary line (the "Best when…" line)                   | `caption` (reserved: `figure.caption`)               |
| `media`           | A `figure` on a block                                            | `image` — that's the raw asset field inside `figure` |
| `heroMedia`       | A document's lead `figure`                                       | `featuredImage`, `banner`                            |
| `cta`             | A single call to action (type `cta`)                             | `link`, `button`, `action`                           |
| `date`            | When a leaf object's thing happens (the Live MON / DD marker)    | `publishedAt` — that's a document's publication time |
| `name`            | A person's or organization's real-world name                     | Anything that isn't a proper noun                    |
| `surface`         | `white \| bone \| ink` — injected by `defineSectionBlock`        | Never hand-author it                                 |
| `reasons`         | The form's "Reason" options, in shown order (`formSection`)      | `options`, `choices`                                 |
| `consentLabel`    | The opt-in checkbox's words; empty = no checkbox (`formSection`) | `consent`, `optIn`                                   |
| `submitLabel`     | The submit button's words (`formSection`)                        | `buttonText`, `cta` — there's no link here           |
| `story`           | A structured document's interleaved narrative array              | `sections` (a page's flat composition), `chapters`   |
| `details`         | Term/description rows under a body (`chapter.details`)           | `specs`, `meta`, a second `body`                     |
| `utilityNavItems` | The brand-property strip's links (`siteSettings`)                | `properties`, `brandLinks`, a second `footerGroup`   |

The lexicon governs **editorial** fields — the ones an author fills in. Machine-written fields are outside it, and are `readOnly` in Studio: the hidden `migration` provenance object (`sourceId`, `extractedAt`, `locked`, `figmaNode`, `provisional`, `provisionalNote`) names pipeline state, and `guidance.key` / `guidance.sourcePath` name where a synced document came from and what queries it. Both are provenance, not content.

It also governs the **props** a presentational component exposes, even in `packages/ui` where nothing is schema-bound. A prop is where a field's value lands, so a renderer that writes `deck={subheading}` forces every reader to learn the same concept twice and quietly reintroduces the synonym the lexicon exists to kill. Design vocabulary belongs in the prop's _doc comment_ ("the 24px standfirst pinned right"), never in its name.

Shape conventions: reference fields are singular for one (`client`, `author`), plural for arrays (`categories`, `caseStudies`); arrays of objects take a plural noun (`stats`, `details`, `panels`); closed enums are a bare noun with an `options.list` (`variant`, `layout`, `width`, `pageType`, `decoration`) and always carry an `initialValue`. `story` is the one array named with a **collective singular**, and it earns it: it holds two unlike member types (chapters and section blocks), so no plural noun names its contents.

### Component and file names

Two conventions, split by whether the file is bound to a schema type:

- **Schema-symmetric** — `apps/web/src/content/blocks/{base,section}/<schemaName>/<PascalName>.tsx`. Folder name === schema name, exactly; component name === PascalCase of it. A renderer that doesn't match its schema name is a lint error (`tools/check-schema-symmetry`).
- **Generic presentational** — `packages/ui/src/components/<kebab-name>.tsx`, exporting a PascalCase component. These are design-system parts with no schema binding (`SectionShell`, `Eyebrow`, `ArrowLink`), so they take no schema name and use kebab-case files.

### Known drift

Fix on sight; don't imitate. As of 2026-08-01 the rules above are the target, and these are the gap:

- Enforcement is not wired yet: the factories don't check name shape, and `tools/check-schema-symmetry` doesn't exist. Until both land, the suffix and folder rules are convention only — follow them anyway.
- `insight.featuredImage` should be `heroMedia` (`caseStudy` already uses it). Requires touching the five converted JSON docs in `tools/migration/data/converted/insight/` and the translate step.
- `pageType: 'service'`, the conditional `card` fieldset it gates, and `listingSection` have **no consumer**. They were specced for a `/services` listing that [ADR 0013](docs/adr/0013-services-consolidate-into-solutions.md) removed — the 24 WordPress services consolidate into `/solutions`, which draws no listing. Removing all three is a schema conversation raised on #47, not a page layer's call; until it happens, `pageType` reads as a two-value enum with one value in use.
- `heroSection.headlineLines` is an array because each line animates separately — a genuine exception to `heading`, not a synonym.
- ~~The `decoration` enum is copy-pasted into three section blocks; it belongs in a shared field factory.~~ **Closed (#97), and moved (#120)** — it was `decorationField(options)` in `schemas/blocks/fields.ts`; now that all three blocks are converted it is `decorationKnob(options)` in `packages/sanity/src/knobs/decoration.ts`, beside `surfaceKnob`, and `fields.ts` is gone with its last caller. Each block still passes its own option list. Kept listed so the next shared design option lands there rather than starting the drift again — and so the next shared _editorial_ field re-creates `fields.ts`, which is still where one belongs.

## Migration language

- **Extract → Translate → Review** — the pipeline stage that turns WordPress content into new-model documents. **Type-generic** by design (parameterized by source query, target schema, translation rules). Extraction and loading are deterministic plumbing; **translation is performed by Claude Code** under the stage's guarantees. Guarantees: each translated doc carries its extracted source for side-by-side review; translation only restructures what the source contains — missing facts **stay empty**, proposed creative copy is flagged for rewrite-or-approve; re-runs are deterministic and **never touch a locked document**. Translated docs **load published**, like every other tree — [ADR 0016](docs/adr/0016-publish-what-wordpress-publishes.md) retired the drafts-only guarantee, because what the translate track holds is content WordPress publishes today.
- **Migrate fully**: insights, authors, categories, ~3–5 utility pages, referenced media only. **Translate + review**: the 20 case studies. **Greenfield**: homepage, about, solutions, campaigns, the consolidated services story, ventures.
- **Seed** — a committed JSON document for greenfield content (`data/seed/<type>/<slug>.json`), authored by hand or agent, loaded by the same pipeline — so no content is ever entered manually twice. First seed: the homepage wireframe.
- **Migration lock** — `migrationLock` boolean in the hidden `migration` provenance object on every pipeline-owned document. The pipeline never touches a locked doc, in any mode; locking is an explicit act (Studio toggle), replacing edited-draft inference. Reviewers lock docs they take over.
- **Rebuild** — while building out, **committed JSON is the source of truth and the dataset is disposable**: `load` recreates every unlocked pipeline-owned document from `data/` and deletes the pipeline-owned documents the corpus no longer contains. All three trees — converted, seed and translated — load **published** (ADR 0016). Deterministic IDs: `<type>-wp-<id>` (migrated), `<type>-seed-<slug>` (greenfield). Pipeline lives in `tools/migration` (temporary, deleted post-migration).
- **Provisional** — a document that exists so a route resolves, whose content is **not authoritative**: either the route has no canonical frame, or its real content has not been migrated yet. Marked `provisional: true` + `provisionalNote` in the `migration` object; `verify` lists every one each run, and **none may survive to launch** (#48). On a case study it is the stronger claim — the document invents client outcomes — and `seed.test.ts` fails any case study not sourced from WordPress that omits it. Sourcing order and the per-route table: [`docs/content-sourcing.md`](docs/content-sourcing.md).
  - A **collection index has no document to mark**, so the same two field names sit on the route entry instead (`IndexEntry.migration`, #49, [ADR 0012](docs/adr/0012-provisional-routes.md)) — `/insights` is the case that forced it. `verify` cannot see them (it reads the dataset and the committed JSON, and a composition is in neither), so the enforcement point is `provisionalRoutes.render.test.tsx`. The launch gate covers both halves.
- **Migration wins the facts, Figma wins the page** — the conflict rule (ADR 0007). Figma is authoritative for composition, visual language, and the copy it authors; WordPress is authoritative for anything asserting something happened — client stats, outcomes, published editorial. The Case Study frame's fully-written case study is _demo copy_, not a client's results.

## Design language

- **Figma is the design source of record** (map #33) — the "Design Concept" section of _O3DX: Visual exploration_, at **1440 / 402**. It outranks `prototype/`, which is retired (#48). Read [`docs/agents/figma.md`](docs/agents/figma.md) before opening the file.
- Five neutrals (white / bone / ink / ink-warm / ink-deep), brand red almost always arriving as a **gradient** rather than a flat fill, Figtree at weight **400**, square corners. Tokens and their node references: `packages/tailwind-config`.
- **Responsive is a renderer concern** — the frames are endpoints, not breakpoints (ADR 0006). No per-breakpoint schema field.
- **Motion is the one thing Figma cannot supply**, so `packages/ui` carries it: `OrbitalSphere` (the wireframe globe), `Reveal`, and `MaskedLines`. The orbital vocabulary has left `prototype/`.
- **Orbital / band** — the two compositions the sphere appears in, and the `heroSection.variant` enum that names them. `orbital` is the Home opener (full sphere band under a bone dome); `band` is the interior-page hero (a shallow ink-warm strip with an eyebrow), shared with every collection index as `CollectionHero`.
- **Captured prototype** — an answered visual proposal, committed to `apps/storybook/prototypes/` as a dated read-only snapshot (ADR 0010). **Not a source of record**: take intent and sequence from one, never values. Distinct from the retired root `prototype/`.

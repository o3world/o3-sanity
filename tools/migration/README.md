# @o3/migration

WordPress→Sanity pipeline. **Temporary** — deleted after the migration ships (ADR 0002, 0003).

```sh
pnpm --filter @o3/migration extract -- --posts all       # live WP → data/extract/ (terminus wp eval + ACF get_fields)
pnpm --filter @o3/migration extract -- --slugs a,b       # …or exactly these posts, by slug
pnpm --filter @o3/migration convert                      # data/extract/ → data/converted/ (deterministic, fail-loud)
pnpm --filter @o3/migration load                         # data/{converted,translated,seed}/ → Sanity (sanity exec --with-user-token)
```

Rules of the road:

- **Committed JSON is the source of truth; the dataset is disposable.** `load` creates-or-replaces every pipeline-owned document: `converted/` + `seed/` as published, `translated/` as drafts only.
- **A document with `migration.locked: true` is never touched, in any mode.** Editors lock documents they take over (Studio toggle).
- Deterministic IDs: `<type>-wp-<id>` (migrated), `<type>-seed-<slug>` (greenfield).
- Image nodes carry a `_wpSrc` URL marker until `load` uploads the binary and swaps in an asset ref; `data/assets.json` is the URL→asset audit map. Binaries cache in `data/media-cache/` (gitignored).
- Agent translation (case studies): input = `data/extract/` + `rules/<type>.md` + typegen types; output = `data/translated/` with `_meta` provenance; reviewed as a PR before loading.
- **A PHP snippet passed to `wpEval` may contain no single quotes and no `//` comments.** It is flattened to one line before it is sent, so a line comment silently comments out the rest of the program; `wpEval` rejects both up front. Explain the PHP in the TypeScript doc comment above it.

---

## Seeds: greenfield content, same pipeline (#20)

Greenfield pages are committed JSON under `data/seed/<type>/<slug>.json`,
loaded by the same `load` as everything else — so no content is ever entered
by hand twice. `data/seed/page/index.json` (the homepage) is the worked
example; #23 seeds the rest against this format.

The rules, all enforced by `src/seed.test.ts`:

- **`<type>-seed-<slug>` ids**, matching the folder. Deterministic ids are
  what make "wipe and rebuild reproduces the dataset" true.
- **`migration.sourceId` starts `seed:`**, and `locked` is `false`. A seed is
  re-derivable from git like any pipeline document, so it is never born locked.
- **Every reference resolves** to another committed document. A dangling
  reference loads without complaint and renders as a hole.
- **Only registered section blocks.** Composing existing blocks is the whole
  point; a page that needs a new block type is a schema conversation
  (`/grilling` + an ADR), not an inline improvisation.
- **`surface` is explicit on every section.** `defineSectionBlock` supplies it
  as a Studio `initialValue`, which the loader never runs — a seed that omits
  it renders every section on the default surface.
- **Images use `_localSrc`**, a repo-relative path (`prototype/assets/…`),
  resolved at load time exactly as `_wpSrc` is. Seed imagery comes from
  `prototype/` — the design source of truth — not from WordPress.

Two things the loader guarantees that seeds depend on:

- **One transaction per load.** Sanity validates a strong reference against
  the state _after_ the transaction, so seeds may reference each other in any
  order. Writing documents one at a time made directory order load-bearing.
- **Slug collisions are reported.** Routes resolve `…[0]`, so two documents
  claiming one slug serve a coin flip. `load` lists any collision in the
  dataset and exits non-zero.

---

## SEO: one discipline, inherited by every type (#26)

Every content ticket — #17, #18, #21, #22 — gets complete, correct SEO by
following the three rules below. None of them should need re-deciding.

### 1. Extract the whole Yoast set, through Yoast

Drop `yoastPhp('$p->ID')` (`src/lib/yoast.ts`) into the type's `wp eval`
snippet and store the result as `seo`. It reads Yoast's **presentation API**,
not raw postmeta, for the same reason extraction runs ACF's `get_fields()`
instead of reassembling flexible content by hand: template expansion, the
site-wide OG fallback, and robots defaults are Yoast's rules, and a second
copy in TypeScript would drift.

It returns each field twice, and the pair is the point:

| Field                  | What it is                                              | Migrates?                        |
| ---------------------- | ------------------------------------------------------- | -------------------------------- |
| `titleOverride`        | `_yoast_wpseo_title` — empty unless an editor set it    | decides whether `title` migrates |
| `titleRendered`        | the `<title>` WordPress serves                          | no — parity reference            |
| `descriptionOverride`  | `_yoast_wpseo_metadesc`                                 | yes                              |
| `descriptionRendered`  | what WordPress serves                                   | no — parity reference            |
| `canonicalOverride`    | `_yoast_wpseo_canonical` (unset across this whole site) | yes                              |
| `canonicalRendered`    | the canonical WordPress serves                          | **no** — see rule 3              |
| `noIndex` / `noFollow` | resolved robots                                         | yes, only when `true`            |
| `ogImage`              | per-document override only                              | yes, as a `_wpSrc` marker        |

The site-wide defaults land once in `data/extract/site/seo.json` (separator,
site name, default OG image, Twitter handle). `convert` needs them; Site
Settings' `defaultSeo` (#19) is populated from the same record.

### 2. Convert with `mapSeo`, never by hand

`mapSeo(src, site, docTitle, notes)` (`src/map/seo.ts`) is shared by every
mapper. **`seo` holds overrides, never resolved values.** Yoast hands back
fully resolved output — the title with the site name appended, the site OG
image standing in for every document that never picked one, `index,follow`
spelled out 272 times. Copying that in would bake today's defaults into 272
documents and make changing a default a 272-document edit. `apps/web/src/lib/seo.ts`
re-derives all of it at render time; `mapSeo` keeps only what a document
actually overrode.

Two normalizations it performs, both reported through `notes` rather than
done silently (a `notes` entry does **not** fail the document):

- The site-name suffix Yoast's title template appends is stripped, because the
  Next.js root layout appends the same suffix — keeping both ships `Foo | O3 | O3`.
- A title override that resolves to the document's own title, or whose
  template never resolved (`%%title%% %%sep%% %%sitename%% % %` — one real
  post has this), is dropped. The default composition already produces it.

### 3. Paths are preserved, and the converter enforces it

**A migrated document keeps the URL path WordPress serves it at today** —
the full path, character for character, minus WordPress's trailing slash.
The WordPress URL space (`/perspectives/…`, `/work/…`, `/services/…`,
`/ventures/…`) is exactly the space ADR 0001 routes, so nothing has to move.

Every mapper calls `checkPathParity(post.seo.canonicalRendered, newPath)`
(`src/map/paths.ts`) and pushes the result into its issue list, so a slug that
changes shape during conversion **stops the run** rather than costing a
ranking quietly. `converted.test.ts` re-checks the committed corpus, catching
a hand-edited slug too.

A deliberate path change is therefore a two-line act: add an entry to
`PATH_EXCEPTIONS` with its `reason`. That array is the input to the #24
redirect map — **if a path change is not recorded there, it does not happen.**
It is empty today.

### What the renderer does with it

`apps/web/src/lib/seo.ts` owns the resolution chain, once, for every routable
type: document `seo` → a field on the document → Site Settings `defaultSeo`.
Route entries declare only the document-shaped half (`DocumentSeo`: title,
description, image, path, `ogType`), never finished `Metadata` — which is what
stops the next content type from shipping with a title and nothing else.
Canonical is derived (a page is its own canonical) unless a document
explicitly points elsewhere.

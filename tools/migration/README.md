# @o3/migration

Live site → Sanity pipeline, one extract source per brand. **Temporary** —
deleted after the migration ships (ADR 0002, 0003).

```sh
pnpm --filter @o3/migration extract -- --posts all       # live WP → data/extract/ (terminus wp eval + ACF get_fields)
pnpm --filter @o3/migration extract -- --slugs a,b       # …or exactly these posts, by slug
pnpm --filter @o3/migration extract -- --redirects       # …or just the redirect map (both plugins)
pnpm --filter @o3/migration extract -- --ventures        # …or just the `ventures` CPT
pnpm --filter @o3/migration convert                      # data/extract/ → data/converted/ (deterministic, fail-loud)
pnpm --filter @o3/migration redirects                    # data/extract/site/redirects.json → apps/web/src/lib/redirects.generated.ts
pnpm --filter @o3/migration load                         # data/{converted,translated,seed}/ → Sanity (sanity exec --with-user-token)
pnpm --filter @o3/migration verify                       # is the dataset what data/ says it is?
```

## Two brands, one pipeline (#217)

**The brand is a parameter of every command**, and it picks three things at
once: the extract source, the corpus tree on disk, and the Sanity project.

```sh
pnpm --filter @o3/migration extract -- --brand o3xo --insights all
pnpm --filter @o3/migration extract -- --brand o3xo --case-studies all
pnpm --filter @o3/migration convert -- --brand o3xo
pnpm --filter @o3/migration load    -- --brand o3xo
pnpm --filter @o3/migration verify  -- --brand o3xo
```

| Brand  | Source                            | Corpus       | Project    |
| ------ | --------------------------------- | ------------ | ---------- |
| `o3`   | WordPress, via `terminus wp eval` | `data/`      | `naorcr6k` |
| `o3xo` | o3xo.ai, a Framer site, as HTML   | `data-o3xo/` | `tunpgire` |

No flag means `o3`, so every command above still means what it always meant.
`NEXT_PUBLIC_BRAND` is honoured as a fallback for entry points with no argv (the
Studio, the app CLIs), and the flag wins where both are set.

It is a flag rather than an exported variable because `load` deletes and
rewrites every unlocked pipeline-owned document in whichever dataset it lands
on. Resolving the brand through the environment alone made that target depend on
what a shell happened to have exported — and with two brands, the failure is not
a wrong flag but the wrong company's content. `load` and `verify` both print
`brand · corpus · target` before they touch anything.

Only the sources differ. The gate (`insightDoc`), the HTML→Portable Text
converter, the path-parity check, the id contract, the lock rule, `load` and
`verify` are shared, and `src/map/framer.ts` records what o3xo.ai does not give
(a date, a byline, a taxonomy) rather than inventing it.

**Which dataset?** Every command above resolves it through brand config
(`@o3/sanity/brand`), given the run's brand. o3 falls back to **`development`**,
so an unconfigured checkout cannot load into the live dataset; `pnpm dataset`
prints what each entry point is pointed at and `pnpm dataset production`
switches them together. O3XO has one dataset, `production`, and it holds nothing
but this pipeline's output. Check it before `load`: the loader deletes and
rewrites every pipeline-owned document it finds.

`verify` runs after every load (#17; #24 reuses it for parity checks). The
tests check the committed corpus; `verify` checks the thing the corpus was
supposed to produce, which fails differently — a document can be perfect on
disk and missing, half-loaded, or shadowed in the dataset. It reports per-type
counts, then: every committed document present, every reference resolving, no
image marker left unresolved, every document passing its zod gate, no `_type`
the schema does not define, no two documents claiming one slug, and nothing
routable in the dataset that is not committed under the brand's corpus.
Non-zero exit on any finding.

Rules of the road:

- **Committed JSON is the source of truth; the dataset is disposable.** `load` creates-or-replaces every pipeline-owned document — `converted/`, `seed/` and `translated/` alike — as **published** ([ADR 0016](../../docs/adr/0016-publish-what-wordpress-publishes.md)), and deletes any draft still shadowing one it writes.
- **A document with `migration.locked: true` is never touched, in any mode.** Editors lock documents they take over (Studio toggle).
- Deterministic IDs name the source: `<type>-wp-<id>` (WordPress), `<type>-framer-<key>` (o3xo.ai), `<type>-seed-<slug>` (greenfield).
- **An image marker names where the bytes come from** — `_wpSrc` a WordPress upload, `_srcUrl` a URL on any other source site, `_localSrc` a repo-relative file committed beside its seed. `load` holds the one table of which resolver each takes, and swaps in an asset ref at upload time; the brand's `assets.json` is the URL→asset audit map. Binaries cache in `media-cache/` (gitignored).
- Agent translation (case studies): input = `data/extract/` + `rules/<type>.md` + typegen types; output = `data/translated/` with `_meta` provenance; reviewed as a PR before loading.
- **A PHP snippet passed to `wpEval` may contain no single quotes and no `//` comments.** It is flattened to one line before it is sent, so a line comment silently comments out the rest of the program; `wpEval` rejects both up front. Explain the PHP in the TypeScript doc comment above it.

---

## The full archive: what the long tail turned out to be (#17)

All 272 insights convert with an **empty fail-loud report**. Getting there
meant two new mapper arms, five recorded drop decisions, and two corrections to
how authorship was being read — the second one (#32) deleted the byline from
239 of them, because the live site never showed one.

### ACF module types, in full

`flexible_post_content` uses exactly three layouts across the whole archive —
`text` (277 instances), `video` (7), `image` (3). All three have mappers; a
fourth would still fail the run.

- **`video`** stores its source two ways. `external` keeps the **iframe HTML**
  WordPress cached from oEmbed (not a URL), so the mapper pulls the `src` out
  of it; `file` keeps an uploaded mp4, which migrates as an ordinary asset.
  Both become an `embed`.
- **`image`** is an ACF image array → a `figure`, alt falling back to the
  attachment title.

### Recorded drop decisions

Five things do not migrate. None of them is silent — each is reported as a
**note** on every run (converted, but the source needed cleaning up):

1. **`[single_image title="…"]`** (5 uses, 3 posts). Stripped. The shortcode is
   **not registered** in WordPress, so visitors see the literal
   `[single_image …]` text on the live site today, and none of the image titles
   it names still exist in the media library. Removing it is a fix.
2. **Embedded forms** (3 posts — HubSpot ×2, Gravity Forms ×1). Stripped, with
   the provider named so an editor can re-add a CTA. This was already a silent
   loss: block-tools discards `<script>` and `<form>` without a word.
   **Still dropped after #58.** That ticket added `formSection`, but a section
   block cannot appear inside an insight body — a body is Portable Text with
   a closed inline-object set (`figure`, `embed`, `pullQuote`), never section
   blocks (CONTEXT.md). Admitting a form into a body is its own schema
   conversation, and the form it would admit still has no handler and no
   destination ([ADR 0014](../../docs/adr/0014-form-fields-are-code-form-copy-is-content.md)).
3. **Broken Yoast title templates** (1 post). See the SEO section below.
4. **Code blocks** — nothing to drop. Zero `<pre>`, `<code>`, `wp-block-code`
   or highlighter classes in 272 bodies, which settles the open question from
   the schema spec: **ADR 0005**, no `codeBlock`.
5. **A byline naming a deleted team post** (7 posts). The ACF `author` points
   at a `team` record WordPress no longer has, so there is no name to migrate
   and the live page shows none either. See "The byline is the ACF `author`,
   or nobody" below — that is the whole decision, and this is its one note.

Two false positives are worth knowing about, because both cost a debugging
round: the old shortcode regex matched editorial prose in square brackets
("…best entrepreneurial companies **[in the E360 Index]**"), and minified
Gravity Forms JavaScript (`gform.hooks[o][r]`) reads as a shortcode to any
bracket-matching pattern. Scripts are stripped before the scan now.

### The byline is the ACF `author`, or nobody (#32)

Posts carry an ACF `author` field pointing at a **`team` post**. Where one is
set and resolves, that is the byline. Where it isn't, **the article has no
author** — `post_author` is not a fallback, because it is not a byline.

The test was the live site, and it is unambiguous. A post with an ACF author
renders a headshot and a name on o3world.com. A post without one renders no
byline anywhere: `post_author` reaches `<meta name="author">`, `twitter:data1`
and the JSON-LD `author` node, all three derived by Yoast, none of them
something a reader sees — and Yoast stamps the same name into the meta of the
ACF-bylined posts too, so it does not even distinguish them. Using it as a
fallback put "Brian Crumley" on 223 articles as their visible author and
`jennifero3` on 6 more, which is a claim the source never made.

The arithmetic across the 272:

| Posts   | ACF `author`           | Result                              |
| ------- | ---------------------- | ----------------------------------- |
| **33**  | set, team post exists  | `author` reference — the byline     |
| **7**   | set, team post deleted | no `author`, **noted** on every run |
| **232** | not set                | no `author`, silently               |

The middle row is the only one worth a human: team ids `5102`, `5320`, `7533`
and `8031` are named by seven posts and exist nowhere in WordPress any more.
The live site renders nothing for them either, so the document is right without
an author — but someone deleted a record a byline still points at, which is
source cleanup, not a conversion failure.

`PersonDirectory` (`map/person.ts`) owns the rest:

- A WP _user_ and a _team_ post are the same person when they share an email or
  a name. **Email first** — three accounts never had a display name set, so
  their "name" is a login (`handler`, `kelly`) that joins to nothing. The join
  survives the fallback's removal because it is what gives an ACF-bylined
  person their `person-wp-<userId>` id and their curated name; what went with
  the fallback is `refForUser`, a lookup that only ever answered "who published
  this".
- The team record supplies name, role and headshot; the user record is an
  account. Merged people keep `person-wp-<userId>` so existing references hold;
  team-only people (former staff who still wrote things) get
  `person-wp-<teamPostId>`, and the directory refuses to build if those two id
  spaces ever overlap.
- Team posts are extracted with `post_status => any`. Six referenced members
  are unpublished, and a former employee is still the author of what they wrote.
- **Person documents are reference-driven.** Only people something points at
  are emitted — the team CPT lists everyone who ever worked here. That "some
  thing" includes the seed tree, not just insights: the About page's team
  grid names six people, one of whom (Kelly Navari, `person-wp-4`) has never
  been a byline. 12 person documents survive; `person-wp-16` (Brian Crumley)
  and `person-wp-20` (jennifero3) left with the fallback and were retired from
  the dataset by `load`.

---

## The 20 case studies: what the translate track dropped (#22)

All 20 `work` posts are translated under `rules/caseStudy.md` and committed to
`data/translated/caseStudy/`. The archive turned out to be uniform: every post
is two `text` rows ("Opportunity" and "Solution"), zero to four `title` rows
that become `stats`, one `image_carousel`, and — on 19 of 20 — a
`project_feed`. No fifth ACF layout appears anywhere in the set.

Per-document decisions live in that document's `_meta.flags`, which is the
review queue and travels onto the draft as `migration.source`. Four decisions
are **systematic** — they recur across the archive rather than belonging to one
case study — so they are recorded once, here:

1. **`headline`** (20 of 20). Every `work` post carries a hero tagline
   ("Roadmap for America's propane company", "Cloud hosting made easy"). It has
   no field in the new model: `title` is the document's name and
   `narrativeHeadline` is the problem-framing sentence the rules draw from the
   Opportunity prose. Dropped, and flagged per document so the words are
   recoverable from the diff. Giving it a field is a schema conversation, not
   something a content pass decides on the way past.
2. **`project_feed`** (19 of 20). The "Related projects" widget, which curated
   three sibling posts by id. The new site derives related work, so the
   curation does not migrate.
3. **`introduction`** on every flexible-content row. The rules already ignore
   it as old-template presentation, and across the archive it holds nothing but
   section eyebrows ("RESULTS", "Highlights", "NUMBERS"). **One exception:**
   `healthcare-innovation` uses `introduction.description` for real standfirst
   prose, which is used as the source for its `narrativeHeadline` and flagged
   there rather than dropped.
4. **Alt text falling back to the attachment title** (5 images across 3 posts).
   Five carousel images have no alt in WordPress. The insight mapper's
   fallback applies — the attachment title stands in — but the titles describe
   the file (`LegalDocBot (1)`), not the picture, so each carries a `proposed`
   flag. Of everything the batch translated, these five are the fields most in
   need of a rewrite — and since ADR 0016 they are live, so the rewrite is
   fix-forward rather than a gate.

Two things the batch could not do, and did not fake:

- **`client` on four anonymized engagements.** `ai-powered-personalization`,
  `delivering-generative-ai-solution-legal-documents`, `healthcare-innovation`
  and `rfp-automation-o3` never name their client — the source says "a
  prominent innovation studio", "a major medical institution", "a global
  technology firm". `caseStudy.client` is required, so the post title stands in
  as the client name and each carries a `proposed` flag. A reviewer names the
  client or retires the record.
- **Logos on the 15 new `client` documents.** `client.logo` is required in
  Studio, and nothing in the extract supplies one — the only client imagery in
  a `work` post is a carousel slide compositing the logo over a photograph.
  The documents load (the loader writes JSON straight to the dataset, so Studio
  validation never runs) and read as invalid in Studio until someone supplies
  the mark, which is the correct signal. Only the six clients on the homepage
  logo wall have logos today.

The three hand-authored case-study seeds (`aramark`, `chop`, `ironman`) are
**gone** — deleted with `industry-seed-enterprise`, which nothing else
referenced ([ADR 0016](../../docs/adr/0016-publish-what-wordpress-publishes.md)).
Two of them described engagements no WordPress case study exists for, and the
reason ADR 0007 gave for carrying them expired the moment all 20 published: the
homepage showcase now references `caseStudy-wp-10028` (IRONMAN),
`caseStudy-wp-5804` (Vertex) and `caseStudy-wp-5805` (Caron), the three clients
whose logos the frame's own cards carry. Their `client` documents stay — the
real IRONMAN translation references one, and two more are logos on the homepage
logo wall.

**All 20 load published**, so the flags above are live copy rather than draft
copy. The five fallback `alt` strings and the four anonymized client names are
now fix-forward work, still flagged on the document and still listed here.

### The `story` restructure (#97)

`chapters` and `extraSections` became one interleaved `story` array
([ADR 0018](../../docs/adr/0018-case-study-story-interleaves-chapters-and-bands.md)),
and all 20 were rewritten into it: opening chapter, the carousel's cover
slide, second chapter, the rest of the carousel. No prose was re-derived and
no `_key` moved, so the diff is structural — but the rules file changed, which
is what the new `rulesHash` on every document records.

Four cases carry more than the default weave, because their sources support
it: IRONMAN, Vertex, Caron and La Colombe name the disciplines they hired for,
so their opening chapter gains `details` rows drawn from what the Solution
says each discipline did. Vertex, Caron and La Colombe fold their two product
screenshots into a `screenGridSection`; IRONMAN's Pro Series page capture
becomes a `mediaSection` with `variant: "capture"` and its four remaining
slides one screen grid. **No case study has a `quoteSection`** — the archive's
`work` posts hold no pull quote — so `decoration: "molecule"` has no content
to land on here, and waits for a seeded page.

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
- **Images use `_localSrc`**, a repo-relative path
  (`tools/migration/data/seed/assets/…`), resolved at load time exactly as
  `_wpSrc` is. Seed imagery is design-sourced rather than migrated from
  WordPress, so it is **committed next to the seeds that reference it** — a
  marker pointing outside the repo (as these did at `prototype/assets/…`, which
  is gitignored) makes `rebuild` impossible from a fresh clone and fails
  `seed.test.ts` in CI while passing on the machine that authored it.

Two things the loader guarantees that seeds depend on:

- **One transaction per load.** Sanity validates a strong reference against
  the state _after_ the transaction, so seeds may reference each other in any
  order. Writing documents one at a time made directory order load-bearing.
- **Slug collisions are reported.** Routes resolve `…[0]`, so two documents
  claiming one slug serve a coin flip. `load` lists any collision in the
  dataset and exits non-zero.

---

## Redirects and sitemap parity (#24)

The generated redirect table lives in the **app**, not here — `tools/migration`
is deleted when the migration ships (ADR 0002/0003), and the running site
cannot depend on a package that will not exist. `redirects` reads the committed
export and rewrites `apps/web/src/lib/redirects.generated.ts`, which
`next.config.ts` serves and `app/sitemap.ts` reads so the two cannot disagree
about which URLs this site has.

Three things about the export that cost a debugging round each:

- **There are two redirect plugins, and neither knows about the other.**
  Redirection holds 290 rows in a table; Yoast Premium holds 55 more in two
  WordPress _options_. Exporting only Redirection — the plugin the ticket names
  — misses every `/services/*` chain, which is the half ADR 0013 is about.
- **Read `redirection_items.url`, never `match_url`.** The plugin strips the
  query string into `match_url`, so the row `/?resource_type=ebook` is stored
  with `match_url = "/"`. Reading that column turns one dead ebook link into a
  permanent redirect on the homepage.
- **A sitemap diff finds post types nothing else does.** `ventures-sitemap.xml`
  advertises two URLs that no extraction covered, because `ventures` is a CPT
  and the extractor pulls `post_type => page` — the same shape of miss ADR 0013
  records for `services`. That is what the diff is for, and it is why #23 gained
  two pages after it was written.

Findings, counts and every decision: [`docs/seo-parity.md`](../../docs/seo-parity.md).

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
documents and make changing a default a 272-document edit. `packages/content-runtime/src/seo.ts`
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
The WordPress URL space (`/insights/…`, `/work/…`, `/services/…`,
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

`packages/content-runtime/src/seo.ts` owns the resolution chain, once, for every routable
type: document `seo` → a field on the document → Site Settings `defaultSeo`.
Route entries declare only the document-shaped half (`DocumentSeo`: title,
description, image, path, `ogType`), never finished `Metadata` — which is what
stops the next content type from shipping with a title and nothing else.
Canonical is derived (a page is its own canonical) unless a document
explicitly points elsewhere.

---

## The O3XO source: what one insight proved, and what it cost (#217)

One article — `human-in-the-loop-ai-workflows` — goes extract → convert → load →
render on `apps/o3xo`. It was picked because it is **O3XO-native**: 22 of the 40
insights on o3xo.ai are o3world.com posts republished under the same slug, and a
tracer that borrowed one of those would have proved the easy half.

`src/lib/framer.ts` is the source adapter, `src/map/framer.ts` the mapper, and
between them they answer the questions the WordPress source never had to.

### Extraction is a parse, so the parse is the fail-loud surface

Framer exposes no CMS API to a site's own owner, so the only record of an
article is the page it serves. The parse hangs off `data-framer-name` — the
region names authored in the Framer file — and never off generated class names
(`framer-daqsm4`), which change on every publish. Three shapes it depends on,
each of which throws rather than returning a half-record:

- `[data-framer-name="Hero"]` holds exactly **three** rich-text lines: eyebrow,
  headline, deck. Framer emits one copy of each per breakpoint variant, so
  consecutive duplicates collapse before they are counted.
- The **first** rich-text container inside `[data-framer-name="Content"]` is the
  body. The others in that region are the share widget and the related-article
  cards.
- The body must hold at least one paragraph.

The body stays verbatim HTML in the extract snapshot, exactly as WordPress's
`text_editor` does, so `convert` remains the only place a mapping decision is
made — and it runs the same `convertHtml` both sources run.

### o3xo.ai publishes no date

Not on the article, not in the head, not in a feed, not as `lastmod` in the
sitemap. The only timestamps in the HTML are `data-framer-ssr-released-at` and
`data-framer-page-optimized-at`, which are the last time the **site** was built:
the same value on every article, and this week's date for a piece written in 2024.

So a migrated insight carries **no `publishedAt`**, is marked provisional saying
why, and `verify` counts it out loud every run. `insightDoc` enforces the field
for every other source, so a WordPress insight cannot lose its date through the
same hole. The consequences are real and visible: the card meta reads `4 MINS`
where o3's reads `4 MINS · 7/27/26`, and `order(publishedAt desc)` has nothing
to sort by.

**The 22 articles with an o3world.com twin have a real date in `data/extract/`,
under the same slug.** That is where the fix comes from, and it is a decision
about content rather than about the pipeline.

### Three more things the source does not carry

- **No byline.** No author is rendered anywhere on o3xo.ai, so none is migrated
  and no `person` document is created — the answer #32 reached for 232 of o3's
  own articles.
- **No taxonomy.** The eyebrow above the headline is the only label an article
  has, authored as free text on the CMS item. It becomes the one `category`
  reference, and the category documents are reference-driven like `person`.
- **A deck that is not the meta description.** They are different sentences and
  they mean different things: the deck is the `excerpt` a reader sees, the
  description is the search-result line. Collapsing them would put SEO copy on
  the page. The `<title>` is the headline plus ` | O3XO`, which is what the app's
  own title template already composes, so no `seo.title` is stored.

### Asset identity is the path, not the URL

Framer serves every size of one picture off one path with a different resize
query (`?scale-down-to=512&width=2160&height=2160`), so the query is a rendering
instruction rather than part of the asset. Markers store the bare path — the
same rule `normalizeUploadUrl` enforces for WordPress thumbnails, and the reason
`assets.json` does not end up with one entry per srcset row.

### What #218 inherits

- The extract takes `--slugs a,b` or `--insights N|all`, and the sitemap is the
  inventory (40 insight URLs, in the order the site publishes them — the only
  ordering evidence there is).
- **Two slugs carry a curly apostrophe.** The URL keeps it, because the site
  serves it and path parity requires it; the id key is reduced to what a Sanity
  `_id` may hold. `wpPath` decodes the pathname for the same reason.
- Bodies use `<p>`, `<h3>`, `<ul>/<li>`, `<strong>` and `<a>` — every one of
  which the `bodyText` schema already allows. The one insight converted needed
  no new mapper arm.
- Body links to the site's own pages are **absolute** (`https://www.o3xo.ai/contact/`)
  and are migrated as written. Relativising them is the launch-cutover audit's
  job, alongside the redirect audit.
- O3XO's site chrome is extractable from o3xo.ai and is not extracted yet: the
  ld+json `sameAs` carries the LinkedIn URL, the footer carries the legal name
  and the privacy link. Until it is, `siteSettings` stays the hand-seeded
  bootstrap #215 wrote, and `verify` applies `siteSettingsDoc` — which describes
  the **WordPress chrome extract** — only to WordPress-sourced settings.

---

## O3XO's case studies: six, and the index is half the source (#219)

```sh
pnpm --filter @o3/migration extract -- --brand o3xo --case-studies all
pnpm --filter @o3/migration convert -- --brand o3xo
```

They serve at `/case-studies/{slug}` on `apps/o3xo`, where o3 serves `/work` —
the first collection whose prefix differs per brand, and it is read off brand
config in the mapper as well as in the app.

### The collection index is not a listing

It is a second region of the same CMS item, and the fields on it appear nowhere
else. The **detail page** carries the headline, the standfirst, the Opportunity
and Solution bands, the results figures and the client quote. The **index card**
carries the client's name, a subject label, a card sentence and a card
photograph.

`caseStudy.client` is required and the detail page never prints the client, so
the extract reads the index once and hangs a card record off every case study.
A sitemap slug with no card stops the run — a case study whose client is unknown
is not one this pipeline will guess at.

### Six real ones, and three URLs that are not

The sitemap advertises eight case-study items. `redirect-input` 302s to
`redirect-output`, and `redirect-output` is a duplicate of Buffalo Construction
whose `<title>` still reads "…Copy Copy": a redirect rig somebody left in the
collection. They are excluded by name in `JUNK_CASE_STUDY_SLUGS`
(`lib/framer.ts`), because the pages are well-formed and would otherwise migrate
into two case studies nobody wrote. **#223's redirect audit needs the same two
names**, and that constant is where they are written down.

The index draws **seven** cards for **six** URLs: two published items are the
same healthcare engagement, byte for byte. Framer serves one page for the pair,
so the card list is deduplicated by slug and the duplicate is invisible to a
URL-driven extract.

### The bands are told apart by structure, never by copy

The RichTextContainer regions on these pages are named after the master
component's own default text — the box holding the title is called "AI solutions
making finance + insurance more accessible" on every case study. So a
`data-framer-name` is read for **structure** and never for meaning: the
narrative band is the `Section` with `Margin` children, the results band the one
with `Article` children, the quote band the one with neither. Every band asserts
its line count, so a band that gains a field stops the run instead of filing the
new copy under whatever field sits at that index.

The archive is uniform. Two chapters (Opportunity, Solution), one results figure
with three empty template slots beside it, and a client quote on five of the
six. Bodies are plain `<p>` — no links, no lists, no images anywhere in the set.

### What the model carries, and what it cannot

| Source                | Field                                                 |
| --------------------- | ----------------------------------------------------- |
| hero headline         | `title`                                               |
| hero deck             | `narrativeHeadline` — the problem-framing sentence    |
| index card's client   | `client` → a `client-framer-<key>` document           |
| Opportunity, Solution | two `chapter` members of `story`                      |
| results figure        | `stats`                                               |
| client quote          | a `quoteSection` in `story`, `decoration: "molecule"` |
| hero photograph       | `heroMedia`                                           |
| meta description      | `seo.description`                                     |

Four things do not migrate, and none of them is invented into a field that means
something else:

1. **The card's subject label** ("RFP automation") — no field.
2. **The card's own sentence** — the model has one narrative sentence and the
   hero deck is it. The two are different copy on this site.
3. **The card's photograph**, which differs from the hero's on three of the six
   — the model has one image.
4. **`client.logo`**, required in Studio. o3xo.ai shows no client mark anywhere,
   so all six client documents load invalid, which is the correct signal.

The first three are reported as a note on every convert run, and all four are
named in each document's `provisionalNote`, so `verify` counts them out loud.
The words stay recoverable, verbatim, in the committed extract. This is the
answer #22 reached for WordPress's `headline`: giving a field to a dropped source
field is a schema conversation, not something a migration decides on the way
past.

### Two things worth knowing before the next collection

- **The quote band draws its own quotation marks.** Every seeded `quoteSection`
  in this repo stores the words alone; o3xo.ai types the marks into the copy, in
  both curly and straight forms. The mapper strips a matching pair and reports
  it — the same doubling `mapSeo` strips a site-name suffix to prevent.
- **`isPipelineOwned` had never heard of `framer`.** It matched `-wp-` and
  `-seed-` only, so a Framer-sourced document was written by every load and
  retired by none — a renamed slug would have left the old document serving its
  old URL forever. Fixed here; it applies to #217's insight too.

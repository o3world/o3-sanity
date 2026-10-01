# @o3/migration

The committed content corpus for o3world.com, and the scripts that compare it
with the dataset or change the dataset now that editors own it (ADR 0002,
0003).

**The WordPress import is frozen.** `data/converted/` (insights, pages, people,
categories, site settings) and `data/translated/` (the 20 case studies) are
what the WordPress import committed. Nothing regenerates them; they are edited
by hand like `data/seed/`. `data/extract/` keeps only what the remaining tools
read: the case-study sources the translations hash against, the run manifest
`drift` stamps `extractedAt` from, and the live Yoast sitemap list
`redirects.test.ts` checks the app's redirect table against.

**There is no blanket load.** Recreating every unlocked pipeline-owned document
from `data/` would destroy editors' work: they author in `production`, and
`development` mirrors it. A dataset change is a targeted script under
`src/migrations/`, or `sync-docs` for named committed documents. `statsToBand.ts` is the worked example: it
reports before it writes, refuses a dataset it was not named, reruns as a
no-op, and overwrites no field it did not come to change.

```sh
pnpm --filter @o3/migration verify                       # read-only: references, image fields, types, slugs
pnpm --filter @o3/migration drift                        # read-only: which committed documents an editor changed
pnpm --filter @o3/migration sync-docs -- 'client/*'      # named committed documents → the dataset (dry run without --apply)

pnpm --filter @o3/migration stats-to-band                # targeted: stats field → a statsSection at story[0]
pnpm --filter @o3/migration dev-mirrors-prod             # targeted: delete development documents production lacks
```

**Which dataset?** Every `sanity exec` command resolves it through
`@o3/sanity/brand`, which falls back to **`development`**, so an unconfigured
checkout cannot write to the live dataset. `pnpm dataset` prints what each entry
point is pointed at and `pnpm dataset production` switches them together.
`verify`, `drift` and `sync-docs` print the target project and dataset before
they do anything.

`verify` checks the dataset against the committed corpus. The tests check the
corpus itself; `verify` checks the thing the corpus was supposed to produce,
which fails differently — a document can be perfect on disk and missing,
half-written, or shadowed in the dataset. It reports per-type counts, then:
every committed document present, every reference resolving, no image marker
left unresolved, every document passing its zod gate, no `_type` the schema
does not define, no two documents claiming one slug, and nothing routable in the
dataset that is not committed under `data/`. Non-zero exit on any finding.

Rules of the road:

- **What an editor wrote outranks the committed JSON** (ADR 0003, inverted). `pnpm dataset:drift` names the pipeline-owned documents an editor changed; lock them with `-- --lock` or port the edit into `data/`.
- **The corpus tests guard the hand-edited JSON.** `converted.test.ts`, `translated.test.ts`, `seed.test.ts` and `corpus.test.ts` hold the committed JSON to the zod gates in `src/map/`, to resolving references and to honest provenance; `redirects.test.ts` holds the app's redirect table.
- **A document with `migration.locked: true` is never replaced from outside it.** Editors lock documents they take over (Studio toggle). A transformation whose only input is the document's own fields is outside the rule (AGENTS.md → "Changing a dataset").
- Deterministic IDs name the source: `<type>-wp-<id>` (WordPress), `<type>-seed-<slug>` (greenfield).
- **An image marker names where the bytes come from** — `_wpSrc` a WordPress upload, `_srcUrl` a URL on any other source site, `_localSrc` a repo-relative file committed beside its seed. `data/assets.json` is the source→asset audit map.
- **A translated case study pins what it was written from.** Its `_meta` records the sha256 of its `data/extract/caseStudy/` source and of `rules/caseStudy.md`, and `translated.test.ts` fails if either file changes — so neither is edited in place.

---

## The full archive: what the long tail turned out to be (#17)

All 272 insights converted with an **empty fail-loud report**. Getting there
meant two new mapper arms, five recorded drop decisions, and two corrections to
how authorship was being read — the second one (#32) deleted the byline from
239 of them, because the live site never showed one.

### ACF module types, in full

`flexible_post_content` uses exactly three layouts across the whole archive —
`text` (277 instances), `video` (7), `image` (3). All three were mapped.

- **`video`** stores its source two ways. `external` keeps the **iframe HTML**
  WordPress cached from oEmbed (not a URL), so the `src` was pulled out of it;
  `file` keeps an uploaded mp4, which migrated as an ordinary asset. Both
  became an `embed`.
- **`image`** is an ACF image array → a `figure`, alt falling back to the
  attachment title.

### Recorded drop decisions

Five things did not migrate. None of them was silent — each was reported as a
**note** (converted, but the source needed cleaning up):

1. **`[single_image title="…"]`** (5 uses, 3 posts). Stripped. The shortcode is
   **not registered** in WordPress, so visitors see the literal
   `[single_image …]` text on the live site today, and none of the image titles
   it names still exist in the media library. Removing it is a fix.
2. **Embedded forms** (3 posts — HubSpot ×2, Gravity Forms ×1). Stripped, with
   the provider named so an editor can re-add a CTA. This was already a silent
   loss: block-tools discards `<script>` and `<form>` without a word.
   **Still dropped after #58 and #412.** Those tickets added `formSection` and
   gave it a destination — it posts to the app's `/api/contact` route, which
   forwards to HubSpot — but a section block cannot appear inside an insight
   body: a body is Portable Text with a closed inline-object set (`figure`,
   `embed`, `pullQuote`), never section blocks (CONTEXT.md). Admitting a form
   into a body is its own schema conversation.
3. **Broken Yoast title templates** (1 post). See the SEO section below.
4. **Code blocks** — nothing to drop. Zero `<pre>`, `<code>`, `wp-block-code`
   or highlighter classes in 272 bodies, which settles the open question from
   the schema spec: **ADR 0005**, no `codeBlock`.
5. **A byline naming a deleted team post** (7 posts). The ACF `author` points
   at a `team` record WordPress no longer has, so there is no name to migrate
   and the live page shows none either. See "The byline is the ACF `author`,
   or nobody" below — that is the whole decision, and this is its one note.

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

| Posts   | ACF `author`           | Result                          |
| ------- | ---------------------- | ------------------------------- |
| **33**  | set, team post exists  | `author` reference — the byline |
| **7**   | set, team post deleted | no `author`, **noted**          |
| **232** | not set                | no `author`, silently           |

The middle row is the only one worth a human: team ids `5102`, `5320`, `7533`
and `8031` are named by seven posts and exist nowhere in WordPress any more.
The live site renders nothing for them either, so the document is right without
an author — but someone deleted a record a byline still points at, which is
source cleanup, not a conversion failure.

How the people were joined:

- A WP _user_ and a _team_ post are the same person when they share an email or
  a name. **Email first** — three accounts never had a display name set, so
  their "name" is a login (`handler`, `kelly`) that joins to nothing. The join
  is what gives an ACF-bylined person their `person-wp-<userId>` id and their
  curated name.
- The team record supplies name, role and headshot; the user record is an
  account. Merged people keep `person-wp-<userId>` so existing references hold;
  team-only people (former staff who still wrote things) get
  `person-wp-<teamPostId>`; the two id spaces do not overlap.
- Team posts were extracted with `post_status => any`. Six referenced members
  are unpublished, and a former employee is still the author of what they wrote.
- **Person documents are reference-driven.** Only people something points at
  are committed — the team CPT lists everyone who ever worked here. That "some
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
   fallback applied — the attachment title stands in — but the titles describe
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
  The documents loaded (the loader wrote JSON straight to the dataset, so Studio
  validation never ran) and read as invalid in Studio until someone supplies
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

**All 20 are published**, so the flags above are live copy rather than draft
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

## Seeds: greenfield content, same corpus (#20)

Greenfield pages are committed JSON under `data/seed/<type>/<slug>.json`, so no
content is ever entered by hand twice, and reach the dataset through
`sync-docs`. `data/seed/page/index.json` (the homepage) is the worked example.

The rules, all enforced by `src/seed.test.ts`:

- **`<type>-seed-<slug>` ids**, matching the folder.
- **`migration.sourceId` starts `seed:`**, and `locked` is `false`. A seed is
  re-derivable from git, so it is never born locked.
- **Every reference resolves** to another committed document. A dangling
  reference writes without complaint and renders as a hole.
- **Only registered section blocks.** Composing existing blocks is the whole
  point; a page that needs a new block type is a schema conversation
  (`/grilling` + an ADR), not an inline improvisation.
- **`surface` is explicit on every section.** `defineSectionBlock` supplies it
  as a Studio `initialValue`, which a write from `data/` never runs — a seed
  that omits it renders every section on the default surface.
- **Images use `_localSrc`**, a repo-relative path
  (`tools/migration/data/seed/assets/…`), resolved to an asset on write exactly
  as `_wpSrc` is. Seed imagery is design-sourced rather than migrated from
  WordPress, so it is **committed next to the seeds that reference it** — a
  marker pointing outside the repo fails `seed.test.ts` in CI while passing on
  the machine that authored it.

Two things seeds depend on:

- **One transaction per write.** `sync-docs` writes its whole selection in one
  transaction, and Sanity validates a strong reference against the state
  _after_ the transaction, so seeds may reference each other in any order.
- **Slug collisions are reported.** Routes resolve `…[0]`, so two documents
  claiming one slug serve a coin flip. `verify` lists any collision in the
  dataset and exits non-zero.

---

## Redirects and sitemap parity (#24)

The redirect table lives in the **app**, `apps/web/src/lib/redirects.generated.ts`,
which `next.config.ts` serves and `app/sitemap.ts` reads so the two cannot
disagree about which URLs this site has. It was generated once from both
WordPress redirect plugins' export and is maintained by hand now.
`src/redirects.test.ts` holds it to no chains, no self-redirects, wildcards
declared after the rows they would swallow, and every URL the live Yoast
sitemaps advertised (`data/extract/site/yoast-sitemaps.json`) either served or
redirected.

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
  advertised two URLs the page extract did not cover, because `ventures` is a
  CPT and the extract pulled `post_type => page` — the same shape of miss ADR
  0013 records for `services`. That is what the diff is for, and it is why #23
  gained two pages after it was written.

Findings, counts and every decision: [`docs/seo-parity.md`](../../docs/seo-parity.md).

---

## SEO: one discipline, inherited by every type (#26)

### `seo` holds overrides, never resolved values

Yoast hands back fully resolved output — the title with the site name
appended, the site OG image standing in for every document that never picked
one, `index,follow` spelled out 272 times. Copying that in would have baked
today's defaults into 272 documents and made changing a default a
272-document edit. So a document's `seo` carries only what it actually
overrode in WordPress, and `packages/content-runtime/src/seo.ts` re-derives the
rest at render time. The gate is `seoObject` (`src/map/seo.ts`).

Two normalizations were applied on the way in:

- The site-name suffix Yoast's title template appends was stripped, because the
  Next.js root layout appends the same suffix — keeping both ships `Foo | O3 | O3`.
- A title override that resolved to the document's own title, or whose
  template never resolved (`%%title%% %%sep%% %%sitename%% % %` — one real
  post had this), was dropped. The default composition already produces it.

No canonical was carried over from `canonicalRendered`: a self-referential
canonical pointing at www.o3world.com would tell Google the new site is a
duplicate of the old one.
`converted.test.ts` fails on any converted document whose canonical names the
WordPress host.

### Paths are preserved

**A migrated document keeps the URL path WordPress served it at** — the full
path, character for character, minus WordPress's trailing slash — unless the
move is recorded. `PATH_EXCEPTIONS` / `PATH_PREFIX_EXCEPTIONS`
(`src/map/paths.ts`) are that record, and ADR 0017's `/perspectives` →
`/insights` rule is the only entry. `translated.test.ts` checks every case study
against Yoast's `canonicalRendered`, and `redirects.test.ts` fails on any live
sitemap URL the site neither serves nor redirects — so a hand-edited slug that
moves a page without a redirect is a red test.

### What the renderer does with it

`packages/content-runtime/src/seo.ts` owns the resolution chain, once, for every routable
type: document `seo` → a field on the document → Site Settings `defaultSeo`.
Route entries declare only the document-shaped half (`DocumentSeo`: title,
description, image, path, `ogType`), never finished `Metadata` — which is what
stops the next content type from shipping with a title and nothing else.
Canonical is derived (a page is its own canonical) unless a document
explicitly points elsewhere.

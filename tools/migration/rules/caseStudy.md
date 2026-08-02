# Translation rules — `caseStudy`

The contract for turning a WordPress `work` post into a `caseStudy` document.
Read this and `data/extract/caseStudy/<slug>.json`; write
`data/translated/caseStudy/<slug>.json`. Nothing else is input.

**Why this is a translation and not a mapper.** The source is four levels of
nested ACF flexible content (`flexible_content[].column[].content[]`) laid out
for a page template that no longer exists; the target is a structured document
— client, narrative headline, stats, chapters, deliverables. Two prose blocks
headed "Opportunity" and "Solution" have to become chapters with kickers and
titles; three `title` rows in a column have to become `stats`. There is no
mechanical transform between those shapes, so a person (or an agent under
these rules) does the restructuring and a person reviews it (ADR 0002).

---

## The three rules that matter

### 1. Restructure. Never invent.

Every word in the output must be traceable to the source. Reordering,
splitting, compressing and re-heading source prose is the job. Writing a
sentence the source does not support is not, **even when the schema requires
the field**.

### 2. A field with no source stays empty — unless you flag it.

If the source has nothing to say, leave the field out. Do not fill it with a
plausible guess; an empty field reads as "needs writing", a guess reads as
fact.

When the schema **requires** a field the source cannot supply — `caseStudy`
requires `narrativeHeadline`, `chapter` requires `title` — you may propose
copy, and then you **must** flag it. Same when you notice something a reviewer
should decide on.

### 3. Flags are the review queue.

Every flag is an entry in `_meta.flags`:

```json
{ "field": "chapters[0].title", "kind": "proposed", "note": "why, and what it was drawn from" }
```

| `kind`     | Means                                                                       | Reviewer does                                 |
| ---------- | --------------------------------------------------------------------------- | --------------------------------------------- |
| `proposed` | Copy that is not in the source. Required field, or a needed heading.        | Rewrite or approve.                           |
| `derived`  | In the source, but compressed or rephrased enough to be worth a look.       | Check it still says the right thing.          |
| `verbatim` | Copied exactly, and something about it looks wrong (a typo, a stale claim). | Decide whether to fix the source or the copy. |
| `dropped`  | Source content with nowhere to go in the new model.                         | Confirm the loss is acceptable.               |

A translated document with no flags on a required-but-unsourced field is a bug
in the translation, not a clean run.

---

## Field mapping

| Target               | Source                                                       | Notes                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_id`                | —                                                            | `caseStudy-wp-<wpId>`.                                                                                                                                                        |
| `title`              | `title`                                                      | Verbatim.                                                                                                                                                                     |
| `slug.current`       | `path`                                                       | The path WordPress serves, minus `/work/` and slashes. **Never re-slugged** (#26).                                                                                            |
| `client`             | `title`                                                      | Reference `client-seed-<slug>`. Create the client if it does not exist.                                                                                                       |
| `industries`         | —                                                            | No source. Propose one `industry-seed-<slug>` and flag it, or leave empty.                                                                                                    |
| `industryDetail`     | —                                                            | No source. Flag if proposed.                                                                                                                                                  |
| `narrativeHeadline`  | the "Opportunity" prose                                      | **Required.** The problem the client had, in one sentence, drawn from that prose.                                                                                             |
| `stats`              | `multiple_columns` rows whose `content[]` are `title` blocks | `value` ← `title`, `label` ← `description`. Verbatim, first one is the headline stat.                                                                                         |
| `heroMedia`          | `featuredImage`                                              | `_wpSrc` marker + `alt`; the loader uploads it.                                                                                                                               |
| `chapters`           | the `text` blocks in `multiple_columns`                      | One chapter per block. `kicker` ← its heading ("Opportunity", "Solution"). `title` is required and usually unsourced — propose and flag. `body` ← the prose as Portable Text. |
| `deliverables`       | —                                                            | Only if the source lists what was shipped. Usually empty.                                                                                                                     |
| `extraSections`      | `image_carousel` images                                      | One `mediaSection` each, `width: "contained"`.                                                                                                                                |
| `seo.description`    | `seo.descriptionOverride`                                    | Overrides only, exactly as `map/seo.ts` does it — never the rendered value (#26).                                                                                             |
| `migration.sourceId` | —                                                            | `wp:work:<wpId>`.                                                                                                                                                             |
| `migration.locked`   | —                                                            | Always `false`. A reviewer taking the document over sets it in Studio.                                                                                                        |

**Ignore** `project_feed` (a "related projects" widget the new site derives),
`introduction`/`kicker_tag`/`heading_level`/`heading_tag` (presentation for the
old template), and every ACF `acfe_*` key.

---

## Body text

`chapter.body` is `bodyText` — Portable Text, same closed set as a perspective
(`block`, `figure`, `embed`, `pullQuote`; no code block, ADR 0005). Keys are
`k0000`, `k0001`, … in document order, exactly as the deterministic converter
produces them, so a re-translation diffs cleanly.

Keep the source's paragraph breaks. Do not add headings the source does not
have — the chapter kicker and title are the heading.

---

## `_meta`

Not part of the schema; `load` strips it and puts the extracted source on
`migration.source` for side-by-side review in Studio.

```json
"_meta": {
  "sourceFile": "caseStudy/la-colombe.json",
  "sourceHash": "sha256:…",
  "rulesFile": "rules/caseStudy.md",
  "rulesHash": "sha256:…",
  "model": "claude-opus-5",
  "translatedAt": "2026-08-01",
  "flags": []
}
```

Both hashes are of the file bytes. They are what makes a re-translation
honest: if the source or these rules changed, the document was translated
under different conditions and needs re-reviewing. `pnpm --filter
@o3/migration convert` re-checks them and fails loud on a mismatch.

---

## Loading

Translated documents load **published**, like every other tree
([ADR 0016](../../docs/adr/0016-publish-what-wordpress-publishes.md)): what
this track holds is content WordPress publishes today, and withholding it was
not protecting anyone.

Review is unchanged and matters more, not less. It is two-sided — the PR diff
(extract vs translated) and the document's own `migration.source` panel in
Studio, which carries every flag this file told you to raise. **A flag is now
a claim on the live site.** Raise it anyway; the alternative is not a draft, it
is an unmarked invention.

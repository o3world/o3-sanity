# 0017. The collection is an Insight, and it lives at `/insights`

- **Status:** Accepted
- **Date:** 2026-08-04
- **Deciders:** NickO3 + Claude
- **Related:** [ADR 0001](./0001-component-routing-port.md), [ADR 0003](./0003-disposable-dataset-migration-lock.md), [ADR 0011](./0011-live-route-name.md), [ADR 0013](./0013-services-consolidate-into-solutions.md), [docs/seo-parity.md](../seo-parity.md)

## Context

The blog article type was `perspective` in every layer of the code — schema
name, document ids, route, component names, migration mapper, committed JSON —
and "Insights" everywhere a person could see it. CONTEXT.md recorded that split
as a decision: _"The canonical term (not 'post', not 'insight' — the mockup's
'Insights' nav label is display copy stored in Site Settings)."_

Three things had accumulated against it.

**The design never said Perspectives.** The nav component (`1710:2271`) has read
Work · Live · Insights · Solutions · About since the first canonical frame, and
ADR 0011 leaned on exactly that reasoning for `/live`: _"the nav label is the
only naming the design actually gives this page, and a URL that disagrees with
the word a visitor just clicked is a cost paid on every visit, forever."_ That
argument applied here too, and pointed the other way from the split.

**The sibling brand already publishes at `/insights`.** o3xo.ai — which
shadows 27 of these very articles — uses the word in its own URLs. So does
WordPress, which has served a `/insights` → `/perspectives` redirect for years.

**`perspective` collides with Sanity's own API.** `{ perspective: 'raw' }` in
`load.ts` selects published-versus-draft; it has nothing to do with the content
type. Two unrelated meanings of one word, in one file, one of them load-bearing
for the lock rule.

Keeping the split cost a translation table every contributor had to learn, and
a `siteSettings.perspectivesLabel` field whose entire job was to render one word
as another.

## Decision

**The type is `insight`, the route is `/insights`, and the word is the same in
every layer.** Schema, document ids (`insight-wp-4377`), the section block
(`insightsCarouselSection`), components, the migration mapper, committed JSON
under `data/converted/` and `data/seed/`, and the CONTEXT.md lexicon.

Four consequences are decisions in their own right.

**`data/extract/` keeps `perspective`.** The extract tree is the committed
record of what WordPress said, and WordPress still calls this `/perspectives`.
`convert.ts` is the seam: `readDir('perspective')` in, `emit('insight')` out.
Renaming the landing zone would make the snapshot claim WordPress uses a word
it does not.

**The label field is deleted, not renamed.** `perspectivesLabel` existed to
translate the type name into the display name. With one word there is nothing
to translate, so the schema field, its GROQ projection, its generated type and
`BackToInsights`'s fallback constant all go. A nav item's own `label` still
overrides per link, as it does for every other entry. The migration mapper's
`DISPLAY_LABELS` override **stays**, because WordPress's menu title is still
literally "Perspectives" — dropping it would put the retired word back in the
nav.

**One prefix rule, not 272 rows.** `PATH_PREFIX_EXCEPTIONS` is a new form
alongside `PATH_EXCEPTIONS` in `map/paths.ts` — its first live entry after
being empty by design since #26. One declaration drives the parity check, the
301s, and the nav hrefs built from WordPress menus; `hrefForMenuItem` now
consults it, so the nav links the route that exists instead of relying on its
own redirect.

**A self-redirect is an error.** WordPress's `/insights` → `/perspectives` row
points at its own source once the destination moves. `buildRedirectMap` throws
on any `source === destination` rather than dropping it quietly, because
Next.js would serve one as an infinite redirect; `SELF_REDIRECT_EXCEPTIONS`
records this one case with its reason and routes it into the existing dropped
list.

## Alternatives considered

### Keep `perspective` in code, "Insights" on screen (the status quo)

- **Pros:** zero SEO cost — 243 URLs keep resolving at their own address. No dataset reload, no redirect churn, no docs to rewrite. The split was already written down, so it was at least a known cost.
- **Cons:** every contributor learns a translation table; the URL disagrees with the nav word forever; the label field, the fallback constant and the mapper override exist only to bridge the gap; and `perspective` keeps colliding with Sanity's query option in the one file where that distinction protects the lock rule.
- **Why not:** the split's whole justification was that "Insights" was display copy the design happened to prefer. Once you accept the design named the collection, the code is simply using a different word than the product does.

### Rename the type but keep the URL at `/perspectives`

- **Pros:** all the vocabulary benefits, none of the SEO cost. The parity table would not move at all.
- **Cons:** re-creates the same split one layer down, with the URL as the last holdout — arguably worse, because a URL is the most public name a thing has.
- **Why not:** it trades a cost paid once for a cost paid on every visit, which is the trade ADR 0011 already declined.

### Serve both paths, canonical-tagged

- **Pros:** no redirect hop; gentlest possible transition.
- **Cons:** doubles the routable surface permanently, and duplicate-content handling by canonical alone is weaker than a 301. Two live URLs for one document is the ambiguity this ADR exists to remove.
- **Why not:** it defers the decision instead of making it.

### 272 exact rows in `PATH_EXCEPTIONS`

- **Pros:** no change to a mechanism that had never had a live entry.
- **Cons:** buries one decision in 272 identical rows, and goes stale the first time a slug changes.
- **Why not:** the rename is one decision. The prefix form says it once. Its first real use was also the honest moment to shape it.

## Consequences

- **243 URLs move from "served at the same path" to "redirected."**
  [docs/seo-parity.md](../seo-parity.md) states this as a cost rather than
  re-tabulating it, and `map/redirects.test.ts` asserts the figure so a later
  rename cannot enlarge it quietly.
- The `development` dataset was reloaded and verified first (273 insights, every
  reference resolving); `production` follows.
- Two pre-existing faults surfaced and were fixed on the way, each in its own
  commit: every `load` was writing to `production` regardless of configuration,
  and `data/assets.json` was trusted globally when it records uploads per
  dataset.
- **`data/extract/` now reads in WordPress's vocabulary and out in ours.**
  Anyone adding a type to the pipeline inherits that seam; it is marked at
  `convert.ts`'s `readDir` call.
- Three open issues (#61, #69, #77) name the retired word and are retitled.
  ADRs 0001–0016 are left as written — they record what was decided when, and
  #61's frame request is the only one whose content changes.

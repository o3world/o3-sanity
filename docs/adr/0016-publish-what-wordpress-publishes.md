# 0016. The dataset publishes what WordPress publishes, and nothing invented

- **Status:** Accepted
- **Date:** 2026-08-02
- **Deciders:** NickO3 + Claude
- **Related:** [issue #22](https://github.com/o3world/o3-sanity/issues/22), amends [ADR 0003](./0003-disposable-dataset-migration-lock.md) and [ADR 0007](./0007-content-sourcing-and-provenance.md)

## Context

Two rules had grown up next to each other and started to disagree.

[ADR 0003](./0003-disposable-dataset-migration-lock.md) carried #5's guarantee
forward: translated case studies load as **unpublished drafts**, because the
translate track is the one lane undergoing editorial review. So all 20 case
studies — every one of them a post WordPress serves at a public URL today, all
20 listed in the live `work` Yoast sitemap — existed in the dataset as drafts
and on the site as nothing at all.

[ADR 0007](./0007-content-sourcing-and-provenance.md) carried the opposite kind
of document forward for the opposite reason: three hand-authored case studies
(`aramark`, `chop`, `ironman`) fill the homepage showcase, two of them
describing engagements **no WordPress case study exists for**. They were kept
because deleting them would leave a canonical frame's section with no cards —
and because the real 20 were drafts, there was nothing to put in their place.

The result was a site that published invented client outcomes and withheld real
ones. The owner's direction on #22 settles it: _"Don't default to draft. If
something is published live, it should be published on the sanity site. O3xo is
its own site, so any redirects to that site should be preserved"_ — and, in
chat, _"any obvious placeholder content should not be published."_

## Decision

**The pipeline publishes every committed document, and no document exists to
stand in for content nobody wrote.**

Concretely:

- `load` writes all three trees — `converted/`, `seed/`, `translated/` —
  **published**. The tree a document came from is provenance, not publish
  state. It also deletes any draft left shadowing a document it writes, so the
  runs that loaded drafts-only do not leave a second copy behind.
- The three invented showcase case studies are **deleted from `data/seed/`**,
  along with the `industry` term that existed only to give one of them an
  eyebrow. The homepage showcase points at the three real case studies whose
  clients the frame's own cards carry: IRONMAN, Vertex, Caron.
- **Publish state is not the redirect layer.** The 32 documents WordPress
  publishes while 301ing their URLs to o3xo.ai stay published here, exactly as
  they are on WordPress; the generated redirect map — o3xo rows untouched —
  makes their URLs unreachable, and `sitemap.ts` refuses to advertise a path
  the map redirects. A 301 makes a URL unreachable, not a document wrong.
- **The lock is still the protection.** `migration.locked` remains the only
  thing that stops the pipeline touching a document, in any mode.

Review does not go away; it stops being a gate the pipeline enforces by
withholding content. `migration.source` still travels onto every translated
document with its flags, and the 173 flags #22 raised are still the queue.

## Alternatives considered

### Keep the drafts-only rule and publish by hand in Studio

- **Pros:** unchanged pipeline; every publish is a deliberate human act, which is what #5 asked for.
- **Cons:** the dataset is disposable (ADR 0003) — every rebuild would discard the publishing and require 20 more manual publishes. Meanwhile the live site's real work stays invisible while three invented case studies represent it.
- **Why not:** the owner asked for the opposite, and the drafts-only rule was protecting a review process that does not yet exist. A rule whose only observable effect is a rebuild chore is not protecting anything.

### Publish the translations but keep the three placeholders

- **Pros:** no seed deletion, no showcase edit, no test churn; the frame keeps its three cards without anyone choosing which real case studies fill them.
- **Cons:** publishes invented client engagements for two real, named clients on the homepage and at `/work/aramark`, `/work/chop`. `verify` would list them as provisional forever, and #48's launch gate would still have to delete them.
- **Why not:** "any obvious placeholder content should not be published" is exactly this content. And the reason ADR 0007 gave for carrying them — the showcase needs three cards and no real case study is available — expired the moment the 20 published.

### Keep the seeds but exclude them from `load`

- **Pros:** the invented copy stays readable in git without ever reaching the dataset; reversible by deleting one exclusion.
- **Cons:** invents a second, invisible category of committed document ("committed but not loaded") that every corpus check — `seed.test.ts`, `slugsByType`, `verify`'s expected ids — would have to learn about and could silently get wrong.
- **Why not:** git already keeps history. A file whose only purpose is to be skipped is a trap for the next reader; deletion says the same thing and cannot drift.

### Unpublish the 32 o3xo.ai-shadowed documents while publishing the rest

- **Pros:** the documents whose URLs 301 away would not exist as published content at all — no chance of one leaking into a listing or a feed.
- **Cons:** WordPress publishes them today, so unpublishing is a divergence from the source of truth that no rule in the migration asks for; the redirect map already makes the URLs unreachable and the sitemap already refuses them; and `/work` and `/perspectives` listings would silently lose rows the old site still counts.
- **Why not:** the owner's direction is explicit — preserve the redirects, and publish what is published live. Whether those documents should exist at all is an editorial call that belongs to whoever owns the o3xo relationship.

## Consequences

- **Positive:** the site serves the 17 real case studies whose URLs it owns (20 translated, minus the 3 the redirect map sends to o3xo.ai) instead of three invented ones. `sitemap.ts` advertises them without anyone doing anything. `verify` reads the whole corpus, so the translate track is finally covered by the same "is it actually in the dataset" checks as everything else.
- **Negative:** flagged fields are now live. Five carousel `alt` strings that fall back to an attachment title and four anonymized client names (`Legal AI`, `Healthcare innovation`, …) are published copy rather than draft copy — recorded in `tools/migration/README.md`, still flagged on the document, and now a fix-forward job rather than a pre-publish one.
- **Negative:** 15 `client` documents publish with no logo, which Studio reads as invalid. That was already true and remains the correct signal; it is more visible now.
- **Risks / open questions:** when real editorial review begins, the lock workflow has to be in place before anyone edits a published document the pipeline still owns — ADR 0003's open question, now load-bearing sooner. And the showcase's three cards are an editorial choice sourced from the frame's logos, not a ranking; whoever owns the homepage may want different ones.

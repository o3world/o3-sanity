# 0003. Treat the dataset as disposable; protect documents with an explicit migration lock

- **Status:** Accepted
- **Date:** 2026-07-31
- **Deciders:** NickO3 + Claude
- **Related:** [issue #9](https://github.com/o3world/o3-sanity/issues/9)

## Context

Issue #5's extract → translate → review stage guaranteed drafts-only output and "never overwrite editor-modified drafts," with the vtx `sanity-ops` ledger (per-document last-written `_rev` tracking) as the suggested mechanism. During build-out, however, the priority is rebuilding the whole dataset from scratch without re-entering content by hand — including greenfield pages like the new homepage, which were never in WordPress at all.

## Decision

We will make committed JSON the source of truth and the Sanity dataset disposable during build-out. All content — migrated (`data/extract/`), agent-translated (`data/translated/`), and greenfield (`data/seed/`, first artifact: the homepage wireframe) — exists as one committed JSON file per document. The loader's `rebuild` deletes and recreates every pipeline-owned document except those carrying an explicit `migrationLock: true` (a boolean in a hidden `migration` provenance object on every pipeline-owned type); the pipeline never touches a locked document, in any mode. Locking is a deliberate act (Studio toggle) — reviewers lock documents they take over. Extract-derived and seed documents load published; translated case studies load as unpublished drafts per #5's review guarantee. IDs are deterministic: `<type>-wp-<id>` (migrated), `<type>-seed-<slug>` (greenfield).

## Alternatives considered

### Ledger + `_rev` inference (the vtx `sanity-ops` pattern)

- **Pros:** protects editors automatically — no one has to remember to lock; proven in vtx.
- **Cons:** protection is implicit and invisible; a committed ledger file must stay in sync with the dataset; inference ("did an editor touch this?") answers the question indirectly; incompatible with a rebuild that must recreate customized-but-unlocked documents.
- **Why not:** the user wants protection to be an explicit, visible act, and rebuild-from-scratch to be the default while JSON is the source of truth. One mechanism (the lock) replaces two (ledger + inference).

### Drafts-only loading for all tracks (the original #5 guarantee)

- **Pros:** nothing goes live without a human publish; uniform rule.
- **Cons:** during build-out every rebuild would require mass manual publishing before the site renders.
- **Why not:** the drafts-only rule exists to protect editorial review, which only the translated track is undergoing; build-out predates editorial review by design.

## Consequences

- **Positive:** the dataset can be wiped and rebuilt from git at any time; no content is ever hand-entered twice; protection semantics are visible on the document itself; no ledger file to drift.
- **Negative:** an editor who customizes a document without locking it loses those edits on the next rebuild — acceptable while the dataset is explicitly disposable; amends #5's guarantee mechanism (edit-inference → explicit lock).
- **Risks / open questions:** when real editorial review begins, the lock workflow (Studio toggle/document action, possibly auto-lock on publish) must be in place before rebuild is retired; the `migration` provenance object must be added to every pipeline-owned schema type.

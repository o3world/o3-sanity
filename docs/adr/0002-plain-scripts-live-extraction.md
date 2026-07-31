# 0002. Migrate with plain TypeScript scripts and live `wp eval` extraction — no staging database

- **Status:** Accepted
- **Date:** 2026-07-31
- **Deciders:** NickO3 + Claude
- **Related:** [issue #9](https://github.com/o3world/o3-sanity/issues/9)

## Context

The WordPress→Sanity migration moves ~340 documents (~15k meaningful postmeta values once ACF's revision copies and `_`-prefixed field-key rows are excluded — 90% of the 324k-row table is revision baggage). All body content lives in ACF flexible-content fields, invisible to anonymous REST, stored as index-encoded meta keys that are fiddly to reconstruct by hand. A live DB dump exists (issue #4). The prior art, vtx-web, used dlt → Postgres warehouse → dbt-style staged models → a migration-core CLI, at roughly 100× this scale.

## Decision

We will build the pipeline as plain TypeScript scripts in a new `tools/migration` workspace (new `tools/*` pnpm glob). Extraction runs `terminus wp eval` against the live Pantheon site, calling ACF's own `get_fields($post_id)` and emitting one structured JSON file per document — ACF performs its own flexible-content reconstruction, so we write no meta-key parsing. There is no staging database; the DB dump is retained as insurance only. Perspectives convert deterministically via Sanity's official `htmlToBlocks` with per-ACF-module mappers that fail loud on unknown modules or elements.

## Alternatives considered

### Port the vtx-web pattern (dlt → Postgres → dbt-style transforms)

- **Pros:** proven in-house; queryable audit trail; handles scale and hand-written transform logic well.
- **Cons:** adds a Python runtime and a warehouse to a pnpm/TS repo; all of its value assumes transform code that this migration doesn't have (translation is agent-driven, per #9's addendum).
- **Why not:** the machinery earned its keep at ~100× this scale; here it would only move MySQL rows into another store so scripts could query them there instead.

### Load the dump into a local MariaDB and reconstruct ACF in SQL/TS

- **Pros:** fully offline; deterministic against a fixed snapshot.
- **Cons:** the ACF reconstruction (nested repeaters, clone fields, image ID resolution from index-encoded meta keys) is the fiddliest code in the whole pipeline, hand-written for one use.
- **Why not:** `get_fields()` does that reconstruction for free and correctly; a local DB is only worth building if the live route is blocked. Falls back to this if live access disappears.

## Consequences

- **Positive:** near-zero extraction code; no Python, no warehouse, no Docker dependency; the fiddliest transform is delegated to ACF itself; `tools/migration` is visibly temporary and deletable post-migration.
- **Negative:** extraction depends on live-site availability and terminus access; live content can drift between extraction runs (mitigated by snapshotting extracts to committed JSON, per ADR 0003).
- **Risks / open questions:** `wp eval` must remain permitted on Pantheon; a staging database is not permanently excluded if extraction needs grow.

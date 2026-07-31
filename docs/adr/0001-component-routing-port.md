# 0001 — Component routing system: port shape

Status: accepted (2026-07-31)

## Context

The highest-value port from vtx-web is its component routing system — two stacked deep modules in `apps/web`:

1. **content-routes**: `define*Type` entry helpers + four route builders (`buildDetailRoute`, `buildCatchAllRoute`, `buildSingletonRoute`, `buildListingRoute`) hiding cached fetches, cache-tag/revalidation wiring, `_type` dispatch, and TypeGen-driven prop typing behind thin `page.tsx` shims.
2. **block dispatch**: a `BLOCK_REGISTRY` `satisfies`-checked against the generated content-array union, so a schema block without a renderer is a compile error — the guardrail that replaces the schema-parity test suites this repo deliberately does not carry.

vtx-web matches documents by a server-materialized `path` field, maintained by a pipeline (Sanity Functions, Blueprints deploy workflow, Studio publish cascade). o3world.com's URL space is flat: four prefixed collections (`/perspectives/{slug}`, `/work/{slug}`, `/services/{slug}`, `/ventures/{slug}`) and ~22 pages at depth ≤ 2. Alternatives weighed for the URL seam: flat multi-segment slugs; a `parent`-reference hierarchy resolved at query time; the full materialized-path pipeline. For the block model: vtx's two-tier base/section split vs a single flat tier. For editing: Sanity Presentation live editing (dual server/client registries) vs server-only rendering.

## Decision

- **URL seam: flat multi-segment slugs.** One `buildDetailRoute` per collection under its prefix; one catch-all route for `page` documents matching `slug.current == segments.join('/')` (slugs may contain slashes, e.g. `solutions/commerce`). The entire path-materialization pipeline — `routing.ts`, `materializeRoutingFields`, both Sanity Functions, `sanity.blueprint.ts`, `deploy-blueprints.yml`, the publish cascade — is not ported.
- **Block model: keep the two-tier split.** Section-tier blocks own layout (columns, `SectionShell` chrome, contrast matrix) and contain base-tier blocks. Flexible page build-out happens inside `page` documents' section arrays, not in the routing layer.
- **Keep Sanity Presentation live editing.** Dual registries (`registry.ts` server, `clientComponents.ts` client) + `ClientBlockRenderer` with optimistic drag-reorder port over.
- **i18n and legacy path rewrites are not ported** (single-locale site); `build.tsx` shrinks to roughly 200 lines.

## Consequences

- Contract imposed on the schema (feeds the schema-design ticket): every routable document type carries a required `slug`; `page` slugs may be multi-segment; the schema package must run `sanity typegen` so both registries stay compile-checked; block schema names mirror `content/blocks/{base,section}/` folder names (schema-symmetric folders, by convention or a small lint script — not tests).
- Build-out of new marketing areas is editor-only (new `page` doc + slug); renaming a hub means editing child slugs by hand — acceptable at this page count. Revisit (parent references or materialized paths) only if deep hierarchy or bulk re-parenting becomes real.
- `cacheTags.ts` + the `/api/revalidate` webhook pattern port as-is; per-doc and per-type invalidation keeps working.
- Adding a content type stays a one-folder change (`documents/<type>/entry.tsx` + registry line).

# vtx-web port inventory — what to port, what to leave behind

Research for issue #2. Source surveyed: `/Users/nick/projects/vtx-web` (local checkout, 2026-07-30).

**Charter applied:** keep the studio/schema/web setup approach, the CI process, the tooling, and Storybook. Drop ALL automated testing (vitest, playwright, e2e, coverage) and all vtx-specific domain code. Bias: simplicity over completeness.

Verdict legend:

- **Port** — lift with minimal edits (rename scopes, trim test wiring).
- **Adapt** — the pattern/approach is right, but rebuild a simplified version rather than copying files.
- **Drop** — do not carry into o3-sanity.

**TL;DR.** Port: the CI model (Actions-owned Vercel deploys with `vercel.json` git-integration off, turbo `--affected` + remote cache, manual production promote), the root tooling stack (turbo/lefthook/syncpack/knip/prettier/shared ts+eslint configs), the thin-Studio + `createStudioConfig()` factory shape, Storybook (story-kit `storyRoots` + factories), tailwind-config token architecture, `env`, `site-auth`, and — the centerpiece — the component routing system in `apps/web` (§1), which lifts cleanly and shrinks by roughly half once i18n and path materialization are removed. Adapt: `packages/sanity` / `packages/sanity-studio` (keep the factories, typegen, and query colocation; rebuild the vtx document types/taxonomies), `packages/ui` (cherry-pick). Drop: all 6 migration/agent-tooling packages + `apps/context`/`apps/migration`, `apps/docs`, `pipelines/`, `functions/`, path materialization, i18n, and every trace of vitest/playwright/coverage (~1,100 test files, `packages/e2e`, `packages/vitest-config`, the `test`/`e2e` CI legs).

---

## 1. The component routing system (highest-value port)

This is really **two stacked systems** in `apps/web`, both worth porting, plus the conventions that hold them together.

### 1a. Document → route layer (`content-routes` + the document registry)

**Where it lives:**

| Piece | Path |
| --- | --- |
| Route-builder library | `apps/web/src/lib/content-routes/` — `build.tsx` (582 lines, the whole engine), `define.ts` (41-line `defineCatchAllType` / `defineDetailType` / `defineSingletonType` / `defineListingType` helpers), `types.ts` (213 lines of entry/typing machinery), `cacheTags.ts`, `encodePathParam.ts`, `legacyPathRewrites.ts`, `localeStaticParams.ts` |
| Per-type route entries | `apps/web/src/content/documents/<typeName>/entry.tsx` (one folder per Sanity document type; 16 types registered) |
| Registry aggregator | `apps/web/src/content/documents/index.ts` — exports `CATCH_ALL_TYPES`, `DETAIL_TYPES`, `SINGLETON_TYPES`, `ALL_CONTENT_TYPES` |
| View-mode registries | `apps/web/src/content/documents/registry.ts` (`getView` with `next/dynamic` lazy `VIEW_OVERRIDES`, static `DefaultView` fallback), `card-registry.ts` (`getCard` / `getTeaser` / `CARD_PROJECTIONS`, client-safe), `_defaults/` (DefaultView / DefaultTeaser / projections) |
| Route shims (thin `page.tsx` files) | e.g. `apps/web/src/app/(localized)/[locale]/(site)/[...segments]/page.tsx` — ~70 lines: pick entries, pick query, `export default route.Page` |

**How it works.** Each document type registers an *entry*: `{ type, query, renderer, metadata?, view/card/teaser slots }` via a `define*Type` helper. Four route builders in `build.tsx` turn entries into Next.js route exports (`generateMetadata` + `Page`):

- `buildDetailRoute` — one type at `<prefix>/[slug]`.
- `buildSharedDetailRoute` — several types sharing a prefix, one merged GROQ `_type in [...]` query, dispatch on the returned `_type`.
- `buildCatchAllRoute` — the `[...segments]` page: joins segments into a materialized `path`, runs one shared query, dispatches on `_type` via a `Map<string, RoutableEntry>`.
- `buildSingletonRoute` / `buildListingRoute` — fixed-URL singletons; listing adds a paginated feed (count query + slice + `feedItems`/`pagination` props).

Every builder wraps its fetch in `React.cache` so `generateMetadata` and `Page` share one `sanityFetch` per request, and tags every fetch with `docTag`/`typeTag`/`languageTag` (`cacheTags.ts`) so a `/api/revalidate` webhook can invalidate a single doc or a whole type.

**Typing.** `types.ts` keys renderer props off Sanity TypeGen: `QueryResult<Q>` looks the query literal up in the `SanityQueries` interface that `packages/sanity/src/types/generated.ts` augments on `@sanity/client`. Entries carry literal query types; "erased" aliases (`AnyDetailEntry` etc.) make heterogeneous registry arrays work with exactly one cast at the dispatch seam (`renderEntry`). This is the part that makes the whole system feel typed end-to-end and is worth porting verbatim.

**Dependency footprint of the layer:**

| Dependency | Used for | Port impact |
| --- | --- | --- |
| `@workspace/sanity/queries` + `types/generated` | `defineQuery` literals, TypeGen `SanityQueries` augmentation, generated doc types | **Required.** o3-sanity needs the same TypeGen setup (`sanity typegen`) in its schema package |
| `@/sanity/live` (`apps/web/src/sanity/live.ts`) | `sanityFetch` from `next-sanity` `defineLive` | **Required** (standard next-sanity) |
| `@workspace/i18n` (`locales`, `paths`, `policy`) | `[locale]` segment, `localizedPath`, missing-translation fallback (`fallbackOrNotFound`), hreflang `buildAlternates` | **Drop** — o3-sanity is single-locale; this deletes roughly a third of `build.tsx` |
| `apps/web/src/proxy.ts` + `@workspace/i18n/proxy-decision` + Edge Config redirects | Normalizes public URLs into internal `/<locale>/...` paths; Sanity-managed redirects via Edge Config | **Drop the locale half.** The Edge-Config redirect half is optional; `next.config` redirects suffice for a small site |
| Materialized `path` field (`packages/sanity/src/routing.ts`, `utils/materializeRoutingFields.ts`, the `functions/materialize-paths` Sanity Function, Studio publish cascade) | The catch-all matches documents by a server-materialized full path, not by slug | **Adapt.** For a simple flat site, match on `slug.current` directly and delete the entire materialization pipeline. Only re-introduce materialized paths if o3-sanity needs nested/hierarchical URLs |
| `legacyPathRewrites.ts` | Drupal-era `/resources/<slug>` namespace rewrites | **Drop** (vtx migration artifact) |

**Lift assessment: lifts cleanly, and shrinks a lot.** The layer has no dependency on vtx domain code — only on the schema package's queries/types and on i18n. Concretely for o3-sanity:

1. Port `types.ts` + `define.ts` nearly verbatim (delete `translatable`, `ListingEntry` if unneeded).
2. Port `build.tsx` minus: locale param, `fallbackOrNotFound`, `buildAlternates`/`buildSingletonAlternates`, `legacyRewriteFor`. What remains is ~200 lines: cached fetch + tag wiring + `_type` dispatch + metadata extraction.
3. Keep `cacheTags.ts` + the `/api/revalidate` webhook pattern as-is (generic, valuable).
4. Start with just `buildCatchAllRoute` + `buildSingletonRoute` (homepage). Add `buildDetailRoute` when a dated/collection type (e.g. blog) appears. A simple site may need only 2–4 entry folders instead of 16.
5. Keep the `documents/<type>/entry.tsx` + `index.ts` aggregator convention — it is the thing that makes adding a content type a one-folder change.

### 1b. Block dispatch layer (page builder, `content/blocks/`)

**Where it lives:** `apps/web/src/content/blocks/`

| Piece | Path |
| --- | --- |
| Server registry | `registry.ts` — `BLOCK_REGISTRY`, typed `satisfies { [K in DispatchedBlockType]: BlockComponentSlot<K> }` against generated Sanity block types |
| Client registry | `clientComponents.ts` (110 lines) — `CLIENT_SECTION_BINDINGS`, the client-safe subset for draft preview |
| Shared dispatch loop | `dispatchBlocks.tsx` (51 lines) — `renderDispatchedBlocks`: lookup by `_type`, strip `_type`/`scheduling`, stamp `data-sanity` attr, placeholder for unregistered types |
| Renderers | `BlockRenderer.tsx` (server/published, 69 lines) and `ClientBlockRenderer.tsx` (118 lines; Presentation-tool draft preview with `optimisticOrder.ts` drag-reorder support) |
| Binding helper | `defineBlockRender.ts` (91 lines) + `SERVER_SECTION_OVERRIDES` for server-only blocks (e.g. `staticHtmlBlock` reads fs) — ADR 0087 |
| Section chrome | `SectionShell.tsx`, `SectionBackdrop.tsx`, `contrastMatrix.ts`, `resolveColumnCount.ts` |
| Block components | `blocks/section/` (20 section-tier blocks) and `blocks/base/` (14 inline-tier blocks), one folder per schema name |

**How it works.** Page documents carry a `content` array of block objects; `BlockRenderer` maps each item's `_type` through `BLOCK_REGISTRY` and renders. The type-level trick: `DispatchedBlock` is derived from the *generated* `LandingPage['content']` union, so adding a schema block without a renderer is a compile error, not a runtime placeholder. Blocks receive their generated Sanity type as props plus `sanity` (visual-editing data attribute) and `activeLocaleId`.

**Dependency footprint:** `@workspace/sanity/types/generated` (block types), `@workspace/sanity/types` (`SanityBlock`), `@workspace/ui` (`SectionWrapper`, `blockAttrs`, `cn`), `@/sanity/dataAttribute` (visual editing), `next/dynamic` for lazy/server-only blocks.

**Lift assessment: the mechanism ports verbatim; the inventory does not.** Port `dispatchBlocks.tsx`, `defineBlockRender.ts`, `registry.ts`'s typing pattern, `BlockRenderer.tsx`, `SectionShell`, and a handful of generic blocks (richText, image, video, cta, cardList, hero). Drop vtx-specific blocks (`productDiagramBlock`, `expertCardGridBlock`, `staticHtmlBlock`, `inlineFormBlock`/`formBlock` Marketo wiring, etc.). Keep `ClientBlockRenderer` + `clientComponents.ts` only if o3-sanity uses Sanity Presentation live editing (recommended — it is the reason the dual registries exist); `optimisticOrder.ts` is small and comes with it. Simplification option: if the base/section two-tier split (blocks inside layout columns) is more than o3-sanity needs, collapse to a single tier and delete `layoutSection`, `resolveColumnCount`, `panelComponents`.

### 1c. Conventions the system assumes (port these as rules, not code)

- **Schema-symmetric folders** (ADR 0041, `docs/adr/0041-schema-symmetric-react-structure.md`): `apps/web/src/content/{documents,objects,blocks/{base,section}}/` mirrors `packages/sanity/src/schemas/` — schema name === folder name. In vtx this parity is enforced by tests that o3-sanity drops, so either accept convention-by-discipline or port the parity check as a lint/CI script instead of a vitest suite.
- **Closed view-mode set** (View / Card / Teaser) with defaults in `documents/_defaults/` and lazy `next/dynamic` overrides in `registry.ts`.
- **`content/` vs `ui/` boundary**: imports `@workspace/sanity/types/generated` → lives in `content/`; otherwise `ui/`.
- **No leaf barrels**; `documents/index.ts` is the one deliberate aggregator.

---

## 2. Apps

Workspace globs (`pnpm-workspace.yaml`): `apps/*`, `packages/*`, `pipelines/*`, `functions`.

| App | Purpose | Verdict |
| --- | --- | --- |
| `apps/web` (`@vtx/web`) | Next.js 16 App Router frontend: Sanity wiring, localized routing, embedded `/studio` route, the component routing system (§1), site chrome in `src/ui/`. ~625 TS files, of which 166 tests + 16 Playwright e2e specs | **Adapt** — port the setup approach (App Router structure, `next-sanity` live/visual-editing wiring, the §1 routing system, portable-text map) and rebuild content types for o3. Drop all tests/e2e/benchmark dirs, `@workspace/pipeline-db` usage, i18n `(localized)` segment, and the 16 vtx document types' views |
| `apps/studio` (`@vtx/studio`) | Standalone Sanity Studio v6, deliberately thin: `sanity.config.ts` is ~25 lines calling `createStudioConfig()` from `packages/sanity-studio`; owns typegen + `schema:deploy` | **Port the shape** — thin app + shared studio-config factory + typegen is exactly the pattern to keep. Drop the 17 dated content migrations, seed scripts, Bynder plugin, e2e suite |
| `apps/storybook` (`@vtx/storybook`) | Storybook 10 host, near-empty by design; story globs come from `packages/story-kit` `storyRoots`, picking up stories in `packages/ui` and `apps/web` automatically; deployed static to Vercel behind basic auth | **Port** — read `.storybook/main.ts` verbatim first (React-dedupe aliasing, SanityImage stub alias, warning suppressions are hard-won). Drop `@storybook/addon-vitest` and `test`/`e2e`/`probe:cold`; keep `addon-docs`, `addon-a11y`, `addon-designs` |
| `apps/docs` (`@vtx/docs`) | Fumadocs internal docs site with a collector that mirrors every `CLAUDE.md`/`docs/` folder repo-wide | **Drop** — only pays off across ~30 workspaces |
| `apps/context` (`@vtx/context`) | TanStack Start migration-triage UI + CLI over a Neon registry (~831 files, largest workspace) | **Drop** — entirely vtx/migration |
| `apps/migration` (`@vtx/migration`) | Drupal-migration observability dashboard; already documented as retired | **Drop** |

## 3. Packages

### Port (generic, small)

| Package | Purpose | Note |
| --- | --- | --- |
| `packages/typescript-config` | Shared tsconfigs (`base`, `nextjs`, `storybook`) | Near-verbatim |
| `packages/eslint-config` | Shared flat-config base composed by root `eslint.config.mjs` | Strip `eslint-plugin-playwright` / `@vitest/eslint-plugin` blocks |
| `packages/tailwind-config` | CSS-first Tailwind v4 tokens: `theme.css` = 8 `@import`s of token files; apps do one import | Port the structure, swap the Vertex palette for o3 brand; drop token-guard tests, keep `tokens:dump` |
| `packages/env` | t3-env + Zod env validation (2 files) | Verbatim |
| `packages/site-auth` | One pure `checkBasicAuth` function for gating storybook/preview deploys | Verbatim, if previews are gated |
| `packages/story-kit` (half) | Story factories (`defineBlockStories`, `defineVariantStories`, knobs) + `storyRoots` single-source story globs + `fixtures pull` CLI | Port the factories + `storyRoots`; **drop** the block-catalog screenshot `catalog` CLI |
| `packages/ui` | shadcn-based component library: ~50 primitives + ~30 composed layout/content components; zero workspace deps, cleanly standalone | **Adapt** — cherry-pick what o3 designs need; drop the 42 test files |

### Adapt (the heart of the port — pattern yes, content no)

| Package | Purpose | Note |
| --- | --- | --- |
| `packages/sanity` | Shared Sanity core: schemas (26 doc types, ~50 objects, block factories with tier registry, 18 taxonomies), GROQ queries, generated types, client/image/url helpers, placeholders/presets | Port the architecture — `defineBlock`/`defineSectionBlock` factories, tier registry, query colocation, `sanity typegen` pipeline. Rebuild the doc types/taxonomies for o3 (buyingJourney/taxType/marketSegment are literally tax-domain). Drop `catalog`/compose-contract/style-inventory generators, `routing.ts` path materialization, `ai/` manifest. Beware: ~120 "tests" here encode schema invariants — dropping them loses those guardrails; accept, or convert 1–2 critical ones to lint scripts |
| `packages/sanity-studio` | Studio runtime split per ADR 0103: `createStudioConfig()` factory, desk structure, document actions, tools — both Studio hosts are ~20-line callers | Port the factory pattern. Drop AI translate actions, kitchen-sink corpus, Bynder, workflow plugin, role-provisioning, LLM eval scripts |
| `packages/sanity-ops` | `defineOp` + registry + runner + dataset-recorded ledger so one-off dataset ops run exactly once per dataset (20 files) | Optional port — nice idempotent-migration pattern if o3 expects dataset ops; otherwise drop |
| `packages/i18n` | Locale list + URL-prefix policy + proxy decision (9 files, zero deps) | **Drop** for single-locale o3-sanity; re-port later if multilingual |

### Drop — vtx/migration domain

`packages/migration-core` (Drupal→Sanity engine, 201 test files), `packages/pipeline-db` (Neon HTTP client for the migration warehouse), `packages/spine` (migration/issue domain kernel), `packages/registry` (Neon persistence/projection engine), `packages/queue` (graphile-worker job queue), `packages/design-lab` (Drupal-paragraph mockups), `packages/content-ai` (brand-voice AI authoring/translation — Vertex voice/glossary), `packages/sanity-comments` (robot Studio comments for the vtx agent loop).

### Drop — testing (per charter)

`packages/e2e` (shared Playwright workspace; also an upstream dep of migration-core), `packages/vitest-config` (root of the testing tree — 26 packages extend it), every `vitest.config.ts` / `playwright.config.ts` / `*.test.*` / `*.spec.*` (~1,100 test files repo-wide), `coverage`/`test-results`/`playwright-report` dirs, `@storybook/addon-vitest`.

### Drop — repo-meta/agent tooling

`packages/audit` (slash-command audit pipeline), `packages/agent-lint` (CLAUDE.md/skills linter), `packages/agent-telemetry` (agent-session Postgres telemetry), `packages/build-log` (build timelapse capture).

## 4. GitHub workflows (`.github/workflows/` + composite actions)

All workflows share the composite action `.github/actions/setup/action.yml` (node from `.nvmrc` → pnpm → store cache keyed on `pnpm-lock.yaml` → frozen install) — **port verbatim**. Also generic: `.github/actions/gh-deployment/` (GitHub Deployment records via raw `gh api`) and `.github/actions/vercel-alias-branch/` + `.github/branch-aliases.yml` (stable `<project>-<slug>.vercel.app` aliases).

| Workflow | What it does | Verdict |
| --- | --- | --- |
| `checks.yml` | PR/push gate; matrix `lint \| typecheck \| build \| test \| e2e` with turbo `--affected` + remote cache; smart `TURBO_SCM_BASE` resolution (PR base / `event.before` / full run) with an unresolvable-base fallback; `sanity-typegen` drift job; report-only perf `benchmark` job | **Adapt** — keep the affected/remote-cache/SCM-base plumbing and the typegen-drift job; cut the matrix to `lint \| typecheck \| build`; drop the `test` and `e2e` rows, Playwright install, shared-webserver boot, JUnit publishing, coverage matrix, and the benchmark job |
| `deploy.yml` | Push/PR deploy of `@vtx/web` via GitHub Actions-driven Vercel CLI (`vercel pull/build/deploy --prebuilt`); affected-gate on PRs; schema deploy on push; gh-deployment + branch alias; **no tests anywhere in it** | **Port** — this is the model workflow. Trim `sanity-ops deploy` (ledgered data ops) and the `main`→staging dataset mapping if o3-sanity uses a simpler env story |
| `promote.yml` | `workflow_dispatch`-only production promote: SemVer + draft-release guards → schema deploy → prod rebuild+deploy → publish release only after success | **Port** (trim the `sanity-ops` step). The "main is staging, production is a manual promote" model is worth keeping even for a small site — or simplify to prod-on-main if o3 wants fewer moving parts |
| `deploy-docs.yml`, `deploy-storybook.yml`, `deploy-context.yml` | Path-filtered per-app Vercel deploys; storybook/context use `--cwd apps/<app>` (load-bearing) ; context has a post-deploy `curl` smoke test with protection-bypass header | **Adapt** — keep `deploy-storybook.yml` as the template for the o3 Storybook deploy; steal the smoke-test step (the one "test" worth having in a no-test repo); drop docs/context instances |
| `deploy-blueprints.yml` | Deploys Sanity Functions via Blueprints (plan on PR, deploy on push); hardcoded stack id | **Drop** (only needed if o3-sanity adopts Sanity Functions; path materialization — its only consumer — is being dropped) |
| `cleanup-gh-deployments.yml` | Nightly prune of preview GitHub Deployments (keep newest N) | **Port** (edit the env-name list) |
| `cleanup-vercel-aliases.yml` | On branch delete, remove that branch's Vercel aliases | **Port** (edit the project list) |
| `docs-validate.yml` | Docs frontmatter validation + docs tests + report-only agent-lint | **Drop** (docs app not ported) |
| `nightly-storybook-probe.yml` | Cron probe for a Vite cold-cache hang | **Drop** (testing) |
| `dbt-run.yml` | Drupal→Postgres dlt extract + dbt build (migration analytics; Neon Postgres, not BigQuery) | **Drop** (vtx migration) |
| `vercel.json` (root) | `{ git: { deploymentEnabled: false } }` — turns off Vercel's own Git integration so Actions owns every deploy | **Port** — load-bearing for this whole CI model |

## 5. Root tooling

| Tool / file | What it does in vtx-web | Verdict |
| --- | --- | --- |
| `package.json` scripts | Core turbo passthroughs (`build`/`dev`/`lint`/`typecheck`/`format`/`check`); `verify` pre-push gate; `ci`; dep hygiene (`deps:check` syncpack, `knip`, `depgraph`); changesets `release`; plus ~25 vtx scripts (db/proxy/queue/pipeline/dataset/telemetry/coverage…) | **Adapt** — port the turbo passthroughs, `verify` (minus its `test` halves: `verify` becomes `turbo run lint typecheck build --affected`), `deps:check/fix`, `knip`, changesets, `prepare: lefthook install`. Drop every test/coverage script and all vtx infra scripts |
| `turbo.json` | `build`/`dev`/`lint`/`typecheck`/`format` + test/e2e/coverage/storybook tasks; `globalDependencies` on the tsconfig package; `$TURBO_ROOT$` inputs so root-config edits bust lint/format caches; Sanity env in `globalEnv` | **Port** the skeleton (`build`/`dev`/`lint`/`typecheck`/`format`/`build-storybook`) incl. the `$TURBO_ROOT$` input trick and remote-cache setup; delete test/e2e/coverage tasks |
| `lefthook.yml` | pre-commit: eslint, prettier (`stage_fixed`), typecheck `--affected`, sanity-typegen regen on schema edits, agent-lint, plus vtx hooks (dbt mappings seed, docs links); pre-push: `verify` with `TURBO_SCM_BASE=origin/develop`; prepare-commit-msg attribution strip | **Port** — keep lint/format/typecheck/typegen hooks and the pre-push `verify`; drop `mappings-seed` and `docs-link-extensions` |
| `.syncpackrc.json` | versionGroups: workspace packages pinned `workspace:*`; peerDeps ignored; a vtx TanStack-nightly exemption | **Port** groups 1–2, drop the exemption |
| `knip.json` | Unused file/dep/export detection with per-workspace entry globs (many exist to whitelist test/story/e2e entries) | **Port**, rewritten small — a 3-workspace repo needs a fraction of the entries |
| `eslint.config.mjs` (root) + `packages/eslint-config` | Flat config composing shared config + `eslint-config-next` scoped to `apps/web/**` (avoids plugin-redefinition clash — keep that gotcha); domain rule blocks (Storybook studio-import ban, design-lab guardrails, SanityImage boundary) | **Adapt** — port the composition structure and the Storybook studio-import ban + SanityImage-boundary ideas; drop design-lab rules and `@vitest`/`playwright` eslint plugins |
| `tsconfig.json` (root) + `packages/typescript-config` | 9-line root extending shared `base.json`, strict | **Port** |
| `.prettierrc` | no-semi, single-quote, width 100, tailwind plugin | **Port** |
| `.dependency-cruiser.cjs` | Layering rules: `packages-not-to-apps`, `ui-not-to-app`, `no-circular` (warn) | **Adapt** (nice guardrail; rewrite paths) or drop for simplicity |
| Changesets (`.changeset/config.json`, `changeset-check.sh`) | Release/versioning with changelog-github; soft pre-push nag | **Port** if o3-sanity wants versioned releases; otherwise drop |
| `agent-lint.config.ts` + `packages/agent-lint` | Reference-integrity linter for CLAUDE.md/skills | **Drop** (agent-tooling investment a small repo doesn't need; revisit later) |
| `scripts/` (~44 entries) | Mixed: generic release/changeset/install-drift helpers with colocated `node --test` tests; vtx db/proxy/queue/dataset/coverage scripts | **Adapt** — cherry-pick `check-install-drift.mjs`, `changeset-*`, `release`; drop the rest and all `*.test.mjs` |

## 6. Other root directories

| Path | Contents | Verdict |
| --- | --- | --- |
| `pipelines/dbt/` | Python dlt Drupal extract + dbt models (migration gap analysis) | **Drop** |
| `functions/` | Two Sanity Functions (`materialize-paths`, `materialize-draft-paths`) | **Drop** (path materialization not ported) |
| `infra/telemetry/` | Self-hosted SigNoz/ClickHouse for agent-run observability | **Drop** |
| `statics/` | Vendored legacy HTML/JS widgets | **Drop** |
| `sanity.blueprint.ts` | Blueprints stack for the two Functions | **Drop** |
| `docker-compose.yml` | Local Postgres + Neon HTTP proxy for the migration pipeline | **Drop** |

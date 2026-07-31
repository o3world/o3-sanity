# Repo scaffold plan

Resolves wayfinder ticket #8. This is the work order for ticket #10 (Scaffold the repo). Inputs: vtx-web port inventory (#2), schema spec (`docs/specs/schema.md`), routing contract (ADR 0001), content model (`CONTEXT.md`).

## Workspace layout

```
apps/
  web         # Next.js site + embedded Sanity Studio at /studio (next-sanity pattern)
  storybook   # Storybook host; stories discovered via story-kit storyRoots
packages/
  sanity             # schemas, GROQ queries, generated types, client/image helpers,
                     # sanity.cli.ts — owns `typegen` and `schema:deploy`
  ui                 # shadcn base + o3 primitives/organisms (zero Sanity deps)
  tailwind-config    # CSS-first Tailwind v4 tokens extracted from prototype/
  typescript-config  # shared tsconfigs (base, nextjs, storybook)
  eslint-config      # shared flat config
  env                # t3-env + Zod validation
  story-kit          # story factories + storyRoots + fixtures CLI (no catalog CLI)
  site-auth          # checkBasicAuth for storybook/preview gating
```

**No `apps/studio`, no `sanity-studio` package.** The studio is embedded-only: every deploy (production, staging alias, PR preview) carries its own same-origin studio at `/studio`, which is what makes Presentation live-editing work on unpredictable preview URLs. Sanity CORS: wildcard `https://o3-web-*.vercel.app` + production domain.

## Sanity

- Project `naorcr6k`. Datasets: **`production`** (live; extract→translate→review writes unpublished drafts here — editors review in the real studio) and **`development`** (pipeline dry-runs, schema experiments). No staging dataset. Switching is by env var only.
- Local dev reads `production` with a read token.
- `sanity typegen` output in `packages/sanity` is the compile-time contract (ADR 0001); a CI drift job fails if generated types are stale.

## Branch & deploy model

- **`main` is the only long-lived branch.** PRs → affected-gated preview deploys with stable branch aliases (`o3-web-<slug>.vercel.app`).
- **Push to `main`** → staging alias (`o3-web-staging.vercel.app`) + `schema:deploy`.
- **Production = manual promote** (`promote.yml`, workflow_dispatch + SHA). Auto-creates a GitHub release (date+SHA, commit-derived notes). **No Changesets.**
- Two Vercel projects: `o3-web`, `o3-storybook`. Root `vercel.json`: `{ git: { deploymentEnabled: false } }` — GitHub Actions owns every deploy.

## CI (ported from vtx-web, tests removed)

- `.github/actions/setup` (node from `.nvmrc` → pnpm → store cache → frozen install), `gh-deployment`, `vercel-alias-branch` + `branch-aliases.yml` — near-verbatim.
- `checks.yml` — matrix `lint | typecheck | build`; turbo `--affected` + remote cache (`TURBO_TOKEN`/`TURBO_TEAM`); the `TURBO_SCM_BASE` resolution + unresolvable-base fallback; `sanity-typegen` drift job. No test/e2e/benchmark legs.
- `deploy.yml` — web deploy on PR (affected-gated) and main push; `schema:deploy` on push; gh-deployment records + branch alias.
- `deploy-storybook.yml` — path-filtered, `--cwd apps/storybook` (load-bearing), basic-auth gated, **post-deploy curl smoke check** (the one "test" this repo keeps).
- `promote.yml` — simplified per above.
- `cleanup-gh-deployments.yml`, `cleanup-vercel-aliases.yml` — env/project lists edited.

## Root tooling

- pnpm 10 / Node 22 (`.nvmrc`). turbo (`build/dev/lint/typecheck/format/build-storybook`, `$TURBO_ROOT$` input trick, `globalDependencies` on typescript-config).
- lefthook: pre-commit eslint + prettier (`stage_fixed`) + typecheck `--affected` + typegen-on-schema-edit; pre-push `verify` = `turbo run lint typecheck build --affected` with `TURBO_SCM_BASE=origin/main`.
- syncpack (workspace-pin + peer-ignore groups), knip (small entry list), prettier (vtx settings), root tsconfig extending `typescript-config/base`.
- ESLint: shared config + `eslint-config-next` scoped to `apps/web/**` (plugin-redefinition gotcha); keep the Storybook studio-import ban and SanityImage-boundary rule ideas; no test plugins.
- Scripts kept: `check-install-drift.mjs` only. No db/proxy/queue/coverage/dataset scripts.

## Env vars

| Var | Where |
| --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` = `naorcr6k` | all |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` default; `development` for dry-runs |
| `SANITY_API_READ_TOKEN` | web (server), local dev |
| `SANITY_API_WRITE_TOKEN` | pipeline only |
| `SANITY_DEPLOY_TOKEN` | CI (`schema:deploy`) |
| `SANITY_REVALIDATE_SECRET` | web ↔ revalidate webhook |
| `NEXT_PUBLIC_BASE_URL` | web |
| `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` / `VERCEL_STORYBOOK_PROJECT_ID` | CI |
| `TURBO_TOKEN` (secret) + `TURBO_TEAM` (var) | CI remote cache |
| `SITE_AUTH_USER` / `SITE_AUTH_PASS` | storybook gating |

## Scaffold sequence (ticket #10)

1. Root: pnpm workspace + turbo + lefthook + syncpack + knip + prettier + tsconfig + eslint + `.nvmrc` + `vercel.json`.
2. `packages/typescript-config`, `eslint-config`, `env` — port near-verbatim, rescope to `@o3/*`.
3. `packages/tailwind-config` — port structure, tokens from `prototype/` (see design-language notes in CONTEXT.md).
4. `apps/web` — create-next-app + next-sanity embedded studio; port the routing system per ADR 0001 (types.ts + define.ts near-verbatim; build.tsx minus i18n/materialization); `/api/revalidate` + cacheTags.
5. `packages/sanity` — implement `docs/specs/schema.md` with the ported factories; `sanity.cli.ts`; typegen wired; `schema:deploy` to `naorcr6k`.
6. `packages/ui` + `story-kit` + `apps/storybook` — port storybook `main.ts` verbatim-first; shadcn init; SectionShell + first primitives.
7. `packages/site-auth`; CI workflows + composite actions; create Vercel projects; set secrets.
8. **Done when:** `pnpm dev` runs web+studio locally against `production`; a PR shows green `checks.yml` and a preview deploy with working `/studio`.

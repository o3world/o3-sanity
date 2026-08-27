# Ops

Standing rules about the Sanity project's shape, and the commands that do the
routine jobs. Read the rules before touching anything in sanity.io/manage or
running a `datasets` CLI command.

## Datasets: never create, never delete

**An agent does not create or delete datasets.** Not to make room, not to run a
clean experiment, not to tidy up. Ask, and let a human do it.

The rule exists because deleting one is unrecoverable here: restoring from a
backup is an Enterprise feature and requires backups to have been enabled
_before_ the deletion, which they are not on this project. There is no undo
beyond contacting Sanity Support. The rebuild path (below) restores
pipeline-owned content, but anything hand-authored straight into a dataset —
Studio experiments, manual test documents — is gone with it.

This was learned the hard way on 2026-08-15 (#144): `development` was deleted
to fit a dataset cap it was never over, on an assumption nobody checked.

### The project's datasets, and what counts

| Dataset               | Visibility                             | Counts toward the plan limit? |
| --------------------- | -------------------------------------- | ----------------------------- |
| `production`          | public                                 | yes                           |
| `development`         | private (public once the trial lapses) | yes                           |
| `production-comments` | private                                | **no — it is an add-on**      |

**Add-on datasets are complimentary and do not count toward the plan's dataset
limit** ([Sanity docs](https://www.sanity.io/docs/content-lake/datasets)).
Comments and Tasks each create one automatically, paired to the dataset they
serve. `production-comments` is the Comments add-on: it holds Studio comment
threads, not content, and it is not a dataset anyone should be counting,
switching to, or clearing.

So the countable total here is **two**, which is the Free-tier cap — not three.

Two more facts worth holding:

- **Private reverts to public when a trial ends.** `development` is private
  today only because the project is mid-trial. Do not put anything in a Sanity
  dataset that would embarrass you in public.
- **`production` is already public** and always has been. "The dataset is
  private" has never been true of the live one.

## Production holds user content now (2026-08-27)

Editors author in `production`. The build-out rule — committed JSON is the
source of truth and the dataset is disposable (ADR 0003) — now stops at
`development`; in `production`, what an editor wrote outranks what the corpus
says. Four mechanisms hold that line:

```bash
pnpm dataset:backup     # export production → ~/.o3-sanity/backups/production-<stamp>.tar.gz
pnpm dataset:sync       # that backup, then import into development with --replace
pnpm dataset:drift      # which pipeline-owned documents an editor changed (exit 1 on drift)
```

- **`load` refuses `production`.** Without `--allow-production` it prints a
  refusal and exits — a load deletes and recreates every unlocked
  pipeline-owned document and clears any draft shadowing one, which now means
  destroying editors' work. Run `dataset:drift` and `dataset:backup` before
  passing the flag, and expect the drifted documents to be locked, not
  overwritten.
- **`dataset:sync` never deletes.** `--replace` overwrites a document that
  exists in both datasets with production's copy and leaves
  development-only documents (briefs, experiments) alone. It creates and drops
  no dataset, so the never-create-never-delete rule above is untouched.
- **A nightly backup exists** (`nightly-dataset-backup.yml`): full export of
  `production`, kept as a workflow artifact for 90 days. It is the only backup
  this plan has — restore is `sanity dataset import <tarball> <dataset>
--replace` from `tools/migration`.
- **A drifted document gets locked, not reloaded.**
  `pnpm --filter @o3/migration drift -- --lock` stamps `migration.locked` on
  every drifted document, and `load` skips a locked document in any mode
  (ADR 0003). To hand one back to the pipeline: port the edit into
  `tools/migration/data/`, then unset the lock.

## Rebuilding a dataset from scratch

The pipeline owns its documents and the committed JSON under
`tools/migration/data/` is the source of truth (ADR 0003), so a rebuild is
ordinary work rather than a recovery operation. `load` recreates every unlocked
pipeline-owned document; a `migration.locked` document is never touched.

```bash
pnpm dataset development                 # point THIS CHECKOUT at the scratch dataset
pnpm --filter @o3/migration load         # data/{converted,translated,seed}/ → Sanity
pnpm --filter @o3/migration verify       # is the dataset what data/ says it is?
```

`pnpm dataset` with no argument prints which dataset each entry point is
pointed at. It rewrites four gitignored `.env.local` files at once — web app,
typegen, migration, guidance — because the loader resolves its dataset
independently of the web app, and the two silently disagreeing is what once
sent every load to production.

The full pipeline, when the source data itself needs rebuilding:

```bash
pnpm --filter @o3/migration extract      # WordPress → data/extract/
pnpm --filter @o3/migration convert      # → data/converted/ (Portable Text, refs)
pnpm --filter @o3/migration load
pnpm --filter @o3/migration verify
```

**Then look at it in a browser.** A load that succeeds against the wrong
dataset looks exactly like one that worked.

## Everyday commands

```bash
pnpm frontier                 # READY / BLOCKED / CLAIMED across every open map
pnpm frontier 63              # one map
pnpm wt new <n>               # claim a ticket, branch it, worktree it, install

pnpm dataset:backup           # export production to a local tarball
pnpm dataset:sync             # production → development (backup first, no deletes)
pnpm dataset:drift            # what an editor changed that the next load would revert

pnpm dev:web                  # the o3 site
pnpm dev:o3xo                 # the o3xo site (its own port pool, its own project)
pnpm storybook                # the component library
pnpm down                     # stop what dev started

pnpm check                    # lint + typecheck, affected packages only
pnpm test                     # the full suite (checkpoint, not a loop)
pnpm vr                       # pixel diff against the merge base
pnpm typegen                  # schema.json + generated types, after a schema edit

pnpm brief:sync               # brief markdown → brief documents
pnpm brief:check              # fails if a file-backed brief drifted
pnpm brief:export             # a dataset-born brief becomes a file in the repo
pnpm schema:deploy            # deploy this brand's roster so get_schema sees it
pnpm schema:check             # fails if the deployed schema drifted (a CI gate — see below)
pnpm figma:sync               # what changed in the design file since last sync
pnpm skill:lint               # validate the o3sanity plugin's five skill files
pnpm env:pull                 # restore apps/web/.env.local from Vercel
```

## Deployments: two apps, two Vercel projects, one repo

Both brands deploy from this repository, each from its own Vercel project on the
`o3-world` team, so an O3XO deploy never costs an O3 build (#216, spec #209).

| Project               | Root directory | Branch that is production | What triggers a build                            | What gates it                                                          |
| --------------------- | -------------- | ------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `o3-sanity-web`       | `apps/web`     | `main`                    | `deploy.yml` / `promote.yml` — no Git connection | the `affected` job: `turbo run build --filter=@o3/web... --affected`   |
| `xo-sanity-web`       | `apps/o3xo`    | `integration/o3xo`        | Vercel's GitHub integration, on every push       | Ignored Build Step: `pnpm dlx turbo-ignore @o3/o3xo --fallback=HEAD^1` |
| `o3-sanity-storybook` | repo root      | `main`                    | `deploy-storybook.yml`                           | —                                                                      |

The repo-root `vercel.json` turns Git deployments off. It is the configuration
file for whatever is rooted at the repo root — the Storybook project — and not
for either app project, because Vercel reads a project's `vercel.json` from its
root directory.

The two gates are the same question asked by the same engine — is this app's
dependency graph in the diff — so the matrix holds in both directions:

| The change                     | `xo-sanity-web` | `o3-sanity-web` |
| ------------------------------ | --------------- | --------------- |
| `apps/o3xo` only               | builds          | skipped         |
| `apps/web` only                | skipped         | builds          |
| a shared package (`@o3/ui`, …) | builds          | builds          |

`xo-sanity-web` holds **no environment variables**, deliberately. O3XO's brand
facts are committed (`@o3/sanity/brand`: project `tunpgire`, dataset
`production`), and that dataset answers an unauthenticated read, so published
content renders with nothing configured. A `SANITY_API_READ_TOKEN` buys draft
preview and Presentation, and a `SANITY_REVALIDATE_SECRET` buys the Sanity
webhook — neither exists yet, and the revalidate route answers 401 without the
secret rather than trusting an unsigned POST.

Its deployment origins are CORS-allowed on `tunpgire` with credentials —
`https://xo-sanity-web.vercel.app`, `https://xo-sanity-web-*.vercel.app` for the
team and branch aliases, and `https://*o3-world.vercel.app` for per-deployment
URLs. Without them the embedded Studio and every draft read fail on the
deployment while working perfectly in dev. Add an origin from `apps/o3xo/`,
where the CLI config points at O3XO's project:

```bash
pnpm sanity cors add https://<host> --credentials
```

Two things to know before touching either project:

- **A push to `main` cannot build `xo-sanity-web`.** `apps/o3xo` does not exist
  on `main` — this map integrates on `integration/o3xo` — so a build from `main`
  fails at "the specified Root Directory does not exist" before the Ignored
  Build Step runs. Vercel's own affected-projects skipping is on for the project
  and may skip the push before it gets that far; if failed `main` deployments
  show up in the dashboard, turn the project's Git deployments off until
  `apps/o3xo` lands on `main`.
- **`turbo-ignore` prints a deprecation notice** pointing at Vercel's built-in
  project skipping. It still works, and it is what the two gates share; moving
  `xo-sanity-web` to the built-in mechanism would leave the CI-driven `o3` gate
  as the odd one out, so both stay on turbo until someone decides otherwise.

## `schema:check` is a gate, not a chore

Production keeps itself honest. Every push to main deploys the schema and then
runs `pnpm schema:check` against `production`, and the deploy job fails if the
two disagree — a `schema:deploy` can exit 0 without landing, or land against
the wrong workspace. `promote.yml` asserts the same thing for the SHA it
promotes, because that SHA is hand-picked and may be older than main. Pushes
to `integration/o3xo` do the same for O3XO's project (`deploy-xo-web.yml`),
ahead of kicking the site build.

What a deploy publishes is **this brand's roster**, not the whole model
(#252): `NEXT_PUBLIC_BRAND` picks the project and the blocks its schema
declares, so a schema-driven writer — `get_schema`, the typeset skill — is
never offered a band the brand's app cannot render. The check fails on any
schema document in the dataset that the deploy did not write, so a whole-model
deploy from an old checkout cannot sit beside the brand's quietly. A
scheduled run at 05:00 UTC (`nightly-schema-drift.yml`) catches what neither
sees: a hand-run deploy pointed at the wrong dataset, a Studio-side edit, a
push whose deploy job was cancelled. It files one tracking issue against map
#63, re-comments on it each night the drift lasts, and closes it on the first
clean run.

So typing `pnpm schema:check` at a production checkout proves only what the
last deploy job already proved. Where it is worth typing is a **local dataset**:
nothing deploys a schema to `development` and nothing checks it, so that drift
is yours to see, and yours after `pnpm dataset development` and a schema edit.

No PR is gated on the state of a dataset. A branch that edits a schema is meant
to be ahead of the deployed one until it merges.

## When a build fails on a missing dataset

```
Error: Sanity dataset "development" cannot be read without SANITY_API_READ_TOKEN.
```

The checkout is pointed at a dataset it cannot read — usually one that no
longer exists, or a private one with no token. Either `pnpm dataset production`
to use the public dataset, or `pnpm env:pull` for a token. Do not "fix" it by
creating a dataset.

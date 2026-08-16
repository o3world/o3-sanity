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

pnpm dev:web                  # the site
pnpm storybook                # the component library
pnpm down                     # stop what dev started

pnpm check                    # lint + typecheck, affected packages only
pnpm test                     # the full suite (checkpoint, not a loop)
pnpm vr                       # pixel diff against the merge base
pnpm typegen                  # schema.json + generated types, after a schema edit

pnpm guidance:sync            # voice corpus → guidance documents
pnpm guidance:check           # fails if the dataset drifted from the repo
pnpm brief:sync               # brief markdown → brief documents
pnpm brief:check              # fails if a file-backed brief drifted
pnpm schema:deploy            # deploy the schema so get_schema sees it
pnpm schema:check             # fails if the deployed schema drifted from the repo
pnpm figma:sync               # what changed in the design file since last sync
pnpm skill:wire               # wire Claude Desktop for the authoring skill
pnpm env:pull                 # restore apps/web/.env.local from Vercel
```

## When a build fails on a missing dataset

```
Error: Sanity dataset "development" cannot be read without SANITY_API_READ_TOKEN.
```

The checkout is pointed at a dataset it cannot read — usually one that no
longer exists, or a private one with no token. Either `pnpm dataset production`
to use the public dataset, or `pnpm env:pull` for a token. Do not "fix" it by
creating a dataset.

# @o3/o3xo

The O3XO site (o3xo.ai, eventually): Next.js App Router with the embedded Sanity
Studio at `/studio`, on O3XO's own Sanity project.

It is a **near-clone of `apps/web`** on purpose. The first step of the O3XO epic
is an adaptation experiment ([ADR 0028](../../docs/adr/0028-o3xo-is-a-second-app-in-the-monorepo.md)
addendum): same block roster, same chrome, O3's composition, diverging only in
Sanity project and token package. The question the experiment answers is whether
O3's design carries O3XO better than a rebuild of the O3XO UI kit would — so a
divergence here has to be argued, not assumed.

## Running it

```sh
pnpm dev:o3xo
```

The port comes from `XO_WEB_PORT` in the repo-root `.env`, allocated per worktree
from the 3700–3709 pool (`scripts/worktree-provision.sh`). Every port in that
pool already has a CORS origin on the O3XO project; a port from outside it will
load the page and fail every Sanity read.

No `.env.local` is needed to render published content: O3XO's `production`
dataset reads anonymously. A read token only becomes necessary for draft preview,
and goes in `apps/o3xo/.env.local` as `SANITY_API_READ_TOKEN` — provisioning
carries that file across worktrees the same way it carries `apps/web`'s.

## Where it deploys

The Vercel project is **`xo-sanity-web`** (team `o3-world`), rooted at this
directory, with `integration/o3xo` as its production branch:
[xo-sanity-web.vercel.app](https://xo-sanity-web.vercel.app). Every push to the
repository is offered to it and turned away unless this app's dependency graph
changed, which is what keeps an `apps/web` commit from costing an O3XO build.
Both projects' settings, the gate each one uses and the CORS origins that make
the deployed Studio work are in
[`docs/agents/ops.md`](../../docs/agents/ops.md) → Deployments.

## The brand is set in `next.config.ts`

`NEXT_PUBLIC_BRAND=o3xo` is what makes `@o3/sanity` resolve the O3XO project,
the O3XO dataset and `/case-studies` instead of `/work`. Unset, it resolves
**`o3`** — a real brand with a real project behind it — so the app would boot,
render, and quietly serve o3world.com's content in O3XO's paint. Four files hold
it up, and none of them is an env file a worktree can lose:

| Where                    | What it does                                       |
| ------------------------ | -------------------------------------------------- |
| `brand.ts`               | the one literal, typed as `Brand`                  |
| `next.config.ts` → `env` | puts it in every bundle, dev and build             |
| `src/env.ts`             | throws at boot if it did not arrive                |
| `sanity.cli.ts`          | asks brand config by name — the CLI has no bundler |

`XO_SANITY_PROJECT_ID` and `XO_SANITY_DATASET` override the project and dataset
for this brand only; o3's `NEXT_PUBLIC_SANITY_*` are untouched by either app.

## Tokens

`src/app/globals.css` imports the base theme **then** `@o3/tailwind-config-o3xo`,
and the root layout sets `data-brand="o3xo"` on `<html>`. The O3XO package is a
layer over the base theme, not a standalone one — it re-points the base theme's
custom properties under `:root[data-brand='o3xo']` and declares nothing new
except `accent`. Drop the attribute and every page renders in O3's paint with no
error anywhere.

Both `@source` lines matter too: Tailwind v4 does not follow into sibling
workspace packages, so without them no utility used inside `@o3/ui` or
`@o3/content-ui` is emitted and the shared components render unstyled.

## What lives here and what does not

The block renderers, the site chrome and the cards are `@o3/content-ui`; the
route builders and the dispatch loop are `@o3/content-runtime`. Both apps import
them. What this app keeps is its **binding**: `src/content/blocks/` (its own
registry, compile-checked against its own roster), `src/content/documents/`
(route entries and document views) and `src/app/` (the routes). That duplication
is the point — the day O3XO adapts one block, it re-points one line in
`clientComponents.ts` and the o3 app does not move.

Differences from `apps/web` beyond project and tokens, each one deliberate:

- **No WordPress redirect map.** `next.config.ts` has no `redirects()` and the
  sitemap has no redirect filter — that table is O3's. o3xo.ai's own redirect
  audit is the launch-cutover work.
- **`/case-studies`, not `/work`**, with "Case studies" as the display name.
  Both come from brand config; nothing here writes either as a literal.
- **The collection indexes carry placeholder copy** and are marked provisional on
  their route entries. They have no document, so their hero copy lives in the
  view, and O3's lines describe O3's practice. The insights index also leaves out
  the closing CTA band: its copy and its `/contact` destination are O3 facts, and
  this app has neither yet.
- **No stories.** Storybook stays a single host with the Brand toolbar as the
  paint-leak test until O3XO has a genuinely divergent component.

## The seed

`seed/` is a bootstrap, not a corpus: a homepage and a `siteSettings` document,
enough for the dev server to render something in O3XO's paint and for an editor
to open the Studio on a real page.

```sh
pnpm --filter @o3/o3xo seed
```

Both documents are marked `provisional` with a note saying so, and both carry the
pipeline's deterministic ids (`page-seed-index`, `siteSettings`). Real O3XO
content arrives through the migration pipeline's second extract source (#217,
#218), which also owns teaching `verify` about this dataset — until it does,
`verify` knows nothing about `tunpgire` and would report every document in it as
an orphan.

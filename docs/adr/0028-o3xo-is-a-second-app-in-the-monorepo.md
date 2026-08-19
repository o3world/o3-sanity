# 0028. O3XO is a second app in the monorepo

- **Status:** Accepted; first-step sequencing amended 2026-08-19 (see Addendum); the experiment superseded by kit parity later the same day (see second Addendum)
- **Date:** 2026-08-19
- **Deciders:** NickO3 + Claude
- **Related:** [ADR 0008](./0008-shadcn-anatomy-not-theme.md), `CONTEXT.md` → Brands,
  `packages/sanity/src/schemas/blocks/registry.ts`, `apps/web/src/lib/content-routes/build.tsx`

## Context

O3 is shipping a second site: O3XO, a brand property with its own design
(the _O3XO: UI kit_ Figma file), its own content, its own editors — and
the same routing shapes, block pipeline, and knob system as o3world.com.

Two ways to ship it: fork this repo, or add a second app to it. A fork
duplicates the machinery both sites need — the route builders (already a
port from vtx-web once; a port is a fork paid by hand), block dispatch,
the knob system, editor chrome — and every later fix becomes a
cherry-pick. The separate-repo models that share packages either suck
(submodules, cross-checkout links) or demand publish-and-bump ceremony
that only makes sense once the shared interfaces stop moving, which is
exactly not now.

A Storybook probe settled the mechanism question: the theme layer is CSS
custom properties end to end, so one attribute (`data-brand`) reskins
every token-reading component with zero component changes. It also drew
the limit: tokens carry surfaces, text, and borders — the quiet half of a
brand. O3XO's identity (starfield imagery, yellow card families, a
dropdown nav) lives in components the O3 blocks don't have.

## Decision

**O3XO ships as `apps/o3xo` in this monorepo, on its own Sanity project,
sharing the content model and diverging at three declared points: the
block roster, the token package, and the site chrome.**

- **One canonical identifier: `o3xo`**, never a bare `xo`. Everything
  stays in the `@o3/*` scope — O3XO is an O3 property, not a peer org.
- **Separate Sanity project** in the O3 organization, with its own
  members and authors; `production` / `development` datasets mirror O3's.
  `packages/sanity/src/constants.ts` stops hardcoding one project and
  resolves per app from env.
- **Shared schema, per-brand rosters.** Documents, shared objects, the
  knob system, and routing are one model with one typegen. The section
  roster splits into a core list plus per-brand extensions; each project
  deploys core + its own, and each app's `BLOCK_REGISTRY` is
  compile-checked against its own roster — so an O3XO-only block never
  forces a renderer into the O3 app.
- **Surface names are roles.** `white | bone | ink` are stored values
  naming band roles; each brand's token package paints them. No value
  rename, no per-brand option lists.
- **Per-brand token packages.** `packages/tailwind-config` stays O3's;
  O3XO gets a sibling read off the UI kit. Their vocabularies may
  diverge (O3XO has accent roles O3 lacks); shared `packages/ui`
  components may only use roles both packages define.
- **Two Storybook hosts, when the second is earned.** Thin shells over a
  story-kit config builder, each defaulting to its brand's tokens. The
  Brand toolbar from the probe survives on the shared-primitives stories
  as the standing paint-leak test. Until `apps/o3xo` has a real
  component, the one host with the toolbar is the whole story.

## Consequences

- Machinery extraction happens when O3XO first imports it, not before:
  route builders and block dispatch leave `apps/web/src` for a shared
  package with O3XO as the second consumer.
- A schema change is now a cross-brand change. The shared roster's CI
  check failing the _other_ app's build is the seam working, not a bug.
- Deployment is two Vercel projects off one repo, each rooted at its app
  with `turbo-ignore`; env vars live per project.
- `pnpm vr` and `figma-sync` are single-brand today (one Storybook path,
  one tracked file); each needs a per-brand parameter when O3XO reaches
  it.
- The exit ramp if O3XO ever needs its own repo (separate team or access
  control): the shared packages will have stable interfaces by then, and
  publish-with-changesets extraction is mechanical. Nothing about this
  decision forecloses it.

## Addendum (2026-08-19): the first step is an adaptation experiment

The divergence points above are where the brands _may_ split, not a
build order. The first step splits the apps with **minimal difference
between them**: `apps/o3xo` is a near-clone of `apps/web` — same block
roster, same chrome, O3's composition — differing only in its Sanity
project and its token package, which carries the XO values (the
Storybook probe's `brand-xo.css` is the starting point). O3XO's live
content (o3xo.ai: 41 insights, the case studies, the industry pages)
migrates into O3's content model, and the result is evaluated against
the Framer site.

The hypothesis: O3's design is the stronger system, and O3XO lands
better as an adaptation of it than as a rebuild of the UI kit. Until
that evaluation, the _O3XO: UI kit_ file is the source of **brand
values** (tokens, logo, copy) rather than of composition; roster and
chrome divergence are deferred, and each UI-kit component must earn its
way in against the delta the experiment shows. The near-clone imports
the shared machinery rather than copying it — a copied route builder is
the fork this ADR rejected, one directory closer.

## Second addendum (2026-08-19): kit parity supersedes the experiment

The near-clone shipped, o3xo.ai's content migrated into it, and the
result was reviewed. The hypothesis is rejected: O3XO is a
different-looking site, and its goal is **parity with the O3XO UI kit's
design** — composition included, not just brand values.

- **The kit is o3xo's design source of record.** Where it contradicts
  itself or is silent — much of it is an HTML import of the live Framer
  site, and no interaction states are drawn anywhere — the live
  o3xo.ai rendering wins, kit corrections go to Nick, and interaction
  states are invented from O3XO's tokens.
- **#224 narrows** from a gate each kit component must earn its way
  through to a page-by-page parity audit that produces the build list.
- **New o3xo components land app-first** in `apps/o3xo/src`. Promotion
  into `packages/{ui,content-ui}` happens when o3 becomes a second
  consumer — the rule this ADR already applies to machinery. An
  app-local component may use brand-only token roles (`accent`); the
  seam tests keep guarding whatever stays shared.
- **The site chrome forks per app** when the o3xo nav/footer work is
  picked up, not preemptively. The `brandMark` slot (#228) remains the
  shared chrome's contract for as long as a brand uses it.
- **The content model does not move.** Documents, shared objects, the
  knob system, and routing stay one model with one typegen — the core
  decision above. Section-block sharing is aspirational; content-model
  sharing is required. A fork of the model itself is this ADR's exit
  ramp (a separate repo), never an in-repo state.

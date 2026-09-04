# 0004. Add a three-layer test suite, run as a checkpoint

- **Status:** Accepted
- **Date:** 2026-07-31
- **Deciders:** NickO3 + Claude
- **Related:** [issue #25](https://github.com/o3world/o3-sanity/issues/25) (supersedes working agreement 5), [ADR 0002](0002-plain-scripts-live-extraction.md), [ADR 0003](0003-disposable-dataset-migration-lock.md)

## Context

Issue #25's working agreement 5 recorded "verification is layered, not test-suite-based": compile-time (typegen → registries), pipeline-time (fail-loud + zod), render-time (build green + preview smoke + Storybook), human-time (JSON diffs in PRs). That held while the scaffold was the whole product.

Two things changed. The content tickets ahead (#17's 272 perspectives, #18, #21→#22's 20 case studies, #20/#23's wireframe seeds) move the work from "does it compile" to "does this content actually display, and does the adaptation match the wireframe" — questions no existing layer answers. And the repo is explicitly a portfolio artifact shown to prospective clients, so the bar is craft, not just green.

Building the suite immediately found three defects the existing layers could not have caught, which is the strongest argument for it:

1. **`convert` was not reproducible.** `htmlToBlocks` assigns random `_key`s, so every run rewrote every block key in the committed JSON. ADR 0003's "wipe and rebuild reproduces the dataset from git" could not hold, and golden-file testing of a mapper was impossible. Fixed with a counter-based `keyGenerator`.
2. **`addKeys` was dead code.** It prepended `_key` then spread the block over it, so block-tools' key always won. The committed JSON proves it never took effect.
3. **Views rendered blank outside Next.** The document registry loads each View through `next/dynamic`; with no loadable manifest it resolves to nothing, silently.

## Decision

Three layers, one runner (Vitest), one config (`vitest.config.mts`) declaring three named projects. The file-name suffix says which layer a test is in:

| Layer     | Files               | Answers                                                                                                                   |
| --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `unit`    | `*.test.ts`         | Do the pure functions hold? Migration mappers, route/lib helpers, and invariants over the committed migration corpus.     |
| `render`  | `*.render.test.tsx` | Does this content display? A route or document rendered to HTML from fixture data, no network.                            |
| `stories` | `*.stories.tsx`     | Does this component look and behave right? Every story mounted in real headless Chromium with real CSS, plus an axe scan. |

Supporting decisions:

- **The suite is a checkpoint, not a loop.** No lefthook hook; `pnpm verify` is unchanged. CI runs the whole suite as its own job. Agents run `pnpm test` at milestones (before opening a PR, after a migration batch), not after every edit. A `--changed` variant was tried and removed: it resolved to "No test files found, exiting with code 0", so the job passed without running anything — a check that cannot fail is worse than no check.
- **No pixel-diff visual regression.** Baselines churn constantly during an active redesign and drift across platforms, and they answer "did this change" rather than "is this right". Real-browser rendering plus axe gives the layout signal without a baseline to maintain; wireframe fidelity stays a human judgement in Storybook, next to the `addon-designs` frame.
- **Structural a11y is enforced; contrast is not, yet.** All 12 current violations are `color-contrast` from muted foreground tokens (e.g. `#9a9a98` on white is 2.81:1). Those are palette decisions, not component defects. The rule is disabled in `.storybook/preview.ts` with a note; re-enabling it is deleting one line once the tokens land.
- **Mappers became importable.** `convert.ts` is now a driver over pure functions in `tools/migration/src/map/`. This was the enabling refactor — the old top-level script could not be tested at all. Output was verified structurally identical to the original before the determinism fix landed.

## Alternatives considered

### Keep verification layered but test-free (the status quo)

- **Pros:** no new dependencies; nothing new to maintain; fastest CI.
- **Cons:** none of the three defects above were detectable; "does the migrated content render" was only answerable by loading a dataset and looking; every wireframe regression was a human's job to notice.
- **Why not:** the failure modes the content phase introduces are exactly the ones the existing layers are blind to.

### A vtx-scale suite (per-package Vitest configs, Playwright per app, coverage gates)

- **Pros:** maximal coverage; per-package `--affected` granularity.
- **Cons:** vtx carries 30+ Vitest configs and a coverage reporting apparatus; the cost is ongoing, and coverage gates reward volume over judgement.
- **Why not:** explicitly rejected as too heavy for this repo's size. One config, three layers, no coverage thresholds.

### jsdom instead of a real browser for components

- **Pros:** much lighter — no Chromium download, faster CI.
- **Cons:** no CSS at all, so it cannot speak to layout or contrast, and its axe results are unreliable.
- **Why not:** the wireframe build-out is the main event; a component layer that cannot see CSS misses the point.

## Consequences

- **Positive:** migrated content is proven to render before it reaches Studio; the migration corpus is checked wholesale as it grows to ~340 documents; a block with stories needs no separate test file; determinism is now real rather than asserted.
- **Negative:** four new dev dependencies (`vitest`, `@vitest/browser`, `@vitest/browser-playwright`, `playwright`) plus `@storybook/addon-vitest`; CI grows a job that downloads Chromium on a cache miss.
- **One-time churn:** the determinism fix rewrote every `_key` in `tools/migration/data/converted/` once. The dataset is disposable (ADR 0003), so this is a re-load, not a migration.
- **Risks / open questions:** the contrast rule stays off until the palette decision lands — it should not be forgotten; `stegaClean` must be imported from `@sanity/client/stega`, not the `next-sanity` barrel, or block stories break (enforced by a lint rule).

## 2026-09-04 addendum: a production navigation contract

[Issue #428 — executable page-navigation motion](https://github.com/o3world/o3-sanity/issues/428)
adds one Playwright contract against the built O3 App Router app. This is an explicit exception to
the general no-E2E boundary, not a fourth layer for ordinary component tests.

The failing behavior could not be reproduced by an isolated story: while a route snapshot faded,
a real stationary-pointer click on the navigation was lost. The destination was ready, but its
input was not. The contract must therefore keep production route commits, browser hit testing,
history/scroll, and retained route trees real. No mocked router, duplicate destination, or synthetic
click forwarding stands in for that seam.

`pnpm motion:contract` reuses the installed Playwright dependency and runs three engines at desktop
and touch-mobile sizes, with both motion preferences. API absence and JavaScript-disabled direct
loads cover progressive enhancement. Input-time evidence and destination-readiness timestamps are
separate from visual completion; a test that merely waits for a fade and then clicks would miss the
original failure.

The foreground-only arrival trial also compares actual plain-ground screenshot pixels while
content is moving and once settled. This catches opacity washing authored backgrounds without
adding persistent visual baselines or broadening the suite into a visual redesign oracle.

The cost is a production build, installed browser binaries, and access to real published routes.
Run it at navigation checkpoints alongside the existing suite and build assertion, not after every
edit. Its evidence is local and ignored, with no screenshot baselines or coverage gate. The runner
uses the worktree's registered Sanity origin and never mutates content. See [Testing](../testing.md)
for commands and the browser-support limits.

# JavaScript budget attribution — issue 389

Measured September 7, 2026, against merged main `7281a4d2160cbb86d944f2565022f2609858572e`. This is a first-load JavaScript audit, not a frame-time or startup-performance result.

## Method

Rebuilt each pinned revision from a clean Git archive, using its own frozen pnpm lockfile, Node 22.23.1, pnpm 10.14.0 and the same local Sanity environment. Each run used `pnpm --filter @o3/web build`; no source was rewritten to make a historical build pass. Read `apps/web/.next/diagnostics/route-bundle-stats.json` and retained the listed Home chunks with their byte sizes and SHA-256 hashes. Figures below are uncompressed bytes, not network transfer sizes.

The original audit revision rebuilds at 667,148 bytes, one byte below the old ticket quotation. Current main rebuilds at exactly the release measurement of 696,786 bytes. The original five commit names are not consecutive commits; each individual delta below compares the change to its actual parent, rather than charging intervening work to it.

## Individual changes

| Change                                 | Parent     |  Before |   After |   Delta | Decision                                                     |
| -------------------------------------- | ---------- | ------: | ------: | ------: | ------------------------------------------------------------ |
| `c02af933` — Shared motion recipes     | `96934ed1` | 677,136 | 677,146 |     +10 | Retain accepted behavior.                                    |
| `78bfcb28` — Card hover/focus behavior | `c02af933` | 677,146 | 677,032 |    -114 | Retain accepted behavior.                                    |
| `a09f4b48` — Section reveals           | `bf4c828d` | 677,279 | 677,297 |     +18 | Retain accepted behavior.                                    |
| `f07a1239` — Scroll-driven panel track | `bf6a2aae` | 679,102 | 680,724 |  +1,622 | Historical scroll walk; superseded by the carousel refactor. |
| `1ed02080` — Shared Embla carousel     | `2cc0ad03` | 684,050 | 701,107 | +17,057 | Retain the shared interaction primitive.                     |

These five deltas total **18,593 bytes**. The Embla change accounts for **17,057 bytes** of that total. Its emitted engine factory was 17,811 bytes; current main contains one such engine factory (17,812 bytes), shared by the carousel consumers. Three uses of a carousel do not mean three bundled engines. Keep the shared drag, keyboard, focus and carousel behavior.

## Integrated checkpoints

| Revision   | Home bytes | Change from preceding checkpoint |
| ---------- | ---------: | -------------------------------: |
| `cce01e97` |    667,148 |                                — |
| `c02af933` |    677,146 |                           +9,998 |
| `1ed02080` |    701,107 |                          +23,961 |
| `7281a4d2` |    696,786 |                           -4,321 |

The original audit to carousel-refactor interval grew by 33,959 bytes. Of that, 18,593 bytes belongs to the five isolated changes above; the remaining 15,366 bytes is intervening integrated work, including chrome, globe and shared-content changes. That remainder is an aggregate, not a claim of exact per-module allocation. Current main is 4,321 bytes smaller than the carousel-refactor checkpoint despite subsequent site and framework changes. The accepted current behavior is the baseline; restoring obsolete motion code to recover a historical number would change the product.

## Current optimization checks

| Experiment against `7281a4d2`            | Content-route bytes |  Difference | Retained?                 |
| ---------------------------------------- | ------------------: | ----------: | ------------------------- |
| Direct `cn` import in NavLink            |             696,770 |         -16 | No; no meaningful gain.   |
| `sideEffects: false` on `@o3/ui`         |             681,704 |     -15,082 | Yes, combined below.      |
| `sideEffects: false` on `@o3/content-ui` |             693,940 |      -2,846 | Yes, combined below.      |
| Both package declarations                |         **678,878** | **-17,908** | **Final implementation.** |

Each experiment changed only the named input and rebuilt the same source, dependency graph and environment. The combined result is measured, not the sum of assumed independent savings. Every content route has the same final first-load total; Studio falls to 8,626,725 bytes and the not-found route to 462,044 bytes.

Both packages export components/helpers without bare side-effect imports, top-level effect statements or imported stylesheets in their runtime source. Their initializers construct exported values. Declaring this lets the bundler remove unused module evaluation and optimize shared imports. Apps own the stylesheet entry points; no CSS or component source changed. Review independently checked this contract. Future module-level registration or bare stylesheet imports would require revisiting the declaration.

The GPU renderer/runtime already enter through dynamic imports in GlobeProvider. They are warmed immediately after provider mount: separate chunks alone do not establish deferred startup cost. Preserve the accepted GPU/SVG fallback and measure that lifecycle under issue 434, rather than treating this first-load report as proof that startup work is free.

## Budget decision

The final content-route measurement is **678,878 bytes**, below the ticket's 680,000-byte target and **51,122 bytes below the unchanged 730,000-byte ceiling**. The original accepted features remain; the measurable reclaim comes from package metadata rather than changing motion or interaction.

Add a **10,000-byte per-PR growth limit** alongside the ceiling. A 20,000-byte regression now fails even when its resulting 698,878-byte route fits beneath the absolute budget. Growth beyond the limit requires a reviewed policy change with a reason; there is no skip flag or PR-editable baseline file.

Pull requests compare GitHub’s merged candidate with the exact base commit included in that merge, built with its own frozen dependencies under the same Node and Sanity environment. Comparing that merged candidate with an older common ancestor can hide a PR addition behind an unrelated reduction on main; the workflow deliberately avoids that mismatch. New routes remain subject to the absolute ceiling. Missing, empty, malformed or duplicate baseline measurements fail rather than silently disabling comparison.

## Validation

The final production build reproduced **678,878 bytes** per content route. Rendering strategy, cached 404s, absolute budgets and baseline comparison passed. A copied real Next diagnostic with a 20,000-byte Home increase exited nonzero and named the route, independently of the absolute ceiling.

All **3,711 tests in 309 files** passed, including the new growth and CLI cases. Scoped build-assert typechecking and linting passed. Production browser checks passed **47 cases**, with seven intentional skips, across Chromium, WebKit and Firefox at desktop/mobile sizes, covering editorial content, reader navigation, keyboard pagination and mobile menu behavior.

Independent code review found a baseline-pair mismatch: comparing a merged PR candidate with an older common ancestor could hide growth. The workflow now compares the merged candidate with its exact PR base; review confirmed the fix and both package declarations. A local Git divergence fixture verified revision selection. The complete Ubuntu GitHub Actions workflow has not run yet and remains a remote validation step after publication.

Historical and import-experiment sources, build logs, route reports and chunk hashes were captured locally under `/private/tmp/o3-389-attribution/`. They are evidence, not a mutable baseline consumed by CI. Browser validation used a temporary server owned and stopped by the motion-contract runner. After validation, the existing localhost:3612 preview was replaced with this build; no additional permanent preview was added. The complete physical-device, hidden-tab, frame-time and sustained-use matrix remains with issue 434.

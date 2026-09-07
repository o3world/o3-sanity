# Nav sampling performance

Issue #391 — the nav samples its ground far more often than the ground changes.
Measured September 7, 2026 against main at `b1b936a6457195457e61b0b61193c10d9af72add`.

Scroll-triggered samples now run every three animation frames, including a final
sample when scrolling stops. Resize, document changes and history restoration
still schedule the next frame; route commits retain their synchronous settlement.
Each sample shares resolved element backgrounds across its nine columns. A
contained photograph remains column-specific because its letterbox can have a
different ground from the picture.

This adapts the ticket's proposed persistent column cache to current main. Ground
answers expire after each sample, so reflow, photographs and route swaps cannot
reuse stale answers. Header-only child mutations no longer invalidate the ground;
a ResizeObserver watches the pill size. Other document child mutations remain
observed because inserted content can move the ground under a stationary pill.

## Five-second scroll

Production build with `O3_SPATIAL_GLOBE=1 VERCEL_ENV=preview`; headless Chromium
151.0.7922.34 on macOS, viewport 1440 × 1000, DPR 1, no CPU throttle. The same
published homepage scrolled from 0 to 8049 px over five seconds, followed by
100 ms to drain the trailing sample. No other test ran during either capture.

| Measurement                           |       Main |    Change |
| ------------------------------------- | ---------: | --------: |
| Scroll animation callbacks            |        523 |       521 |
| Nav samples, including trailing drain |        522 |       174 |
| `elementsFromPoint` calls             |       4698 |      1566 |
| Core sampling spans                   |   141.7 ms |   48.2 ms |
| Sampler JavaScript CPU                |  19.755 ms |  6.397 ms |
| Sampler inclusive CPU                 | 160.200 ms | 55.231 ms |

The three-frame cadence includes the trailing read, hence 174 samples for 521
scroll callbacks. A deterministic 30-frame test independently limits the work to
90 hit tests (ten nine-column samples), checks the final ground, urgent history
invalidation and cancellation on disposal.

Core spans start at the first hit test and end in a microtask after the ninth;
they exclude the sampler's initial geometry and animation checks. CPU data uses
the Chrome sampling profiler at a 100-microsecond interval. JavaScript CPU sums
script samples within the sampler subtree; inclusive CPU also counts browser
native work. The 6.397 ms figure satisfies the scripting target; the total cost
including native work is **55.231 ms**, not under 10 ms. These are single captures,
not a statistical benchmark or physical-device result.

Raw profiles, sample logs and homepage/footer screenshots remain local under
`test_output/nav-performance/{before,final}/`. The capture harness is saved at
`test_output/nav-performance/measure.cjs`. Open `scroll.cpuprofile` in Chrome's
JavaScript profiler. Profiles are ignored artifacts and are not published with
this change.

## Validation

- Red/green regression tests exercised the public watcher: excessive scroll
  sampling, repeated computed-style reads, and header-only invalidations.
- All 39 focused nav tests pass, including photograph cover/contain and first paint.
- Content UI typecheck, changed-file ESLint, production web build and
  `pnpm build:assert` pass.
- All 24 final browser nav contracts pass across Chromium, WebKit and Firefox,
  desktop/mobile, normal/reduced motion. They check current surface colors and
  complete destination skins on the first arriving frame.
- The full suite passes: 307 files, 3687 tests (`pnpm test --maxWorkers=2`).
- Homepage and footer screenshots were captured; the homepage was visually
  inspected with the accepted globe scene enabled.
- The standard performance probe failed twice on the unmodified baseline and
  once on the final build with
  `LCP produced no browser entry`, before producing INP. The INP acceptance gate
  remains unverified; the scroll CPU capture does not replace it.

## Standards

No actionable correctness or maintainability findings in the scoped implementation.
The change retains the public watcher API and existing surface classification;
no globe, route renderer, schema or retired-app changes are included.

## Spec

The scroll and scripting targets have measured evidence. The implementation uses
short-lived caching and preserves document reflow invalidation for correctness,
as described above. INP non-regression remains a validation gap, so the ticket
must remain open pending that evidence and integration.

Review totals: Standards 0 findings; Spec 1 remaining validation gap (INP).

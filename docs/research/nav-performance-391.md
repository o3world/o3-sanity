# Nav sampling performance

Issue #391 — the nav samples its ground far more often than the ground changes.
Measured September 7, 2026 against main at `b1b936a6457195457e61b0b61193c10d9af72add`.

Scroll and routine DOM mutations share a three-frame sampling cadence, including
a final read after a burst stops. Resize and history restoration still schedule
the next frame; route commits retain their synchronous settlement.
Each sample shares resolved element backgrounds across its nine columns. A
contained photograph remains column-specific because its letterbox can have a
different ground from the picture.

This adapts the ticket's proposed persistent column cache to current main. Ground
answers expire after each sample, so reflow, photographs and route swaps cannot
reuse stale answers. Header-only child mutations no longer invalidate the ground;
a ResizeObserver watches the pill size. Other document child mutations remain
observed because inserted content can move the ground under a stationary pill.

## Five-second scroll

These captures compare main with the initial nav optimization at `689b96e9`.
The later mutation-cadence correction is covered by the burst regressions below.

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
invalidation and cancellation on disposal. The same bound applies to mutation-only
and combined mutation/scroll bursts; both reproduced 270 hit tests before the
review fix.

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
- All 41 focused nav tests pass, including photograph cover/contain and first paint.
- Content UI typecheck, changed-file ESLint, production web build and
  `pnpm build:assert` pass.
- The corrected-build browser run passed 23 of 24 checks across Chromium, WebKit
  and Firefox, desktop/mobile, normal/reduced motion. Firefox mobile normal motion
  reported a 23 px history-scroll discrepancy in the first-frame test; its earlier
  color assertions passed. The exact test then passed three isolated reruns without
  edits. The failed trace is retained at
  `test_output/nav-performance/review-firefox-failure/`; its cause is not established.
- The full suite passes: 307 files, 3691 tests (`pnpm test --maxWorkers=2`).
- Homepage and footer screenshots were captured; the homepage was visually
  inspected with the accepted globe scene enabled.
- Missing-LCP regressions pass: absent browser data stays `null`, prints as
  `unavailable`, and fails stability while the report retains INP.

## Completing the INP comparison

The original probe aborted on absent homepage LCP before opening the menu. A
minimal page and Insights produced LCP in both headless-shell and full Chromium;
the normal-motion homepage produced none in either. Reduced motion produced a
homepage entry. The page was visible, FCP was present, its text was rendered, and
no observer or page errors were reported. This local evidence isolates the
missing entry to the homepage's entrance behavior rather than observer setup.

The probe now preserves missing LCP explicitly and completes the other metrics.
It still exits nonzero when LCP is unavailable. No animation, browser mode,
throttle, quiet-window boundary or interaction was changed to obtain INP.

Main and the corrected branch were rebuilt with the same scene settings and
measured with the same repaired probe. The application baseline restored main's
NavInk source for its build, then restored the working fix before rebuilding;
all other application source already matched main.

| Route            | Main INP (two loads) | Corrected INP (two loads) |
| ---------------- | -------------------: | ------------------------: |
| `/`              |           88 / 96 ms |              104 / 120 ms |
| `/insights`      |           88 / 88 ms |                88 / 88 ms |
| `/work`          |           88 / 88 ms |                88 / 96 ms |
| `/work/best-egg` |           72 / 72 ms |                80 / 80 ms |

Differences are 0–24 ms, within the probe's existing 40 ms absolute INP tolerance.
That tolerance normally checks agreement between cold loads; it supplies the
precision context here, not proof that every final sample is faster or equal.
There is no material regression at that precision. Two samples per route cannot
establish a statistically exact no-regression claim.

Both full reports show stable measurements on the three non-homepage routes and
exit 1 because homepage LCP is unavailable. INP is now measured rather than
blocked by that separate limitation. The logs are saved locally as
`test_output/nav-performance/review-main-perf.log` and `review-final-perf.log`.

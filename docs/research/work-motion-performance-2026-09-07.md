# Our work motion performance audit — September 7, 2026

The current cards cost substantially more JavaScript time than the isolated work starfield on this Mac. Keep the accepted star density while addressing repeated card clipping and layout reads. The measured star render pass is inexpensive here; that does not establish phone GPU performance or the browser's cost to rasterize and composite the cards.

The return-navigation star sweep is a reproduced state-reset bug. At scrollY 2044, the camera was approximately 803 before navigating into IRONMAN. After history restoration, scrollY was still 2044 but the camera restarted at 64 and eased back to 803. The section's initialization starts `cameraY` at zero. Initialize it from the restored section position, then ease subsequent user scrolling. Repeated navigation, GPU memory retention, and physical mobile presentation need further testing before release.

## Method and scope

An isolated source snapshot at `/private/tmp/o3-work-performance-20260907` preserves the pre-correction experiment. It was built with Next 16.3.4 in production mode using webpack, with `O3_SPATIAL_GLOBE=1` and `NEXT_PUBLIC_WORK_MEMBRANE_STUDY=1`. The development-only study guards were enabled only in that snapshot. The user's development preview on port 3612 was not benchmarked as production.

App-owned audit controls ran through Chrome, recording six-second windows after 2.5 seconds of settling. Each of six variants ran twice at idle and twice during a deterministic scroll down and back, at 1440×900 and 390×844, DPR 1. These are 48 repeated comparison windows. The narrow viewport uses the same Mac, without phone CPU, thermal, touch, or network emulation. Variant order was fixed, with two repeats; the ranges show variation rather than statistical confidence intervals.

Additional checks cover star GPU timestamps, a 3840×2160 viewport, hero/footer visibility, reduced motion, and one case-study round trip. The 4K scrolling sample was interrupted and is excluded. Completed measurements and the instrumentation setup are saved under `test_output/work-performance-2026-09-07/`; the optimized snapshot remains in `/private/tmp` for repeat runs. No performance instrumentation was added to the product source.

The component measurements wrap the card and work-star callbacks. They include synchronous browser work triggered by those callbacks, but exclude later paint/compositing and other page callbacks. In combined runs the apparent cost shifts between the card and star callbacks, consistent with interleaved DOM writes and layout reads. Compare their combined cost; do not treat a high star callback reading as shader cost. Zero long-animation-frame entries also cannot establish zero forced layout: those entries only expose frames over their long-frame threshold.

## Repeated results

Total measured card plus work-star callback time per six-second window, in milliseconds. The static control keeps the organic layout and a fixed outline; it is not a build of the original production card layout.

| Variant                           | Desktop idle | Desktop scroll | Narrow idle | Narrow scroll |
| --------------------------------- | -----------: | -------------: | ----------: | ------------: |
| Static cards, no work stars       |            0 |              0 |           0 |             0 |
| Animated cards only               |      866–894 |        316–418 |     822–882 |       346–410 |
| Full-density stars only           |      220–222 |        177–190 |     217–243 |       206–215 |
| Full experiment                   |  1,278–1,976 |        646–958 |   978–1,248 |       627–827 |
| Full, outline assignment disabled |  1,056–1,426 |        633–803 |     853–915 |       517–667 |
| Full cards, sparse star preset    |  1,275–1,381 |        630–666 | 1,021–1,022 |       570–580 |

The outline control still computes the spline and moves the card; it skips updating the SVG path. It therefore isolates assignment and its downstream invalidation more closely than simply removing the cards. The sparse control uses the existing 1,100-star quiet preset, including its different motion flags, compared with 4,180 stars. It is a preset comparison, not a pure count-only shader experiment.

Across the 48 comparison windows, callback cadence stayed near 120 Hz. Window p95 intervals ranged from 8.7 to 10.1 ms; none exceeded 17.5 ms, and no long tasks, long animation frames, hidden-tab events, or page errors were recorded. This is animation callback cadence, not measured display presentation. The samples do not measure INP or establish field Core Web Vitals. Warm local loads and cached CDN assets are unsuitable for claiming production LCP or transfer-time improvements.

Full desktop idle callbacks consume approximately 21–33% of the six-second wall-time budget. That is enough continuous work to prioritize efficiency even though this machine kept pace. It is not a measurement of total CPU utilization or energy use.

## GPU and surface size

Optional WebGPU timestamp queries measured only the work star render pass. These separate samples request an extra GPU feature and incur timer overhead, so they are excluded from the CPU comparison table.

| Viewport, DPR 1 | Scenario | Mean star pass |     p95 | Maximum |
| --------------- | -------- | -------------: | ------: | ------: |
| 1440×900        | Idle     |        0.31 ms | 0.79 ms | 1.97 ms |
| 1440×900        | Scroll   |        0.51 ms | 1.18 ms | 2.16 ms |
| 3840×2160       | Idle     |        0.80 ms | 1.51 ms | 2.16 ms |

GPU timestamp values are quantized. These timings exclude CSS masks, image filters, browser raster/compositor work, and the hero/footer render passes. No compositor trace or physical-display capture was obtained; this audit cannot certify those stages as inexpensive.

The work sky uses one viewport-sized surface rather than a section-height allocation, which is appropriate. The existing hero forces a minimum DPR of 1.5 and uses a four-sample offscreen scene with a depth attachment and a composite pass. At the 4K test viewport, its canvas was 5760×3240 while the work canvas was 3840×2160. That is 18.66 million hero pixels before multisampling. An illustrative 4-byte color plus 4-byte depth, each at four samples, plus one color resolve requires about 672 MB for that hero scene alone. Actual GPU allocation was not measured; depth format storage, transient attachments, swap buffers and driver behavior differ. This is a surface-budget risk, not evidence of a leak or observed out-of-memory failure.

## Lifecycle and loading

- Hero and footer idle samples recorded zero work-card and work-star callbacks after settling. Work effects pause when offscreen.
- `spatial-still` recorded zero card or work-star callbacks during the settled six-second window. Source also subscribes to OS reduced motion and document visibility; a physical OS toggle and hidden-tab trace were not captured in this pass.
- One case-study return retained four canvas elements before and after, with no page errors. This does not establish absence of a long-session GPU or heap leak.
- The shared runtime uses one device, pooled draws, visibility gating and explicit release/disposal. Those are useful existing boundaries to retain.
- In the installed vgpu 0.4.0 source, each live surface registers automatic size checks on the shared frame clock. Work frames can therefore cause size reads on retained hero/footer surfaces. Those reads, plus work opacity writes followed by geometry reads, are candidates for batching and caching.
- The work prototype statically imports `frame` and `surface`, bringing a vgpu-containing chunk into initial script loading. In this webpack snapshot that chunk is 43,472 raw bytes / 14,986 gzip bytes. This is not the total engine size or a measured net bundle regression. Existing globe loading used a dynamic boundary; keep that boundary when promoting the study.

The isolated production build and its TypeScript phase passed. `pnpm build:assert` could not evaluate this webpack build because the required `.next/diagnostics/route-bundle-stats.json` was absent. It did not report a verified route-strategy or bundle-budget pass. A canonical build with the project's diagnostic output remains a release check.

## Recommended order

1. Correct the card geometry and tune whole-card momentum, as requested. Keep text in normal selectable DOM. Preserve a fixed content-safe area; use bounded outward edge travel rather than taking a percentage out of the card's padding.
2. Fix the reproduced camera reset on history restoration. Keep ordinary depth-based scrolling and its direction.
3. Batch animation reads before writes and cache sizes outside steady-state frames. Measure the combined callbacks again, preserving the current motion cadence and appearance.
4. Reduce unnecessary spline serialization and clip invalidation, then obtain a browser raster/compositor trace. A rewrite of the cards into a GPU canvas is not justified by these measurements and would complicate selectable text.
5. Measure retained hero/footer surface memory and resolution on physical phones and large displays. Reconsider the minimum hero DPR and offscreen resources based on that evidence.
6. Restore deferred engine loading and run the canonical bundle/rendering assertions before production rollout.

The geometry and momentum follow-up occurs after this baseline. These baseline measurements must not be presented as measurements of the revised cards. Physical Android/iOS testing, presentation/raster traces, cold-load performance, genuine input latency, repeated route stress, and direct GPU-memory measurement remain open; no visual quality reduction or broad optimization has been applied by this audit.

## Subsequent visual correction

The user-authorized follow-up keeps the card layout width intact and gives the background a bounded outward allowance. It replaces width-proportional inward clipping with pixel-bounded motion, adds stack space for the moving edges, softens the whole-card vertical spring, and removes image hover/focus zoom. The pure spline helper is separate so its content-safe boundary can be checked independently of React and scrolling.

Six geometry cases pass through ambient motion and maximum input bends, including narrow phones and the 1728px maximum card width. TypeScript and focused lint checks pass. Browser checks at 390px, 1159px and 2560px confirmed equal card widths and no horizontal page overflow. Phone text selection was visibly verified; a hovered desktop card reported image scale `none`. At 390px, the sampled first/second layout-box gap was about 67px after scrolling; at the large viewport it was about 91px, before accounting for the background's vertical allowance. The card continued to settle over successive 100ms observations after scrolling stopped, rather than jumping immediately to its final offset.

These are functional and layout checks of the revision, not a repeated production performance comparison. At this checkpoint, the camera-reset finding and broader optimization recommendations remained open.

## Camera restoration follow-up

The work camera now initializes from the section position on its first visible paint, then retains the existing easing for subsequent scrolling. A regression check covers the restored position, movement in both directions, and paused motion. The seven camera/geometry checks, focused lint, TypeScript, and optimized preview build pass. A browser round trip through IRONMAN returns to the work section with all three cards and its starfield visible; first-frame GPU coordinates were not instrumented in this follow-up.

## Build assertions follow-up

The preview now uses the standard Turbopack production build. Next 16.3.4 writes `route-bundle-stats.json` only for that bundler; the webpack override was why the assertion could not run. The preview checks rendering strategy, cached 404s, and JavaScript budgets before starting its server.

The first standard build exposed 754,573 bytes of first-load JavaScript per content route, above the unchanged 730,000-byte ceiling. Deferring the work starfield's `vgpu` import until its effect runs restores the engine loading boundary and reduces that total to 697,061 bytes. Rendering, cached-404, and bundle assertions now pass with the study enabled. This measures initial bundle size, not a new runtime performance comparison; the broader physical-device and compositor checks remain open.

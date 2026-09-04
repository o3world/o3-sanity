# Globe frame cadence and vgpu

Investigated 2026-09-04 for [#436 — the globe's visible motion feels low-framerate](https://github.com/o3world/o3-sanity/issues/436). The initial pass was diagnosis only. The user subsequently authorized a native fix, retaining the current gentle electron and mouse pacing, and reported disappearing joins in both the homepage and closing globe. The local follow-up is recorded below; no dependency was installed and this agent did not commit, push, or deploy.

The immediate cause is the existing renderer's explicit 30Hz geometry guard. On this Mac's hardware renderer, the unchanged homepage and isolated globe both receive about 120 animation-frame callbacks per second but change geometry at 30Hz. A temporary response override removing only the guard produces about 120 geometry updates per second on the same homepage. A WebGPU renderer is not needed to remove this ceiling.

That throughput probe is **not a finished fix**: electron motion and mouse easing in the baseline renderer advance per rendered frame, so removing the guard also speeds them up. The authorized follow-up uses the current stable-30Hz timing reference. Physical display presentation and actual phone hardware remain unmeasured.

## Evidence and repeatable loop

Raw scripts, JSON, traces and PNGs below are local evidence, not checked-in links. The original investigation is archived in `evidence.tar.gz` under `/Users/jfriedman/.codex/visualizations/2026/09/04/01a06d1c-72e3-7730-aa33-f2bbe54f8a57/issue-436-globe-diagnosis/`. The coordinating task will archive implementation evidence there separately before removing the worktree. Filenames below refer to the archive's `test_output/` directory.

The agent-runnable harness is `test_output/globe-cadence.mjs`. Run from this worktree:

```sh
node test_output/globe-cadence.mjs https://o3-sanity-web-staging.vercel.app/ 1440 1000 test_output/staging-desktop-baseline.json
```

Its first three six-second samples returned exit 1:

```text
run 1: rAF 81.12 Hz; geometry 27.42 Hz; ratio 0.338; geometry p95 58.1 ms; RED
run 2: rAF 83.56 Hz; geometry 27.04 Hz; ratio 0.324; geometry p95 57.3 ms; RED
run 3: rAF 85.43 Hz; geometry 27.70 Hz; ratio 0.324; geometry p95 46.5 ms; RED
```

The diagnostic target is geometry updates on at least 85% of rAF opportunities and at least 45Hz. This is an investigation threshold, not an approved product budget. Its verdict concerns sustained geometry cadence; maximum gaps and raw frame intervals must also be inspected. Passing it does not establish uniformly smooth physical presentation.

The harness watches real `d` mutations on the existing 14-path wireframe SVG and samples whether that geometry changed between rAF callbacks. It records viewport, scroll position, selected element, renderer, media preference, intervals, long-animation-frame entries, and errors. The selected hero was visible at desktop scrollY 369 and mobile scrollY 300; `test_output/staging-desktop-headed.png`, `test_output/staging-mobile-viewport-headed.png`, and `test_output/story-turning-desktop-headed.png` screenshots were inspected.

The web deployment was verified by the coordinating task as `547533fb`; published Storybook as `53c57d716b80c05ec0407aa3d53a05902a613602`. This worktree starts at the latter. The globe component has no diff between those commits. The served Next.js chunk contains the same guard. The isolated case is the existing [Turning story](https://o3-sanity-storybook-staging.vercel.app/iframe.html?id=ui-orbitalsphere--turning&viewMode=story), with its normal 440px globe and pulse.

## Controlled comparisons

Except where noted, measurements use headed Chromium 151, a 1440×1000 CSS viewport, DPR 1, no CPU/network throttling, normal motion preference, and the Apple M3 Pro through ANGLE Metal. WebGPU adapter inspection reported `apple`, `metal-3`, `isFallbackAdapter: false`. Headless Chromium 151.0.7922.34 instead reported ANGLE SwiftShader and no WebGPU adapter. No other task ran automated browser benchmarks during these windows.

| Case                                | Six-second windows | rAF opportunities/s | Geometry updates/s | Evidence                                                     |
| ----------------------------------- | -----------------: | ------------------: | -----------------: | ------------------------------------------------------------ |
| Homepage, headless software         |                  3 |         81.12–85.43 |        27.04–27.70 | `test_output/staging-desktop-baseline.json`                  |
| Isolated Turning, headless software |                  3 |       119.87–120.01 |        29.96–30.00 | `test_output/story-turning-desktop-baseline.json`            |
| Isolated Turning, hardware          |                  3 |              120.00 |              30.00 | `test_output/story-turning-desktop-headed.json`              |
| Homepage, hardware                  |                  3 |       119.85–120.00 |              30.00 | `test_output/staging-desktop-headed.json`                    |
| Isolated Turning, cap-only override |                  3 |       107.85–120.00 |      107.85–120.00 | `test_output/story-turning-desktop-cap-only-throughput.json` |
| Homepage, cap-only override         |                  3 |       119.99–120.00 |      119.99–120.01 | `test_output/staging-desktop-cap-only-throughput.json`       |
| Homepage, pulse paused only         |                  1 |              120.00 |              30.00 | `test_output/staging-desktop-pulse-paused.json`              |
| Homepage, 402×874 mobile viewport   |                  3 |              120.00 |              30.00 | `test_output/staging-mobile-viewport-headed.json`            |
| Homepage, automated mouse movement  |                  1 |              120.00 |              30.00 | `test_output/staging-desktop-pointer.json`                   |

The hardware baselines repeat the same geometry for roughly 540 of 720 rAF opportunities per window. In the live cap-only comparison, repeated geometry falls to zero, geometry p95 intervals are at most 9.4ms, and the maximum interval is 9.8ms. All completed runs reported no page errors. The mobile row is a narrow viewport on this Mac, not an iPhone or Android performance claim. The pointer check sends actual browser mouse events in two elliptical sweeps per window at roughly 100ms intervals; it does not measure input latency or touch hardware.

Two isolated cap-only windows had substantial stalls: maximum rAF gaps of **608.3ms and 174.9ms**, despite p95 intervals near 9ms. The third window was clean, as were the three live cap-only windows. Their cause was not established. They do not erase the deterministic 30Hz guard result, but they prevent a universal smoothness claim.

The ranked hypotheses were relayed before controls: explicit cadence guard; pulse paint cost; hero raster area; software-renderer distortion; and CPU path-building cost. Results support the guard as the immediate ceiling. Pausing only `globe-pulse` leaves that ceiling intact. Hardware removes the extra software-mode slowdown but retains 30Hz geometry. Large homepage placement and small isolated placement both reach the ceiling; no separate size-only experiment was needed for this bounded diagnosis, so broader raster-size costs remain unquantified.

A six-second `test_output/story-turning-desktop-trace.trace.json` contains 753 globe callback calls, including the skipped ticks. Callback p95 is 0.316ms, maximum 0.604ms, and total 64.86ms. Main-thread `Paint` events total 17.495ms, with a 0.147ms maximum. These are CPU trace durations, not GPU raster duration or physical display presentation. They provide no evidence of an unavoidable CPU saturation limit in this case. Raw long-animation-frame entries can straddle the beginning of sampling; inspect their timestamps, not just their count. The harness's legacy missed-opportunity estimate uses a stated 60Hz reference and is not a count of lost physical frames.

### What the temporary override changed

For Storybook, the observed constant `31.333333333333336` became `0`. For the current Next.js chunk, the unique assignment `M=1e3/30,E=-1/0` became `M=0,E=-1/0`. Overrides were confined to a fresh browser's network responses; each successful run required exactly one match and saved its original SHA-256. The first Next.js attempt matched zero and failed closed, producing no comparison result. No application file was modified.

Repeat the live throughput comparison:

```sh
GLOBE_HEADED=1 GLOBE_PROBE=cap-only-throughput node test_output/globe-cadence.mjs https://o3-sanity-web-staging.vercel.app/ 1440 1000 test_output/staging-desktop-cap-only-throughput.json
```

## Timing reference and the authorized choice

The baseline guard is in [the original component](https://github.com/o3world/o3-sanity/blob/53c57d716b80c05ec0407aa3d53a05902a613602/packages/ui/src/components/orbital-sphere.tsx#L479). Rotation already uses elapsed time. Electron phase increments by `d.sp * speed / 60` per accepted frame, while mouse easing applies `0.06` per accepted frame. The [official export](../../apps/storybook/prototypes/2026-08-globe-export/globe-red/globe.js#L136) has the same frame-count-dependent electron and mouse formulas, but does not have this 30Hz guard.

A 60Hz elapsed-time reference is a reasonable inference from `/60`, not proven author intent. At stable 30Hz, current staging advances electron phase at half that reference's rate and eases the mouse more slowly. At 120Hz, the uncapped export itself advances those frame-based values twice as fast as at 60Hz. Therefore “just remove the cap” cannot promise unchanged timing, even though the geometry and rotation constants stay the same.

The user-approved choice is current stable-30Hz movement. The native implementation keeps SVG and separates drawing cadence from phase/easing integration. It retains the first accepted paint's one-reference-step advance, uses active elapsed time thereafter, and resets that integration after offscreen or hidden intervals. It does not clamp ordinary missed frames. Global rotation retains its prior wall-clock phase. The existing reactive effect dependencies, initial reduced-motion gate, seeded geometry, projection, front/back opacity, colors, widths, bloom and pulse periods remain. A visibility listener is added only to prevent hidden-tab time becoming an electron/easing catch-up; dynamic reduced-motion preference changes remain outside this fix.

## Native follow-up: cadence and missing joins

The existing browser stories are the regression seam; no private-helper test or public test-only prop was added. A controlled rAF/performance clock in the new FramePacing story first failed at an 8.33ms tick because geometry was unchanged. After the clock change, geometry updates at each controlled display tick. Independently captured electron positions/radii at one second agree at 15, 30, 60 and 120Hz, both idle and with a pointer at 75%/25% of the viewport. Those references include the initial paint: 31 accepted paints at times 0 through 1000ms in the baseline. The first electron is `[609.6,878.8,2.2]` idle and `[583.9,851.9,2.1]` with the pointer. Hidden-tab resume matches the old renderer's two-paint reference `[606.6,873.7]`, not a catch-up. Browser clock overrides are restored and the story remounts into normal live behavior.

For the visual defect, the first rendered fixed-angle command was:

```sh
node test_output/globe-fixed-angle.mjs
node test_output/globe-fixed-angle.mjs 'https://o3-sanity-storybook-staging.vercel.app/iframe.html?id=ui-orbitalsphere--turning&viewMode=story' story-fixed-angle
```

Both exited 1. All seven orbit pairs had four unmatched endpoints at 0, 15 and 30 seconds, in the live hero, live closing globe and isolated Turning story. Largest nearest-endpoint separations were 29.61, 27.56 and 23.85 SVG units. Both placements were visible in the captured viewport. Ranked predictions were shared before controls: missing depth-transition spans; separate straight-segment faceting; separate low-DPR raster stair-stepping; and apparent gaps from opacity/occlusion.

The path builder started the new front/back half at its next sample when depth changed, omitting the connecting span. The correction keeps the 72 original samples and joins both halves at one shared z=0 point on that span. It removes the perspective divide before interpolating the crossing. No width, blur, palette, tilt or sample-count change hides the defect. The existing Presets story first failed endpoint pairing, then passed; it requires three actual globes, 14 paths per globe, nonzero substantial orbit lengths, and paired endpoints. Moving fixed-angle checks also cover 15, 30 and 60 seconds. Still/server-rendered paths deliberately gain these missing spans; they are not byte-for-byte identical broken paths.

For the final visual comparison, the harness advances at regular 30Hz intervals through each angle so the old frame-count-based electrons and new elapsed-time electrons reach the same phase. Earlier diagnostic captures jumped directly between times, which was sufficient to prove gaps but not electron parity. Final files are `staging-30hz-fixed-angle-*`, `local-web-30hz-fixed-angle-*`, and `local-web-30hz-fixed-angle-dpr2-*`. Hero rectangles match exactly; 30-second closing-globe rectangles match exactly. At every captured angle the baseline has four unmatched endpoints per circle and the candidate has zero. Matching hero and footer screenshots were visually inspected.

| Native local candidate  | Geometry updates/s | Geometry p95 / maximum interval | Local JSON                       |
| ----------------------- | -----------------: | ------------------------------: | -------------------------------- |
| Isolated Turning, DPR 1 |             119.90 |                     9.4 /11.2ms | `local-story-cadence.json`       |
| Large homepage, DPR 1   |             120.02 |                     9.0 /11.8ms | `local-web-cadence-dpr1.json`    |
| Large homepage, DPR 2   |             120.01 |                     8.9 /12.1ms | `local-web-cadence-dpr2.json`    |
| 402×874 viewport, DPR 1 |             119.99 |                     9.4 /10.9ms | `local-web-mobile-viewport.json` |

Each row is one six-second headed Chromium 151 window on the same Apple M3 Pro, with no CPU/network throttle and zero repeated geometry frames or page errors. These local measurements use development servers, after loading; they are not production-build or physical-presentation measurements. The narrow viewport is desktop emulation, not phone hardware. Re-run against the settled production build before a release performance claim.

**Remaining contour-quality limit:** the missing spans are repaired, but visible polygon corners remain at DPR 2, particularly near a tightly foreshortened crest. Higher pixel density softens raster stair-stepping; it does not turn the preserved straight-segment contour into a smooth curve. This patch does not claim to solve all aliasing or faceting. A later curve-quality change needs its own artwork comparison and budget, not blind sample-count increases or a renderer replacement.

SVG's default `shape-rendering:auto` already favors geometric precision; `crispEdges` can disable antialiasing, so it is not a general smoothing fix. [SVG2 rendering hints](https://www.w3.org/TR/SVG2/painting.html#ShapeRendering) WebGPU likewise defaults to one sample unless a pipeline chooses multisampling, so a GPU port must deliberately implement edge treatment. [WebGPU multisample state](https://gpuweb.github.io/gpuweb/#dictdef-gpumultisamplestate)

Validation checkpoint, run sequentially on the settled source:

- `pnpm test`: 290 files / 3566 tests passed, including nine globe stories; no suite failures.
- `pnpm exec turbo run lint typecheck --filter=@o3/ui --filter=@o3/web --filter=@o3/storybook --concurrency=1`: all 14 tasks passed, with no cached results. This checks the three changed/relevant workspaces and their type dependency graph.
- `pnpm --filter @o3/web build`: passed, including TypeScript and 47 static-page outputs.
- `pnpm build:assert`: passed all 20 routes; only the four allowlisted API routes render on demand. Content first-load JavaScript is 653,553 / 730,000 uncompressed bytes, leaving 76,447. This is 409 bytes above the prior 653,144-byte baseline; Studio is 8,734,194 / 9,677,000 bytes.

These scoped commands substitute for generic `pnpm verify` so the retired O3XO application is not built. The full test suite still exercises its existing mechanical compatibility. Production browser rendering and independent review remain with the coordinating task; a successful build alone is not a rendered-performance claim.

## vgpu assessment from primary sources

The [npm registry](https://registry.npmjs.org/vgpu) reports `latest: 0.4.0`, published 2026-09-03. [Main and tag v0.4.0](https://github.com/vercel-labs/vgpu/tree/e1661e3385ac63dc88535c1a0e819e52702f02f8) point to `e1661e3385ac63dc88535c1a0e819e52702f02f8`; the repository's default branch is separately `canary`. It is [MIT licensed](https://github.com/vercel-labs/vgpu/blob/e1661e3385ac63dc88535c1a0e819e52702f02f8/LICENSE). This is a published pre-1.0 library: the [0.4.0 changelog](https://github.com/vercel-labs/vgpu/blob/e1661e3385ac63dc88535c1a0e819e52702f02f8/packages/vgpu-api/CHANGELOG.md) explicitly identifies a breaking change in exception handling and frame submission. Published does not mean API-stable.

| Concern                     | Verified capability or limitation                                                                                                                                                                                                                                                                                                                                                                | Consequence for this globe                                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser/device availability | Browser `init` requests a WebGPU adapter/device and fails when unavailable; it does not select a WebGL renderer. [Init contract](https://github.com/vercel-labs/vgpu/blob/e1661e3385ac63dc88535c1a0e819e52702f02f8/packages/vgpu-api/src/init.docs.md), [implementation](https://github.com/vercel-labs/vgpu/blob/e1661e3385ac63dc88535c1a0e819e52702f02f8/packages/vgpu-api/src/kernel.ts#L237) | Keep a still SVG if the API, adapter, device, shader, or canvas setup fails. Browser support alone does not establish that a particular visitor has a usable adapter.                   |
| Browser coverage            | WebGPU ships across current major engines, with platform/version limits. [Chrome overview](https://developer.chrome.com/docs/web-platform/webgpu/overview), [Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)                                                                                                                                                           | Feature detection and failure handling remain necessary; no audience coverage percentage was measured here.                                                                             |
| Next.js and Storybook       | Official docs provide a Turbopack `*.wgsl` rule using `@vgpu/wgsl/loader-webpack`, a webpack rule, Vite's `wgslVitePlugin`, and WGSL type declarations. Browser initialization belongs after client mount. [Integration guide](https://vgpu.sh/docs/guides/nextjs)                                                                                                                               | Both the Next app and Storybook Vite host need integration. Their documentation is evidence of support, not a tested integration in this repo.                                          |
| Device loss                 | The core wrapper observes `GPUDevice.lost` and marks the device unusable. The frame loop stops if a tick throws. [Device source](https://github.com/vercel-labs/vgpu/blob/e1661e3385ac63dc88535c1a0e819e52702f02f8/packages/core/src/device.ts#L44), [frame loop](https://github.com/vercel-labs/vgpu/blob/e1661e3385ac63dc88535c1a0e819e52702f02f8/packages/vgpu-api/src/frame.ts#L596)         | The app still owns fallback display or reconstruction of device/resources; this is not transparent recovery.                                                                            |
| Visibility and motion       | The loop supplies rAF scheduling, an optional FPS cap, and a stop handle. The inspected loop has no document visibility, intersection, or reduced-motion policy. [Frame loop source](https://github.com/vercel-labs/vgpu/blob/e1661e3385ac63dc88535c1a0e819e52702f02f8/packages/vgpu-api/src/frame.ts#L596)                                                                                      | Preserve app-level offscreen and reduced-motion behavior; dispose the loop and GPU resources when unmounted. Using vgpu with an intentional 30Hz cap would reproduce a cadence ceiling. |
| Resolution and power        | Surfaces support explicit DPR or a clamped range and auto-resize; initialization forwards `powerPreference`. [Surface contract](https://github.com/vercel-labs/vgpu/blob/e1661e3385ac63dc88535c1a0e819e52702f02f8/packages/vgpu-api/src/surface.docs.md), [init contract](https://github.com/vercel-labs/vgpu/blob/e1661e3385ac63dc88535c1a0e819e52702f02f8/packages/vgpu-api/src/init.docs.md)  | Canvas resolution and blur passes need a measured budget. A large DPR 2 hero has four times the DPR 1 pixels. “GPU” does not guarantee lower power or smoother frames.                  |

vgpu operates on shaders, geometry buffers, passes, and canvas surfaces. It is not an SVG acceleration adapter. Preserving this globe would require translating the seeded seven great circles, perspective projection, front/back split, point sizes, electrons, and mouse tilt into GPU geometry or shader math. Exact variable-width anti-aliased strokes and the export's Gaussian glows also need an explicit rendering approach; a generic mesh wireframe is not the same artwork. The three currently static bloom rings should not become unnecessary work every frame. These are engineering inferences from the existing implementation and vgpu's [draw model](https://vgpu.sh/docs/concepts/draws) and [effects model](https://vgpu.sh/docs/concepts/effects), not results of a completed port.

The server-rendered still SVG should remain visible before enhancement and on reduced motion or initialization failure. A client canvas can replace its animated presentation only after a valid first frame; canvas markup alone cannot preserve the existing server-rendered artwork. Any future port would need image comparison at fixed times, actual browser checks, and device-loss/unmount verification. The [integration guide](https://vgpu.sh/docs/guides/nextjs) also states that the WGSL loader does not validate shaders against a device; a successful Next build alone is insufficient.

### Bundle claims and the actual site budget

The [vgpu README](https://github.com/vercel-labs/vgpu/blob/e1661e3385ac63dc88535c1a0e819e52702f02f8/README.md) advertises a 25KB gzip complete fullscreen effect. The release's [experience budgets](https://github.com/vercel-labs/vgpu/blob/e1661e3385ac63dc88535c1a0e819e52702f02f8/packages/vgpu-api/package.json) set `effect-only` to 25,600 gzip bytes and full-root to 38,912. These are fixture ceilings, not measurements of this globe. The [measurement script](https://github.com/vercel-labs/vgpu/blob/e1661e3385ac63dc88535c1a0e819e52702f02f8/scripts/check-bundle-size.mjs#L88) declares externals and builds specific fixtures; an application's actual bundler graph remains the relevant comparison.

This site's [content-route ceiling](../../tools/build-assert/src/policy.ts) is **730,000 uncompressed first-load JavaScript bytes**. The coordinating task's verified `547533fb` build was 653,144 bytes, leaving 76,856 bytes. Gzip fixture claims cannot be subtracted from that uncompressed headroom. The shipped Storybook sphere module is 9,235 uncompressed bytes by direct response inspection, but it imports shared code and is not the Next.js incremental module cost. No vgpu build, globe bundle delta, or runtime benchmark was performed. [#394 — defer animated-globe loading while keeping its still SSR image](https://github.com/o3world/o3-sanity/issues/394) remains separate work.

## Recommendation and next unlock

Keep the current renderer for the first remedy. The measured limiting guard is small and local, and native SVG demonstrated substantially higher update throughput on this Mac with the full homepage artwork. The authorized local candidate now normalizes timing and closes the confirmed depth-transition gaps. Its story regressions and matched browser captures pass. Review the settled diff and production rendering before publication; actual phone and physical presentation remain unverified. Do not substitute the earlier cap-only probe for the elapsed-time implementation.

vgpu is a plausible future renderer if measured painting/GPU cost remains after the native cadence change or if new visual requirements justify a shader implementation. It currently adds a rewrite, canvas fallback, and lifecycle responsibility without a demonstrated performance benefit for this globe. The next unlock is independent review and production-build rendering of the native change. Remaining contour faceting is explicit follow-up work; neither this implementation nor the vgpu research establishes a need for a renderer replacement. Issue closure and publication belong to the coordinating task.

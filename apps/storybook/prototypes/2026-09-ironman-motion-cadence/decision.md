# IRONMAN native-motion capture

Captured September 4, 2026 for [#426 — the IRONMAN native-runtime gate](https://github.com/o3world/o3-sanity/issues/426).

## Decision

Keep native CSS animation and IntersectionObserver for these three content scenes. No scene demonstrated a limitation requiring Motion, GSAP, ScrollTrigger, or a scroll interpolator. A specialist comparison would not answer a demonstrated problem here, so none was added.

This conclusion covers chapter entry, the painted-stage/image handoff, and reading-order screen tiles. It does **not** validate route transitions, navigation readiness, menus, carousels, the globe, or App Router's retained trees. [#428 — the executable navigation contract](https://github.com/o3world/o3-sanity/issues/428) owns the separate route-transition decision; this standalone capture contains no React View Transition boundary.

The production narrative implementation belongs to [#430 — grouped chapter reveals](https://github.com/o3world/o3-sanity/issues/430). This capture is a record to interpret, not code to promote into the application.

## What the scenes established

- **Chapter:** heading group, then first paragraph 100ms later. Remaining prose is never armed or moved. The detail list enters as one compact group at its own viewport boundary; triggering it with the heading would finish its entrance while the intervening long prose was still being read.
- **Layer handoff:** the existing 135-degree gradient stage stays fully painted and still. Its real screenshot enters 100ms later. The image files are flattened compositions; there is no independently authored photograph background/foreground pair or caption to invent. Additional image-on-image choreography requires actual related assets, not another runtime.
- **Screen grid:** the lead tile enters first. Supporting tiles enter in authored order as their own boundaries reach the viewport; side-by-side tiles take successive semantic delays. A single sequence across the entire tall grid would animate lower rows before the reader sees them. Only image foregrounds translate; neither their plates nor an enclosing band translates.

The proposed entrance is 560ms with the existing house curve `cubic-bezier(0.2, 0.7, 0.2, 1)`, a 100ms step capped at two steps, and 20px desktop / 12px mobile travel. These are captured motion proposals, not new production tokens or editor controls. The longest local entrance window is 760ms.

CSS keyframes start the discrete entrance without relying on a prior hidden paint. One pooled observer supplies viewport boundaries. A passive scroll listener schedules at most one inspection frame at a time while work remains; a large frame-to-frame scroll jump settles passed scenes and active entrances. The listener detaches when all scenes settle. There is no continuous frame loop, scroll interception, pinning, or progress scrub.

## Browser evidence

Checked Chromium 151.0.7922.34, Firefox 153.0, and WebKit 26.5 at 1440 × 900 and 402 × 900:

- All six cases showed the heading before the lead; measured animation-start separation was 90–100ms. Mid-entry opacity and translation differed in the expected order, then returned to opacity 1 and no translation.
- The media stage remained opacity 1 with no translation while its image was still opacity 0. Lower grid tiles stayed armed until reached.
- Normal, forced-reduced, system-reduced, resize, top-to-bottom rapid jump, and reverse/real-wheel journeys left reached content readable. Reverse scrolling did not re-hide settled content.
- All eleven beats settled after the full-page jump, with no active animations and no additional observer callbacks or inspection frames during the following 1.1-second idle sample.
- The no-JavaScript article retained every current IRONMAN paragraph and all seven images. Each browser loaded the local images and fonts without remote asset requests, page errors, or horizontal overflow at either width.
- Chromium's supported long-task observer recorded no tasks over 50ms in the sampled normal/rapid journey. This is a local prototype observation, **not** a production performance budget or Core Web Vitals result. Firefox and WebKit do not supply that long-task evidence.

**Unverified:** real hidden-tab cleanup. All attempted browser configurations reported `visibilityState = visible`, including a headed, minimized Chromium window after disabling Playwright focus emulation and restoring backgrounding flags. Those attempts are not passes. The capture's hidden/pagehide handlers settle motion, but the production lifecycle contract must still prove actual hidden and retained-route behavior. No synthetic visibility event was treated as evidence.

The raw measurement records and screenshots were retained locally under `test_output/ironman-426/`; they are not shipped as public assets. An initial Firefox wheel assertion incorrectly treated a requested 7000px wheel delta as a completed page-bottom scroll; actual reached-content inspection corrected that assumption without changing the runtime.

## Snapshot boundary and cost

The HTML and compiled CSS were captured from the public staging IRONMAN route at `62bec9278896608dba1730d4d20258b4905df805`, with the approved 75px desktop gutter. They preserve the current renderer's static values, grounded in Figma frames `1710:2300` and `1906:928` and the explicit layout override. Compiled CSS is frozen here to preserve that rendering; it is not a reusable stylesheet or source of token values.

The article keeps its hero, stats, both chapters, contained photograph, page capture, and four screen tiles. Site chrome and the next-project promotion are deliberately outside this content tracer. Sanity was read only; no dataset writes occurred. Every image and both Figtree font subsets are local to the set. The font license accompanies them.

The authored review script is 6,094 bytes (1,983 gzip); its motion/control CSS is 2,590 bytes (996 gzip). Those sizes include the review controls and diagnostics, not an optimized production primitive. The approximately 2.9MB self-contained capture is mostly original raster assets. Production application bundle change: **zero bytes**; all files live in the O3 Storybook prototype directory. No runtime dependency was added.

## Review it

Run `pnpm storybook`, then open **Prototypes / IRONMAN — native narrative cadence (Sep 2026)**. The four stories select Native, Still, Reduced, or Rapid-scroll proof on the same article. The standalone URL is `/prototypes/2026-09-ironman-motion-cadence/index.html`.

Open the review dock for scene-entry jumps and the per-scene state. Native always honors the system reduced-motion setting. Replay returns to the top and re-arms only below-viewport content; it never hides the first view. Natural scroll remains available throughout. The dock is prototype-only and collapses so the composition can be inspected.

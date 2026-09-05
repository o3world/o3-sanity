# Spatial globe baseline

Run `pnpm globe:prototype`, then open http://localhost:3611/. The saved spatial scene is the sole development homepage treatment. The old `?spatial=depth&dots=sphere` link still shows this baseline; comparison parameters and controls are no longer used. Add `?spatial-still` for a fixed-frame review. OS reduced motion also stops the GPU animation and pointer response.

## Current combined baseline

The approved star field contains 4180 points: 1900 original stars, 2100 distant stars, and 180 nearby dust points. Main radii span 10000–9000000 units; the backfield spans 5000000–9000000 and added dust spans 8000–20000. Cursor angles remain 0.045/0.032 radians with checkpoint easing. Ambient star rotation retains the latest cursor direction at a 900-second revolution rate; globe motion is unchanged.

In this development shell, utility logos appear above the footer and the primary nav and hero use the existing strip-free spacing. Production shell behavior is unchanged.

The globe retains its later camera projection, smooth front/back shading, and star-occluding rails. The large red dots retain their shaded surfaces and solid cores, with their outer halos removed. The SVG bloom is tightened around the limb: ring radii 343/342/341, widths 7/10/1.5, and blur 7/9/3px. Original opacity values remain. A separate rail mask removes sky pixels before translucent rail colors are drawn, avoiding opaque black rails.

The cleaned baseline remains at commit `f864c071`; the earlier named checkpoint is unchanged.

## Saved appearance before this study

The scene contains 1900 crisp stars across a continuous spherical volume, with varied sizes, bright centers, slow circulation, and damped cursor response. Near and distant points move by different amounts without discrete depth bands. Star drift retains the approved 1.7× pace.

The seven seeded globe rails retain the original projection and orbit layout. Shaded dots draw above every rail, using opaque cores with soft red illumination. These are analytic sphere impostors, not mesh geometry. The static SVG bloom remains above the moving GPU artwork.

The sky extends behind the utility logos. The primary nav keeps its border, with transparent background and blur at the top; its surface returns progressively on scroll. The globe remains cropped at the hero's bottom edge.

## Checkpoint and scope

The exact approved version, including its comparison controls, remains at local tag `checkpoint/spatial-stars-bright` (commit `a7709d46`). This cleanup adopts that appearance as the single baseline. Neither the checkpoint nor this cleanup authorizes production adoption.

This is development-only work for GitHub issue 448, isolated from the abandoned navigation prototype. The branch starts at approved main baseline `34c1c563`. No schema, dataset, content, or shared component was changed. Nothing was merged, pushed, or deployed.

## Implementation and limits

vgpu 0.4.0 renders to a transparent canvas. The seed generator preserves the original random-number draw order. The rails use 288 samples rather than 72; dots use analytic sphere shading without halos, and colored-orbit breathing approximates CSS easing. This is not pixel-identical parity with the original export.

The original SVG remains available before GPU initialization and on failure or teardown. Its hidden animation remains mounted during GPU rendering, so this prototype is not a renderer-performance benchmark. Device-loss recovery, physical mobile performance, production bundle budgets, and exact image parity remain unverified. Port 3611 uses published content; draft authentication was not configured.

Browser checks cover desktop/mobile appearance, the fixed-frame preview, and route cleanup. Formatting, lint, and typechecks validate the local code. No new tests were added for the visual prototype.

Sources: `packages/ui/src/components/orbital-sphere.tsx`, the official globe exports, `docs/research/globe-frame-cadence-and-vgpu.md`, and vgpu's public API documentation.

## Shooting stars

A fine distant streak lasts 0.5 seconds at its original speed, with deterministic varied gaps of 22–42 seconds (the first appears after 8–18 seconds of active scene time). It projects from 500000 world units through the sky camera and renders behind globe rails and dots. Hidden/offscreen time does not advance the schedule; reduced motion and `spatial-still` suppress it. `?shooting-star-preview` holds one streak visible for inspection.

Stars behind the near plane and billboards wholly outside the viewport return clipped degenerate geometry before fragment shading. All 4180 stars still run vertex processing; this avoids hidden pixel work without CPU filtering. GPU time has not been benchmarked.

The hero keeps the original text spacing and reserves a separate grid row below the CTA for the globe, with 48–64px of separation plus a 16px globe inset. It fills at least one viewport but grows naturally for short screens and wrapped text; the glow can feather beyond the globe row without a hard clipping seam.

On scroll, stars and shooting stars rise an additional 1.5% of the hero's scrolled distance, capped at one hero height of travel. They keep cursor pitch but do not inherit the globe's downward scroll pitch. The globe retains its existing lag. The Y offset uses the same frame-rate-independent 0.94-per-30-Hz easing as cursor movement, including settling after scrolling stops. Reverse scrolling reverses the sky offset; reduced motion and fixed-frame inspection suppress it.

The star volume starts around a slightly tilted axis and eases toward the latest cursor direction. Eased scroll offset layers over that turn. The existing active-scene clock pauses it when hidden or offscreen; reduced motion and fixed-frame mode hold it still.

Checkpoint `checkpoint/spatial-sky-25m` (`3b5dd17b`) preserves the approved scene before adding more nearby dust. The subsequent working preview adds 180 nearby dust points at 8000–20000 units, with the existing crisp sizing and local drift. Original stars and backfield seeds remain unchanged; total count is 4180.

The added nearby dust also has seeded independent three-axis wander, varying its speed, phase, and range continuously without frame-to-frame jitter. Original stars retain their prior drift.

The latest scale study doubles the main star volume to 10000–9000000 units and the distant field to 5000000–9000000 units. The added nearby dust remains at 8000–20000 units.

Ambient star rotation retains the last cursor direction, easing changes into an accumulated quaternion orientation. The globe and scroll parallax are unchanged. Tiny pointer movements below two pixels are accumulated before steering.

The cursor-directed ambient spin now uses a 900-second revolution rate (15 minutes). Globe motion is unchanged.

A static tiled monochrome noise overlay softly dithers the lower hero glow to reduce visible dark-gradient banding. It uses no animation or additional blur; the text is above the overlay. Perceived banding remains display-dependent. This treatment is local to the prototype.

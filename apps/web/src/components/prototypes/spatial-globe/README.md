# Spatial globe baseline

Run `pnpm globe:prototype`, then open http://localhost:3611/. The saved spatial scene is the sole development homepage treatment. The old `?spatial=depth&dots=sphere` link still shows this baseline; comparison parameters and controls are no longer used. Add `?spatial-still` for a fixed-frame review. OS reduced motion also stops the GPU animation and pointer response.

## Saved appearance

The scene contains 1900 crisp stars across a continuous spherical volume, with varied sizes, bright centers, slow circulation, and damped cursor response. Near and distant points move by different amounts without discrete depth bands. Star drift retains the approved 1.7× pace.

The seven seeded globe rails retain the original projection and orbit layout. Shaded dots draw above every rail, using opaque cores with soft red illumination. These are analytic sphere impostors, not mesh geometry. The static SVG bloom remains above the moving GPU artwork.

The sky extends behind the utility logos. The primary nav keeps its border, with transparent background and blur at the top; its surface returns progressively on scroll. The globe remains cropped at the hero's bottom edge.

## Checkpoint and scope

The exact approved version, including its comparison controls, remains at local tag `checkpoint/spatial-stars-bright` (commit `a7709d46`). This cleanup adopts that appearance as the single baseline. Neither the checkpoint nor this cleanup authorizes production adoption.

This is development-only work for GitHub issue 448, isolated from the abandoned navigation prototype. The branch starts at approved main baseline `34c1c563`. No schema, dataset, content, or shared component was changed. Nothing was merged, pushed, or deployed.

## Implementation and limits

vgpu 0.4.0 renders to a transparent canvas. The seed generator preserves the original random-number draw order. The rails use 288 samples rather than 72; electron halos approximate Gaussian glow, and colored-orbit breathing approximates CSS easing. This is not pixel-identical parity with the original export.

The original SVG remains available before GPU initialization and on failure or teardown. Its hidden animation remains mounted during GPU rendering, so this prototype is not a renderer-performance benchmark. Device-loss recovery, physical mobile performance, production bundle budgets, and exact image parity remain unverified. Port 3611 uses published content; draft authentication was not configured.

Browser checks cover desktop/mobile appearance, the fixed-frame preview, and route cleanup. Formatting, lint, and typechecks validate the local code. No new tests were added for the visual prototype.

Sources: `packages/ui/src/components/orbital-sphere.tsx`, the official globe exports, `docs/research/globe-frame-cadence-and-vgpu.md`, and vgpu's public API documentation.

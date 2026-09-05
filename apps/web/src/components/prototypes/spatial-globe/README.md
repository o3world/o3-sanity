# Spatial globe prototype

Question: does the current orbital globe gain a sense of space when it sits within a quiet star field?

Run `pnpm globe:prototype`, then open http://localhost:3611/?spatial=depth.

The bottom controls switch between spatial stars, a more distant field, the GPU globe alone, and the original SVG. The URL preserves the selection. Append `&spatial-still` for a fixed-frame review. OS reduced motion also stops the GPU animation and pointer response.

This is a development-only experiment on the existing homepage, tracked by GitHub issue 448. It is isolated from the abandoned navigation prototype. The branch starts at the approved main baseline 34c1c563. No schema, content, dataset, or shared component was changed.

## Rendering

vgpu 0.4.0 draws the seven seeded great circles and their electrons from the original geometry in a transparent canvas. Projection, orbit rotation, and pointer tilt run in vertex shaders. The static SVG bloom remains in its existing position above the moving artwork. The original moving SVG is hidden only after the GPU submits a frame and is restored on teardown or GPU failure.

The prototype copies the original seed generator, including its random-number draw order. It uses 288 samples per circle instead of 72 to explore smoother contours. Electron halos use a shader approximation of the Gaussian glow, and colored-orbit breathing uses a cosine approximation of the CSS easing. This is not pixel-identical parity or a finished production port.

The stars occupy different depths and respond to the same damped pointer signal. Nearer stars move farther than distant stars. In Spatial stars, particles occupy a continuous spherical volume with slow circulation and independent dust eddies. Softness, drift, and perspective separation vary continuously rather than in depth bands. Cursor movement turns the viewpoint and adds a small translation. Distant stars retains the earlier, quieter comparison. Both fields fade toward the bottom of the hero. Copy and navigation retain their current layout and motion.

## Validation and limits

Rendered in the in-app browser at desktop and 402px mobile widths. Confirmed the GPU canvas replaces the moving SVG, the original comparison restores it, and leaving for Work removes the canvas and review controls. The fixed-frame preview remained at frame zero across observations. TypeScript and focused lint pass; no prototype tests were added.

This preview is for visual judgment. GPU device-loss recovery, physical mobile performance, precise image parity, and production bundle budgets have not been verified. The hidden SVG animation remains mounted while the GPU scene runs, so this prototype is not a renderer-performance benchmark. Port 3611 uses published content; draft authentication was not configured there. Nothing was merged, pushed, or deployed.

Sources: `packages/ui/src/components/orbital-sphere.tsx`, the official globe exports, `docs/research/globe-frame-cadence-and-vgpu.md`, and vgpu's public API documentation. Visual verdict pending.

Follow-up: Spatial stars now extends behind the utility logos. The nav keeps its existing border while its background and blur are transparent at the top, returning progressively on scroll. Ambient dust and circulation run at 1.7 times the initial speed. These changes are scoped to the spatial comparison and restore on teardown.

Globe dots are drawn after all rails so lines cannot paint across them. Their centers share the rail projection, and opaque cores use analytic sphere normals, diffuse lighting, and a small specular highlight. These are shaded sphere impostors, not mesh geometry.

Latest visual direction: a fine star field rather than large dust bokeh. Spatial stars uses 1900 points distributed across a wider continuous depth range, with tightly capped point sizes, restrained halos, near-neutral colors, and mostly dim stars. Dots: Glow / Shaded compares luminous rail dots with the earlier sphere treatment; Glow is the default.

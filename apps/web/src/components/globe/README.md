# Reusable O3 globe renderer

`GlobeProvider` supplies the O3 GPU renderer through `OrbitalRendererContext`. Every existing `OrbitalSphere` placement inherits it: homepage and interior heroes, closing CTA bands, and quote decorations. The shared UI component owns the seeded geometry, palette, layout, motion setting, and SVG fallback. The app owns vgpu, the sky, and GPU lifecycle; other apps keep the SVG renderer.

The provider is currently enabled only in the development shell. This is a local integration, not staging activation. The approved appearance is saved at `4530b605` before extraction.

Each instance waits until near the viewport before importing and starting the renderer. React owns its canvas through a portal, avoiding the earlier imperative insertion into an unhydrated hero. The SVG animation stops after the first GPU frame and resumes on failure. Abort disposes GPU resources and listeners; intersection and document visibility pause frame submission, and resize observation refreshes geometry. Reduced motion and `motion="still"` draw a fixed frame.

Only the homepage opener requests stars. Other placements allocate neither stars, shooting stars, nor rail masks. Hero presets inherit the approved compact SVG glow; background and line presets retain their palette and opacity. Dot illumination is red only for the hero preset. Star masks erase sky pixels before translucent rails are painted.

Validation: 3,113 unit/render tests passed. Browser inspection covered homepage desktop/mobile (402px, no horizontal overflow), Work hero and closing CTA, and About's line preset. The offscreen Work hero's frame counter remained unchanged while its CTA ran. No browser errors were reported in that route walkthrough. The UI story `RendererHandoff` exercises SVG visibility, pulse suspension, and recovery independently of GPU availability.

The production build and rendering-strategy assertion passed with the existing production gate disabled; every route remained inside its configured budget. Ten globe story checks passed, including renderer handoff and SVG recovery.

Before staging activation: benchmark GPU/frame cost on physical mobile hardware and with multiple visible instances, exercise actual device loss and reduced-motion settings, and review quote/background placements with representative content. Instances currently own separate GPU devices; offscreen pausing is verified, but GPU timing and memory are not benchmarked. These limits are not a claim of production readiness.

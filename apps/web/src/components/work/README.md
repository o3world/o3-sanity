# Our work

The existing case showcase section uses `OrganicWorkCard` and `WorkStarfield` by default. Its CMS content and links stay in the existing `CaseStudyCard`; there is no study flag, query switch, or startup script. Old `workMembrane` and `hideWorkCards` query parameters have no effect.

Cards share one layout width. Their photo and scrim use a continuous SVG clip with bounded outward movement, preserving the content padding. Text stays in selectable HTML, card dragging is disabled, and selection holds the card still. Scroll and nearby cursor velocity feed a damped spring; idle drift stays at 2px horizontally and 3px vertically. Images do not zoom.

Native view timelines fade the cards at both viewport edges. Reduced motion, keyboard focus, and browsers without view-timeline support retain full visibility. Animation stops offscreen, in hidden tabs, or through the site's Reduce motion control.

The starfield shares the existing globe GPU runtime and its 4,180-star scene. A viewport-sized canvas follows depth-aware Y travel, initialized at the current section position on first visible paint so history restoration does not replay the travel. GPU imports remain deferred. The hero uses the same depth-based scrolling direction.

`work-membrane-path.test.ts` checks the content-safe perimeter at six responsive sizes and maximum bends. `work-starfield-camera.test.ts` checks restoration, scroll direction, and paused motion. The measurements and remaining device/compositor checks are recorded in `docs/research/work-motion-performance-2026-09-07.md`.

For the local production build, run `pnpm --filter @o3/web preview`. It runs rendering, cached-404, and bundle-budget assertions before serving the site at `http://localhost:3612/`. Rebuild after source changes.

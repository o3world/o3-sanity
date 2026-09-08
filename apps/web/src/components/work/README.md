# Our work

The homepage binds the existing rectangular `CaseStudyCard` to `CaseCardStack`. Desktop cards pin and layer when they fit below the navigation; mobile and short-window cards stay in document flow so their full content remains reachable. The prior card widths, spacing, padding, image shading, and disabled hover zoom remain in `work-cards.css`.

The unused starfield and organic-card modules and their dedicated tests have been removed. Their complete prior state, including styles, remains on `backup/pre-justin-design-reversion-2026-09-08` (`3216cda1`). The hero globe and stars are unchanged.

For the local production build, run `pnpm --filter @o3/web preview`. It runs rendering, cached-404, and bundle-budget assertions before serving the site at `http://localhost:3612/`. Rebuild after source changes.

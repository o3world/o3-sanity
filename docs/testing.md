# Testing

Three layers, one runner. Decisions and rationale: [ADR 0004](adr/0004-layered-test-approach.md).

**Tests are a checkpoint, not a loop.** Run them at milestones — before opening a PR, after a
migration batch, after wiring a new block. There is no pre-commit or pre-push hook, and `pnpm verify`
is unchanged. Don't leave a watcher running or re-run the suite after every edit.

```bash
pnpm test           # all three layers — the checkpoint  (~5s)
pnpm test:fast      # unit + render, skips the browser   (~1.6s)
pnpm test --project unit      # one layer
```

There is deliberately no "test only what changed" script. `vitest --changed` resolved to
"No test files found, exiting with code 0" here — it passes without running anything, which is
the worst possible failure mode for a check. The full suite is ~5s; just run it.

## Which layer?

| You want to know                             | Layer     | Write                                         |
| -------------------------------------------- | --------- | --------------------------------------------- |
| Does this function do the right thing?       | `unit`    | `thing.test.ts` next to `thing.ts`            |
| Does this page/document display its content? | `render`  | `thing.render.test.tsx` next to the entry     |
| Does this component look and behave right?   | `stories` | `thing.stories.tsx` — **no test file needed** |

The suffix is the layer. Nothing else configures which project a test lands in.

---

## `unit` — pure functions

Node, no React, no filesystem beyond the committed migration JSON.

Two kinds live here:

- **Mappers and helpers.** `tools/migration/src/map/*.test.ts`, `packages/content-runtime/src/**`. Migration
  mappers are pure `WpThing → Mapped<Doc>` functions, so a new ACF module type means one arm in the
  mapper and one case in its test.
- **Wiring a compiler cannot see.** `apps/o3xo/src/brandBinding.test.ts` reads the app's own files
  and asserts the four things that would otherwise fail silently in a browser: the brand reaching
  the bundles, the token layer's import order, `data-brand` on `<html>`, and a route directory per
  collection prefix. Same shape as `packages/ui/src/components/ui/shadcn-seam.test.ts` — a
  filesystem lint, in the layer that needs no React.
- **Corpus invariants.** `tools/migration/src/converted.test.ts` runs over everything actually
  committed under `data/converted/` — every document validates against its zod gate, every author
  and category reference resolves, no body block type the schema doesn't allow, no WP thumbnail
  smuggled in as an asset. This is the check that scales as the corpus grows toward ~340 documents;
  it costs nothing to keep and catches the class of error that survives a green build.

## `render` — pages and documents, no network

Renders a real route through the real route builder, with fixture documents instead of Sanity.

```tsx
import { buildDetailRoute } from '@o3/content-runtime/routes'
import { anInsight, renderRoute, expectNotFound } from '@/test'

import { insight } from './entry'

const route = buildDetailRoute(insight)

it('displays the fields a reader came for', async () => {
  const { html, metadata } = await renderRoute(route, {
    data: anInsight({ title: 'Headless CMS vs traditional CMS' }),
    params: { slug: 'headless-cms' },
  })

  expect(html).toContain('Headless CMS vs traditional CMS')
  expect(metadata.title).toBe('Headless CMS vs traditional CMS')
})

it('404s when nothing matches', async () => {
  await expectNotFound(route, { data: null, params: { slug: 'nope' } })
})
```

`renderRoute` returns `{ html, metadata, calls }`. `calls` is every `sanityFetch` the render made —
use it to assert cache tags and the stega-off rule on metadata.

**Fixtures are typed against the generated query results** (`anInsight`, `aPage`,
`aInsightsPage` in `@/test`). A query projection change breaks stale fixtures at compile time,
the same guardrail the block registry uses. Pass only the field your assertion is about.

**`aMigratedInsight(slug)` loads a real converted document** and shapes it into what the query
returns. That is the migration → render bridge: a mapper change producing something the renderer
can't display fails here rather than in Studio. `migratedInsightSlugs()` sweeps all of them.

**The 402 half of ADR 0006 is assertable** via the responsive helpers, exported from `@/test` in the
app and from `@o3/content-ui/testing` in the package that now holds the renderers:
`unprefixedHorizontalScrollUtilities(html)` must come back empty — a bare `overflow-x-auto`/`snap-x`
is a phone getting a scroll region where the frame draws a stack — and `variantsOf(html, 'gap-12')`
pins a utility to the widths that emitted it when the two frames disagree on a value.

The layer collects `apps/web/src/**` and `packages/*/src/**` — the renderers moved to
`@o3/content-ui` (#212) and their render tests moved with them, while the app keeps the route- and
view-level ones. A moved test reaches its helpers by package subpath; only app tests get the `@/`
alias.

**`apps/o3xo` has no render tests yet**, and the reason is the harness rather than the app: the `@/`
alias and `renderRoute`/fixtures/stubs live in `apps/web/src/test`, and the project resolves one
`@/` and one brand. A per-app render layer wants the harness promoted to a package first — until
then the second app's route entries are covered by its unit-layer binding test and by both apps'
`next build`.

Four modules are stubbed (see `vitest.config.mts` for why each): `@o3/content-runtime/live` is the
network seam, `next/image` renders a plain `<img>`, `next/headers` lets a test pick the draft or
published path, and `next/dynamic` becomes `React.lazy` — without that last one every registered
View renders blank, silently. The live stub is aliased twice, once per specifier: the app imports
the package subpath, the route builders inside the package import `#live`.

## `stories` — components in a real browser

Every story under the roots `packages/story-kit`'s `STORY_ROOTS` names — `packages/ui/src`,
`packages/content-ui/src`, `apps/web/src` — is mounted in headless Chromium with real CSS
and scanned by axe. **Writing the story is writing the test** — there is no second file, which is
why the wireframe build-out gets its safety net for free.

`HeroSection.stories.tsx` is the pattern for section blocks: a story per state the prototype shows.

Structural a11y (roles, labels, alt text, heading order) fails the run. `color-contrast` is held
back — the 12 current violations are all muted-foreground tokens, which is a palette decision, not a
component defect. See the note in `.storybook/preview.ts`.

> **Import `stegaClean` from `@sanity/client/stega`, never the `next-sanity` barrel.** The barrel is
> heavy and the lint rule enforcing this stays. The old reason — that `@portabletext/react`'s
> `react/compiler-runtime` import could not resolve under Storybook's Next preset — is fixed:
> `.storybook/main.ts` now pins that entry for the dependency pre-bundle as well as the module
> graph. Portable text renders in Storybook.

### `Pages` — whole pages, from the committed seeds

`apps/web/src/stories/pages/` renders each seeded page through the **real block renderer**, inside
the real nav and footer, from `tools/migration/data/` — real copy, real order, real uploaded
imagery. Frame-backed pages carry a `parameters.design` link to their canonical Figma frame, so the
built page and the frame sit one tab apart.

This is the level a Figma page frame is actually drawn at, and it answers what no single block story
can: the surface sequence between bands, the rhythm between them, and the pinned nav's ink flip
against real content. It found three defects on its first run — a skipped heading level on
`/solutions`, a `<dl>` full of `<p>`s in `statGroup`, and a keyboard-unreachable scroller on
`/live`.

Fixtures come from `@o3/content-ui/testing/seed`, which shares its projection with the render layer
(`@o3/content-ui/testing`) and differs only in loading JSON by static import rather than
`node:fs`, and in resolving **real** asset ids out of the committed `data/assets.json` — a browser
actually loads the picture, so a fabricated id would be a mockup of empty boxes.

`seededSectionArgs(page, type)` gives a section block its "as seeded" story from the same source, so
a block story cannot drift from the content the site ships.

## What is deliberately not here

- **No pixel-diff visual regression.** Baselines churn during an active redesign and drift across
  platforms, and they answer "did this change" rather than "is this right". Wireframe fidelity is a
  human call in Storybook, beside the `addon-designs` frame.
- **No coverage thresholds.** They reward volume over judgement. Add a test when it would have
  caught something.
- **No end-to-end browser suite.** CI already deploys a preview per PR; that is the smoke test.

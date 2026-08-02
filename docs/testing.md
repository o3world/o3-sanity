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

- **Mappers and helpers.** `tools/migration/src/map/*.test.ts`, `apps/web/src/lib/**`. Migration
  mappers are pure `WpThing → Mapped<Doc>` functions, so a new ACF module type means one arm in the
  mapper and one case in its test.
- **Corpus invariants.** `tools/migration/src/converted.test.ts` runs over everything actually
  committed under `data/converted/` — every document validates against its zod gate, every author
  and category reference resolves, no body block type the schema doesn't allow, no WP thumbnail
  smuggled in as an asset. This is the check that scales as the corpus grows toward ~340 documents;
  it costs nothing to keep and catches the class of error that survives a green build.

## `render` — pages and documents, no network

Renders a real route through the real route builder, with fixture documents instead of Sanity.

```tsx
import { buildDetailRoute } from '@/lib/content-routes/build'
import { aPerspective, renderRoute, expectNotFound } from '@/test'

import { perspective } from './entry'

const route = buildDetailRoute(perspective)

it('displays the fields a reader came for', async () => {
  const { html, metadata } = await renderRoute(route, {
    data: aPerspective({ title: 'Headless CMS vs traditional CMS' }),
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

**Fixtures are typed against the generated query results** (`aPerspective`, `aPage`,
`aPerspectivesPage` in `@/test`). A query projection change breaks stale fixtures at compile time,
the same guardrail the block registry uses. Pass only the field your assertion is about.

**`aMigratedPerspective(slug)` loads a real converted document** and shapes it into what the query
returns. That is the migration → render bridge: a mapper change producing something the renderer
can't display fails here rather than in Studio. `migratedPerspectiveSlugs()` sweeps all of them.

**The 402 half of ADR 0006 is assertable** via `@/test`'s responsive helpers (`responsive.ts`):
`unprefixedHorizontalScrollUtilities(html)` must come back empty — a bare `overflow-x-auto`/`snap-x`
is a phone getting a scroll region where the frame draws a stack — and `variantsOf(html, 'gap-12')`
pins a utility to the widths that emitted it when the two frames disagree on a value.

Four modules are stubbed (see `vitest.config.mts` for why each): `@/sanity/live` is the network
seam, `next/image` renders a plain `<img>`, `next/headers` lets a test pick the draft or published
path, and `next/dynamic` becomes `React.lazy` — without that last one every registered View renders
blank, silently.

## `stories` — components in a real browser

Every story under `packages/ui/src` and `apps/web/src` is mounted in headless Chromium with real CSS
and scanned by axe. **Writing the story is writing the test** — there is no second file, which is
why the wireframe build-out gets its safety net for free.

`HeroSection.stories.tsx` is the pattern for section blocks: a story per state the prototype shows.

Structural a11y (roles, labels, alt text, heading order) fails the run. `color-contrast` is held
back — the 12 current violations are all muted-foreground tokens, which is a palette decision, not a
component defect. See the note in `.storybook/preview.ts`.

> **Import `stegaClean` from `@sanity/client/stega`, never the `next-sanity` barrel.** The barrel
> drags in `@portabletext/react`, whose `react/compiler-runtime` import cannot resolve under
> Storybook's Next preset — which breaks every story for the block that imports it. A lint rule
> enforces this.

## What is deliberately not here

- **No pixel-diff visual regression.** Baselines churn during an active redesign and drift across
  platforms, and they answer "did this change" rather than "is this right". Wireframe fidelity is a
  human call in Storybook, beside the `addon-designs` frame.
- **No coverage thresholds.** They reward volume over judgement. Add a test when it would have
  caught something.
- **No end-to-end browser suite.** CI already deploys a preview per PR; that is the smoke test.

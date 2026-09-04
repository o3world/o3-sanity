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
use it to assert cache tags and the stega-off rule on metadata. `expectNotFound` returns the same
list, so a 404 is assertable on what it read rather than only on the fact that it 404'd.

**Fixtures are typed against the generated query results** (`anInsight`, `aCaseStudy`,
`anInsightsPage` in `@/test`). A query projection change breaks stale fixtures at compile time,
the same guardrail the block registry uses. Pass only the field your assertion is about.

**`aMigratedInsight(slug)` loads a real converted document** and shapes it into what the query
returns. That is the migration → render bridge: a mapper change producing something the renderer
can't display fails here rather than in Studio. `migratedInsightSlugs()` sweeps all of them. It is
`apps/web`'s, like every fixture that reads a tree off disk; `apps/o3xo`'s `aSeededPage()` reads
that app's bootstrap documents instead.

**The 402 half of ADR 0006 is assertable** via the responsive helpers, exported from `@/test` in the
app and from `@o3/content-ui/testing` in the package that now holds the renderers:
`unprefixedHorizontalScrollUtilities(html)` must come back empty — a bare `overflow-x-auto`/`snap-x`
is a phone getting a scroll region where the frame draws a stack — and `variantsOf(html, 'gap-12')`
pins a utility to the widths that emitted it when the two frames disagree on a value.

**The layer is `@o3/render-kit`, and each app instantiates it** (#227). A vitest project resolves
one `@/` alias and carries one environment, so the two brand apps are two projects — `render` and
`render:o3xo` — built by one `renderProject()` call each in `vitest.config.mts`. Run both with
`pnpm test --project 'render*'`.

The `render` project also collects `packages/*/src/**`: the renderers moved to `@o3/content-ui`
(#212) and their render tests moved with them, while an app keeps the route- and view-level ones.
Those components take a brand's tokens from CSS this layer never loads, so one run of them covers
both apps. A moved test reaches its helpers by package subpath; only app tests get the `@/` alias.

**The brand is pinned per project, beside the port** — `NEXT_PUBLIC_BRAND: 'o3xo'` on the second
one. `next.config.ts` is what supplies it to the running app and vitest never loads that file, so
an unpinned project gets `brandConfig()`'s fallback of `o3`: every URL the second app builds would
canonicalise to o3world.com and link case studies at `/work`, and the assertions would agree with
it. Seven of `apps/o3xo`'s render tests fail the moment the pin is removed, which is what it is for.

Four modules are stubbed (see `@o3/render-kit`'s `project.ts` for why each):
`@o3/content-runtime/live` is the network seam, `next/image` renders a plain `<img>`, `next/headers`
lets a test pick the draft or published path, and `next/dynamic` becomes `React.lazy` — without that
last one every registered View renders blank, silently. The live stub is aliased twice, once per
specifier: the app imports the package subpath, the route builders inside the package import
`#live`.

## `stories` — components in a real browser

Every story is mounted in headless Chromium with real CSS and scanned by axe. **Writing the story
is writing the test** — there is no second file, which is why the wireframe build-out gets its
safety net for free.

One project per Storybook host, because a host carries one brand's tokens. `stories` is the O3
host: the shared roots `packages/story-kit`'s `SHARED_STORY_ROOTS` names — `packages/ui/src` and
`packages/content-ui/src` — plus `apps/web/src` and the captured prototypes, under O3's paint.
`stories:o3xo` is the O3XO host, cut back to `apps/o3xo/src`: the shared packages are already
covered, and what is left is the components whose token roles only O3XO's package declares.

`HeroSection.stories.tsx` is the pattern for section blocks: a story per state the prototype shows.

Structural a11y (roles, labels, alt text, heading order) fails the run. `color-contrast` is held
back — the 12 current violations are all muted-foreground tokens, which is a palette decision, not a
component defect. See the note in `defineStorybookPreview`.

> **Import `stegaClean` from `@sanity/client/stega`, never the `next-sanity` barrel.** The barrel is
> heavy and the lint rule enforcing this stays. The old reason — that `@portabletext/react`'s
> `react/compiler-runtime` import could not resolve under Storybook's Next preset — is fixed:
> `defineStorybookConfig` now pins that entry for the dependency pre-bundle as well as the module
> graph, on both hosts. Portable text renders in Storybook.

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

## The build's own output

Rendering strategy is asserted one level above all three layers, against the build itself.
`pnpm build:assert` reads `apps/web/.next` and fails when a route the allowlist does not permit
is server-rendered on demand, naming the route. The allowlist is
[`tools/build-assert/src/policy.ts`](../tools/build-assert/src/policy.ts), and CI runs the assertion
as its own job. See [the tool's README](../tools/build-assert/README.md).

This is why no route needs its own "is it static?" test: staticness is checked once, for every route
there is.

## The production navigation contract

One exception to the component-browser boundary covers page motion through the real App Router
([ADR 0004](adr/0004-layered-test-approach.md#2026-09-04-addendum-a-production-navigation-contract)).
Stories cannot reproduce a production route commit, retained route trees, or native history.

```bash
pnpm --filter @o3/web build
pnpm build:assert
pnpm exec playwright install chromium webkit firefox # once per Playwright version
pnpm motion:contract
```

The contract starts the **built** O3 app itself, on `localhost` at the worktree's provisioned
`WEB_PORT`. It refuses an occupied port. `MOTION_CONTRACT_PORT=3603 pnpm motion:contract` can choose
another free O3 Sanity-registered port (3600–3609); using an arbitrary origin can break client reads
through CORS and is not equivalent evidence. No dataset is written or seeded by this command.

The matrix is Chromium, Playwright WebKit, and Firefox at 1440×1000 and touch-enabled 402×874,
each with normal and reduced motion. The stationary mouse case is desktop/normal only; the
preference-change case starts normal. The other journeys run in every profile. Missing animation
APIs and JavaScript-disabled direct requests are separate fallback cases. These current engine
builds do not prove every older supported version, branded Safari, or physical-device behavior.
On macOS, WebKit's full-link traversal uses its native Option-Tab shortcut; ordinary Tab may move
focus to browser chrome. No test changes system keyboard preferences.

`apps/web/motion-contract/` records destination readiness separately from fade completion, real
input while the page is fading, history/scroll/focus, nav ink, and hidden-route isolation. It is
an integration checkpoint, not a new general E2E suite or a substitute for `pnpm test`. Run it when
route motion, framework navigation, or the shell changes. The app's lint/typecheck includes it.

Timing and browser-version attachments, failure traces/screenshots, and the HTML report stay in
gitignored `test_output/motion-contract/`. Run a single profile with
`pnpm motion:contract --project=webkit-mobile-no-preference` when investigating a failure. It reads
the configured Sanity dataset, so missing published content or external service failures must be
diagnosed rather than replaced by a fake route.

## What is deliberately not here

- **No pixel-diff visual regression.** Baselines churn during an active redesign and drift across
  platforms, and they answer "did this change" rather than "is this right". Wireframe fidelity is a
  human call in Storybook, beside the `addon-designs` frame.
- **No coverage thresholds.** They reward volume over judgement. Add a test when it would have
  caught something.
- **No general end-to-end browser suite.** The production navigation contract above is the narrow
  exception. Deployment previews remain the broader smoke-test surface.

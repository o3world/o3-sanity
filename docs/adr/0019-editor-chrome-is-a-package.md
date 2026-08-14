# 0019. The editor chrome is one package, across Studio, site and server

- **Status:** Accepted
- **Date:** 2026-08-13
- **Deciders:** NickO3 + Claude
- **Related:** [issue #99](https://github.com/o3world/o3-sanity/issues/99), [issue #60](https://github.com/o3world/o3-sanity/issues/60), [ADR 0004](./0004-layered-test-approach.md), [ADR 0015](./0015-enter-draft-mode-via-studio-token-verified-against-project-host.md), `packages/editor-chrome`

## Context

Editors kept paying for the gap between structure mode and Presentation. Three
symptoms, one shape: `/studio` opened on a document list rather than the site;
a document found in that list had no way to be _seen_ short of retyping its URL
into the preview frame; and an editor already reading the site had the preview
switcher (#60) but no way into the Studio from the page they were on.

None of the three is specific to this project. Every Sanity + Next site with an
embedded Studio has the same seam, and the pieces #60 already built —
`draftPreview.ts`, `draftModeRoutes.ts`, the three-layer switcher — were written
as if they were about o3world.com when only four values actually are (the
project id, the Studio's base path, and the two draft-mode route paths).

## Decision

**One package, `@o3/editor-chrome`, with three subpath exports and no build
step**, because the three surfaces are one feature and share a vocabulary:

- **`./studio`** — the `definePlugin` plugin (the "Open in Presentation"
  document action) plus `defaultToolFirst`. Imports `sanity`.
- **`./toolbar`** — the editor toolbar: shell / behaviour chip / pure view,
  and the token, visibility and href helpers under them. Imports `next` and
  `next-sanity`, never `sanity`.
- **`./draft-mode`** — the two route handlers, plain `Request` in and plain
  `Response` out. Imports nothing.

Framework deps are `peerDependencies` (mirrored into `devDependencies` so the
package typechecks on its own). `apps/web` keeps only the four values above, in
`src/sanity/editorToolbar.ts`, and its route files are adapters.

Three facts about `sanity@6.8` decided the shape, and all three were read out of
the shipped source rather than assumed:

**The presentation URL is `?preview=<encoded path>`, unscoped.** Presentation's
router declares `__unsafe_disableScopedSearchParams`, so the param sits at the
root of the query string rather than as `presentation[preview]=`;
`preservedSearchParamKeys` fixes the name and `getIntentState` defaults it to
`/`. The tool's route segment is its `name` option, default `presentation`
([Configuring the Presentation
Tool](https://www.sanity.io/docs/visual-editing/configuring-the-presentation-tool)).

**Inside the Studio you navigate by intent, not by URL.** The action mirrors
Presentation's own `openInStructure` field action: `useRouter()` from
`sanity/router`, then `navigateIntent('edit', {id, type, mode: 'presentation',
presentation: <toolName>, preview: <path>})`. `mode` is what makes it land —
both tools return a bare `true` for an edit intent carrying only `id` and
`type`, and `resolveIntentState` breaks that tie on array position, so without
a mode the action would follow whichever tool happens to be first.

**There is no `defaultTool` option.** `resolveUrlStateWithDefaultTool` takes the
first entry of the resolved `tools` array, and Sanity's [Tools common
patterns](https://www.sanity.io/docs/studio/tools-cheat-sheet) guide names
sorting that array as the supported way to configure it — so
`tools: (prev) => defaultToolFirst(prev, 'presentation')` is the mechanism, and
the `plugins` array keeps reading structure-then-presentation.

## Alternatives considered

### Reorder the `plugins` array instead of the `tools` array

- **Pros:** one line shorter; no callback.
- **Cons:** `plugins` order is also _plugin_ order, so it moves Presentation's
  form input, field actions and locale bundle ahead of structure's document
  actions for reasons that have nothing to do with which tool opens first. It
  also hides the intent behind a side effect — nothing in a plugin list says
  "and this one is the landing page".
- **Why not:** the `tools` callback is the documented lever, and it names what
  it does. Both routes reorder the same resolved array, so neither avoids the
  intent consequence below; only one of them explains itself.

### Guard the presentation tool's `canHandleIntent` so cold edit intents stay in structure

Presentation-first means a **cold** `edit` intent — one arriving with no `mode`
param and no current tool, i.e. a deep link pasted from outside — resolves to
Presentation for every type, including `person` and `siteSettings`. We
considered wrapping the tool's `canHandleIntent` in the `tools` callback to
decline those.

- **Pros:** non-routable types would keep landing in the list-and-form layout
  they belong to.
- **Cons:** Presentation renders `DocumentPane` from `sanity/structure` — the
  same editor — so the document is fully editable either way; the only
  difference is a preview frame showing `/` beside it. Meanwhile the guard
  would be our code overriding a plugin's own intent contract, and the intents
  that actually matter are unaffected: a search result or reference click from
  inside structure keeps `currentTool` first in `resolveIntentState`, and every
  deliberate cross-tool jump carries a `mode`.
- **Why not:** a real cost paid on every intent to avoid a cosmetic one paid on
  a rare deep link. Revisit if editors report landing somewhere odd — the guard
  is a small, testable addition to `defaultTool.ts` if the trade ever flips.

### Keep everything in `apps/web`

- **Pros:** no package to name, no peer deps to keep in step, no import churn.
- **Cons:** the next project starts from a copy-paste, and copy-paste is what
  ADR 0015's security contract cannot survive — the "token is a hint, the
  server verifies" rule is one `if` away from being lost in transcription.
- **Why not:** #99 asked for something sharable, and the code was already
  generic in everything but its imports.

### One package per surface (`@o3/studio-chrome`, `@o3/preview-toolbar`, …)

- **Pros:** each has a single dependency footprint; a consumer wanting only the
  toolbar installs only `next`.
- **Cons:** three of them would depend on a fourth for `safeReturnPath`, the
  presentation URL and the tool name — the vocabulary is the shared part. Three
  package.jsons, three version lines, and a four-way release dance for a
  feature that ships as one.
- **Why not:** subpath exports already give per-surface dependency isolation,
  since nothing outside `./studio` imports `sanity`.

## Consequences

- **Positive:** `/studio` lands where editors work; every routable document has
  a one-click door into Presentation; the toolbar carries an "Edit this page"
  link on any page, backed document or not (`/work` and `/insights` have no
  document, and the link still resolves because Presentation renders the
  route). The next project imports three entry points and supplies four values.
- **Positive:** ADR 0015's contract moved intact — `verifyStudioToken` still
  asks the project host, still requires `id` **and** `roles[]`, still fails
  closed — and its test moved with it. `projectId` is now a required argument
  rather than a defaulted one, which removes the way it could quietly be wrong.
- **Negative:** the Studio-internals dependency from ADR 0015 (the
  `__studio_auth_token_<projectId>` key) is now a _package's_ dependency on
  Studio internals, so a Sanity upgrade that changes it fails quiet for every
  consumer at once. Still one line, still pinned with its provenance.
- **Negative:** two more couplings to `sanity@6.8` internals — the `preview`
  search param and the positional default tool. Both are read from the shipped
  source, both are covered by unit tests over the builders, and neither has a
  typed API to depend on instead.
- **Risks / open questions:** the package is source-only with no build step,
  matching every other package here. Sharing it outside this monorepo means
  either publishing built artifacts or the consumer transpiling it — a decision
  deferred until there is a second consumer.

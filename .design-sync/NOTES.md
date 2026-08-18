# design-sync notes — @o3/ui → claude.ai/design

Repo-specific gotchas for the next sync. Read this before running anything.

## The package ships no build

Every workspace package here is source-only (`noEmit: true`, `exports` pointing
at `./src/*`); Next and Vite consume the TypeScript directly. Two consequences:

- The converter bundles from `packages/ui/src/index.ts` via `--entry`. There is
  no `dist/` JS and none is needed — esbuild compiles the source.
- Component discovery and every prop contract are read from a `.d.ts` tree, so
  declarations have to exist or the sync finds **zero** components. `cfg.buildCmd`
  emits them to `packages/ui/dist/types` (gitignored by the root `dist/` rule).
  `packages/ui/package.json` carries `publishConfig.types` pointing there — the
  converter honours that key when the file is on disk, and it stays inert for the
  repo itself (the package is `private: true`, and in-repo resolution goes through
  `exports`, so nothing resolves types from a stale build).

## Storybook covers three trees; only one is this design system

`apps/storybook` globs stories from `packages/ui`, `apps/web`, AND
`apps/storybook/prototypes` — 73 titles, of which 29 are `@o3/ui`. `cfg.titleMap`
nulls the other 44. Two of those exclusions are load-bearing:

- **`Button: null`** — `apps/web`'s base-block Button story. Title matching is by
  segment, and `Content/Blocks/Base/Button` matches the DS's `Button` export while
  the DS's own story (`components/ui/button`, lowercase) does not. Without this the
  Button card is fed the web app's Sanity block story. `"button": "Button"` maps the
  real one. **If a card ever looks like it belongs to the site rather than the kit,
  this is the failure mode.**
- **`ButtonIcons: "ExternalLinkIcon"`** — the story has no `ButtonIcons` export; it
  declares `ExternalLinkIcon` as its component and renders the whole `BUTTON_ICONS`
  set. Mapped to what the story itself declares.

The `Foundations/*` titles (Overview, Color, Gradient, Typography, Layout, Button
spec) are token-documentation pages with no component export, so they cannot sync as
components. Their content is what `conventions.md` enumerates instead.

`apps/web` (section blocks, page compositions, site chrome) was deliberately left
out of this sync — it is a Next app with no barrel export whose components take
Sanity document props. Agreed with Nick as a possible second pass.

## [GENERAL] Stories pin a surface with a storybook global

20 of 29 components set `globals: { backgrounds: { value: 'ink' | 'bone' } }` to pin
one of the three O3 surfaces. That is a **backgrounds-addon global**, not DS styling,
and the stock preview wrapper drops it (`globals: {}`) — so a light-on-ink component
previews on white and reads as unstyled or invisible (`Button/Light` was the tell).

Fixed by a declared fork, `.design-sync/overrides/preview-gen-storybook.mjs`: the
wrapper carries the story's globals and paints the surface, and honours
`parameters.layout` the way the storybook canvas does. Surface values are copied from
`apps/storybook/.storybook/preview.ts` → `backgrounds.options`. **If that block's
values change, the fork's `SURFACES` map has to change with it** — nothing detects
the drift.

Note the addon's hexes are approximations of the real surface tokens (the addon
calls ink `#030303` where `--color-ink` is `#0a0a0b`, and bone `#efeeec` where
`--color-bone` is `#f1f0ec`). The fork mirrors the **addon**, deliberately: the
addon is what the storybook oracle paints, so mirroring it is what makes the two
panels comparable.

## [GENERAL] The stock wrapper replaced story parameters instead of merging them

Second defect in the same seam, and it hides behind the first. Storybook merges
parameters (meta ← story); the stock `compose` did
`parameters: story.parameters ?? meta.parameters`. So any story that declared a
parameter of its own — a `design` Figma link, a `controls` toggle — silently lost
meta's `layout: 'fullscreen'` and got the padded layout instead, which showed up as
a thin ring of surface colour around full-bleed components (`CollectionHero/Interior`
was the tell, and it is only visible where the ring's colour differs from the
component's own, i.e. ink-on-ink).

The same fork now merges. Worth knowing that this ALSO cleared the last
`[GRID_OVERFLOW]` and `[RENDER_THIN]` warnings — validate went from 11 warnings to
0 — because those components were being measured with the wrong layout.

**A comment inside the fork's `COMPOSE` constant may not contain a backtick.**
`COMPOSE` is a template literal; a stray backtick in a comment terminates it and the
build dies with a syntax error pointing at the fork.

## Presentation overrides

`cfg.overrides` carries `cardMode` for 8 components the validator flagged as
`[GRID_OVERFLOW]` — full-bleed bands and wide matrices (`column`), and
`ReadingProgress`, whose bar is `position: fixed` and escapes any cell (`single`,
primary story `Scrolling`).

## No story fetches a remote asset

The `[ASSETS_BLOCKED]` canary does not apply to this repo: the only image in any
`packages/ui` story is an inline `data:` SVG. A network-sandboxed shell cannot
produce false passes here.

## Story cap

Run compare with `--max-stories 9`. Button has 9 stories with genuinely distinct
variants and the default cap of 6 would leave three ungraded.

## The [RENDER_THIN] warning on glyph components was a false positive

`ArrowIcon`, `CloseIcon` and `MenuIcon` were flagged "mounts have no text and paint
nothing". They are inline-SVG glyphs (ADR 0009) and legitimately have no text. Once
the fork painted the pinned surface behind them the warning cleared on its own. If
it returns, check the surface before authoring an owned preview — the glyphs
themselves were never wrong.

## Every preview capture is a fixed 900x700 viewport

Storybook captures full page; the preview panel does not. Any story taller than
700px is CLIPPED in the sheet, which reads as missing content. Three stories in this
kit trip it — `SectionShell/AllSurfaces` (2174px, three bands), `CaseChapter/WithDetails`
(1126px, three detail rows) and `Reveal/ScrollDemo`. All three were verified by
measuring the real DOM in headless chromium rather than by raising the viewport:
`cfg.overrides.<Name>.viewport` is also the PRODUCT card size, so raising it to suit
one tall story degrades the framing of that component's other stories.

## `templates/` in the project is human work — never delete it

The project contains `templates/section-shell-motion/`, authored in Claude Design,
not produced by this build. It survives a re-sync only because `templates/**` is
absent from the upload plan's delete globs (`components/`, `tokens/`, `fonts/`,
`_vendor/`, `_preview/`, `guidelines/`). **Do not add `templates/**` to the plan's
deletes, and do not "reconcile" it away** because the local build does not produce
it — the reconciliation pass must only remove paths under the globs above.
`_ds_manifest.json` and `_adherence.oxlintrc.json` are likewise app-generated; leave
them alone.

## Re-sync risks

- **The fork is the fragile part.** `.design-sync/overrides/preview-gen-storybook.mjs`
  is a copy of a bundled converter module with two edits. A skill/converter upgrade
  can move the upstream module underneath it and the fork will not say so. On any
  re-sync where the toolchain moved, diff the fork against the fresh
  `.ds-sync/lib/preview-gen-storybook.mjs` and re-apply the two edits (carry the
  story's `globals` + paint the surface; merge parameters) rather than assuming the
  fork still matches.
- **`SURFACES` is a hand-copied constant.** It duplicates
  `.storybook/preview.ts` → `backgrounds.options`. Nothing detects drift.
- **`publishConfig.types` in `packages/ui/package.json` is load-bearing for this
  sync only.** If someone removes it as dead config, the next sync discovers **zero**
  components and the run looks like a converter failure. The declarations it points
  at are gitignored, so `cfg.buildCmd` must run before the converter on every sync
  and on every fresh clone.
- **Grades were carried on a story cap of 9.** Run compare with `--max-stories 9`;
  the default 6 leaves Button's tail three ungraded.
- **`apps/web` is excluded by 37 `titleMap` nulls.** A new `apps/web` story whose
  last title segment collides with an `@o3/ui` export will silently capture that
  component's card, exactly as `Content/Blocks/Base/Button` did. If a card's content
  looks like the website rather than the kit, check `titleMap` first.
- **Four parallel grading subagents stalled this machine.** All 29 captures survived
  (capture is the expensive part and it completed); the stall was in the
  read-and-grade phase with four chromium instances live. Grade serially, or cap the
  fan-out at two.

# Button spec — `cta` becomes `button`

Implementation target for the button map under [#101](https://github.com/o3world/o3-sanity/issues/101). Inputs: a sixteen-round decision ledger ratified by Nick, [ADR 0023](../adr/0023-an-instance-is-configured-by-its-component.md) (the knob root this sits on), [ADR 0020](../adr/0020-a-block-declares-its-knobs-once.md) and [ADR 0021](../adr/0021-an-array-member-is-its-own-knob-root.md), `CONTEXT.md` → _Component, instance, slot_ / _Knobs_ / _Field lexicon_, and a direct read of the Figma file recorded under **Evidence**.

Counts here were taken from the tree at `0d3c123`, not from memory: **12 declaration sites**, **47 instances** in committed JSON, **10 `CtaLink` call sites**.

## Vocabulary

**`cta` is redefined, not retired.** It now means _a call-to-action section or panel_ — the band, not the button inside it. Figma agrees: `CTA` (`2177:1354`, axis `Device = Desktop | Mobile`) is exactly that band.

⚠️ **`ctaSection` keeps its name.** Renaming it to `buttonSection` would be wrong — the band is not a button. Write this exception into the lexicon in the same commit, or the next reader "finishes" the rename.

The shared object `cta` becomes **`button`**, type name and field names together. A component called `button` reached through a field called `cta` is the drift `CONTEXT.md` opens by warning against, so half-renaming was rejected.

`CONTEXT.md`'s field-lexicon row for `cta` (line 135) inverts: **`button` — a single button (type `button`)**, don't use `cta`, `link`, `action`. `cta` moves to the don't-use column and gains the `ctaSection` exception beside it.

## The rename, site by site

Rename in one commit, following the `content-naming` skill's rename checklist.

**Fields whose name _is_ the type — these rename.**

| Site                             | Becomes                      |
| -------------------------------- | ---------------------------- |
| `heroSection.cta`                | `heroSection.button`         |
| `logoWallSection.cta`            | `logoWallSection.button`     |
| `caseShowcaseSection.cta`        | `caseShowcaseSection.button` |
| `ctaSection.cta`                 | `ctaSection.button`          |
| `railPanelsSection.panels[].cta` | `…panels[].button`           |
| `roleListSection.roles[].cta`    | `…roles[].button`            |
| `inFlightSection.entries[].cta`  | `…entries[].button`          |
| `siteSettings.primaryCta`        | `siteSettings.primaryButton` |

**Role-named arrays — the member type changes, the field name does not.** `siteSettings.navItems`, `utilityNavItems`, `legalLinks`, and `footerGroups[].links` are named for what they are in the nav, not for what they are made of. A nav item is a nav item that happens to be typed as a button; `navButtons` would name the material instead of the role and lose the distinction the utility strip exists to make.

Everything else the rename touches: `schemas/objects/cta.ts` → `button.ts` (`title: 'Call to action'` → `'Button'`), `BASE_BLOCKS` in `registry.ts` (which is what `BLOCK_ARRAYS['layoutSection.items']` derives from, so the base-block registration and the insert menu move together), the `queries.ts` projection arms, `content/blocks/base/cta/Cta.tsx` → `base/button/Button.tsx`, `baseComponents.tsx`, `CtaLink.tsx` → `ButtonLink.tsx`, the 47 instances in `tools/migration/data/`, and `docs/specs/schema.md`. Then `pnpm typegen && pnpm check`, `pnpm --filter @o3/migration load`, and look at the result in a browser (#42).

⚠️ **`packages/ui`'s `Button` already exists** and is a different thing — the presentational cva component with no schema binding. After the rename the content-layer renderer at `content/blocks/base/button/Button.tsx` and the UI primitive share a name across two layers, which the schema-symmetry rule requires. `ButtonLink` is the seam between them and keeps its distinct name.

## The component

### Destination is a union

**none | document reference | external URL | anchor.** The element is chosen _inside_ the component from which arm is set: a set destination renders `<a>`, an unset one renders `<button>`. `formSection.submitLabel` is **absorbed** — under ADR 0023 a nav button and a form button cannot be different components without re-declaring, and re-declaring is what the ADR forbids. The lexicon row for `submitLabel` goes with it.

⚠️ **This is not `asChild`.** `asChild` replaces the rendered element with one the _caller_ supplies. Here the component picks its own element from its own data. #129 spent a section keeping "slot" away from `asChild`; the same care applies from this direction, or that anti-entry gets undone.

### Contrast is the one design axis

`auto | dark | light | ghost`, and **the knob is named `contrast`, not `variant`**. The spelling of the values does not change (`dark|light|ghost` survives the #42 rename untouched). Three reasons for the field name:

- The ledger names the axis contrast, and `CONTEXT.md`'s chain is one axis → one knob.
- `variant` is already the repo's word for _the axis that changes what a block is_ (`heroSection.variant`, `mediaSection.variant`). A button's fill does not change what it is.
- It is what makes a second axis additive. `variant` + `emphasis` leaves nobody able to say which one is which; `contrast` + `emphasis` reads correctly on the day emphasis lands.

`docs/figma-components.md` gains a line recording the Figma `Black|White` ↔ `dark|light` translation as **deliberate**, not drift.

### `auto` resolves from the nearest surface

This is **the first context-resolved knob in the system**. ADR 0023's open-questions section pre-authorized it and requires the first one to cite the ADR and state how it resolves. It resolves like this:

| Enclosing surface | `auto` renders |
| ----------------- | -------------- |
| `white`           | `dark`         |
| `bone`            | `dark`         |
| `ink`             | `light`        |
| none found        | `dark`         |

`auto` never resolves to `ghost`. Ghost is a deliberate editorial choice with no automatic case.

**Resolution happens in the content layer, not in `packages/ui`.** `SectionShell` already paints the band, so it provides the surface through context; `ButtonLink` reads it and passes a concrete `dark | light` down. `Button` stays a dumb cva component that knows nothing about Sanity or context, which is what keeps it usable in Storybook and in `packages/ui`'s own stories.

**The three hand-written overrides this retires.** `HeroSection`, `CtaSection`, and `SiteNav` each hardcode `variant="light"` today, and their comments say why in prose: _"this band owns its background"_, _"the fill is structural rather than editorial"_. That is `auto`, implemented three times by hand and unavailable to an editor. `auto` replaces the assertion with a resolution, and `ButtonLink`'s `variant` override prop goes away with them.

⚠️ **The hero's override is unconditional while its surface is not.** `heroSection` declares `surfaceKnob({ initialValue: 'ink' })` and `variant: orbital | band`, where `band` is the shallow interior-page strip. The comment asserts "the hero is always the orbital field". Under `auto` the resolution answers per instance instead, which is the point — but check the `band` hero on each surface in a browser before calling the migration clean.

⚠️ **Eight instances have no band to resolve from.** All eight `cta` instances in committed JSON that carry no explicit variant are in `siteSettings` — five `navItems`, three `utilityNavItems` — and `siteSettings` sits outside the block tree entirely. The nav pill, the utility strip, the footer, and the legal row never enter a `SectionShell`. Two options, and the spec takes the first:

1. **Chrome declares its own surface** through the same context the shell uses. The nav pill is a dark scrim, so it provides `ink` and its buttons resolve `light` — the same answer `SiteNav` hardcodes today, now available to the canvas and to an editor. The footer does the same.
2. Leave `auto` unavailable outside a band. Rejected: it makes the knob mean two things depending on where the instance sits, and an editor cannot see which.

The `none found → dark` fallback stays as the backstop. It is today's `initialValue`, so an unresolved `auto` cannot render a white button on white.

### Size

**Authored, not Figma-derived.** The current Figma set has no size axis; the legacy sets do (`Base | Large | Small | Extra Small`). Value set: **`base | large | small`**, where `small` exists for card links.

This changes where size is decided. Today `size` is a render-side prop that three renderers pass (`logoWallSection`, `caseShowcaseSection`, `roleListSection` all pass `size="large"`). As a knob those become authored values on the instances, and the prop is retired with the `variant` override. ⚠️ **This is the one place the ledger and the hardening list disagree** — hardening item 5 leaves open whether size is a knob, a plain field, or a second `auto` resolved from placement. This spec takes the ledger's answer (a knob) because the three call sites pass three different sizes for editorial reasons, not structural ones. If Nick prefers placement-resolved, it is the same mechanism `auto` already builds and can change later without touching the value set.

### Geometry migrates to the current Figma set

Radius 2, padding 12×16, gap 12, height 48, label 18px/500. Shipped `Button` is on **legacy** geometry — radius 0, `px-5 py-2`, h40 — which the doc comment already flags as realigned to sets that turn out to be the previous generation. This is a `packages/ui` change with no schema surface, and it moves every button on the site at once, so it lands as its own commit with `pnpm vr` run against it.

### Icons: a slot at the UI layer, a knob at the content layer

`packages/ui`'s `Button` has an **icon slot** — a rendered area its parent fills. The Sanity `button` component has an **icon knob** — a curated closed set an editor picks from. The knob's value fills the slot. This is the vocabulary #129 pinned, used in both senses correctly, and the first _declared_ slot in the repo.

**`Button.arrow?: boolean` is absorbed** into the icon knob as its default. Every one of the ten `CtaLink` call sites passes `arrow` — it is not a prop anyone varies, it is the default nobody could express.

Icons are **vendored inline SVG** with `currentColor`, beside the three that exist (`arrow-icon`, `close-icon`, `menu-icon`). **No dependency** (ADR 0009). Copying a lucide path as a _source_ is fine (ISC); the shipped artifact is ours. **Trailing only** — no leading-icon use case exists in evidence. The knob may ship with `arrow` as its only option and grow later. ⚠️ Icons are the **lowest priority** item in this spec and may ship after everything else.

### Option previews

A knob may render part of its own design in the picker — the glyph for icons, background and text colour for `surface`, the resolved fill for `contrast`. **Opt-in per knob**; not every knob wants it.

The mechanism is a **declarative descriptor** on the option, resolved to real colours and glyphs by the control in `editor-chrome`, which may import tokens. The knobs directory may not (ADR 0020). `previewUrl` on `KnobOption` is **deferred, not extended** — its own comment scopes it to captured screenshots from a pipeline that does not exist.

## What a second axis must cost

**No emphasis axis is built.** `primary | secondary | tertiary` is filed as a ticket and built when a frame draws one. The evidence is under **Evidence** below, and the ticket must cite it so nobody reopens the question from memory.

The load-bearing constraint: **adding emphasis later must be purely additive** — one new `knob({ name: 'emphasis', … })` entry in `knobs/button.ts`, and nothing else. That is already true of the mechanism, since ADR 0020 makes a knob a declaration and the schema field is generated from it. What would break it is meaning, not code:

- **Do not overload `contrast` with emphasis.** `ghost` is a contrast with no fill. It is not "tertiary", and the spec must not describe it as a quiet or lesser button, or emphasis arrives with its middle value already spent.
- **Do not name the knob `variant`.** See above.
- **Do not gate anything on `contrast` values** that is really about emphasis.

Follow those three and emphasis costs one declaration, not 12 sites and 47 instances.

## `buttonGroup`, and the jump link it exists for

**`buttonGroup` is a component with `alignment` only** (`left | center | right`), scoped to managing button instances. Direction is deferred until a vertical group appears. It does **not** absorb `footerGroup` or `socialLink`; both stay as they are.

Its expected first use is a **jump-link component**, which closes a loop with two other decisions: destination's `anchor` arm, and the section-level anchor field below. **Those three ship together or the quick-jump nav does not exist.**

**A section-level `anchor` field**, injected by `defineSectionBlock` beside `surface`. A **plain field, not a knob** — an anchor id has no selector and turning it is not a design decision, which is exactly what Nick's definition of a knob excludes. **Authored, never slugified** from the heading: a derived anchor breaks every existing link the moment someone edits a heading. Add an `anchor` row to the field lexicon in the same commit.

⚠️ **`buttonGroup` arms ADR 0022's reopen trigger a second time.** That ADR keeps `layoutSection.items` polymorphic and names "a base block wanting a knob" as the trigger to revisit. ADR 0023 already armed it by giving `button` a spec; a `buttonGroup` with an `alignment` knob makes it concrete. Nothing changes in this spec — the declaration is ready for the layout column, the canvas surface is not — but the next person to hit an unreachable knob in a layout column should read ADR 0022 rather than debug the overlay.

## Card links

The `small` size exists for card links, and **card links do not exist in the frames**. `Case Study Card` (`2089:4169`) puts a full 183×48 `Theme=White` button, left-aligned. `Blog` cards (`2205:1146`) carry no link at all. Zero arrow icons appear outside the button sets.

What Nick described is **net-new design with no frame to check it against**. That is stated plainly here rather than discovered later by someone looking for the frame. The Card Family work is tracked separately: the two card sets are untracked in `tools/figma-sync/data/tracked-nodes.json`, and "card" has no entry in `CONTEXT.md`.

`ghost` is in the same position for a smaller reason. `docs/figma-components.md` says the frames use `Button / Ghost` for the `ArrowLink` job. `Button / Ghost` is instanced 219 times in the file and **zero times on any canonical page frame**. Retiring `ArrowLink` was right; `ghost` survives on stated intent (card links), not on a reading of the file, and the doc should say so.

## Build order

1. **`mark` first, as its own commit.** It exercises every part of ADR 0023 — the type-keyed `ObjectKnobs` registry, the three `hidden` closures converted to declared `showWhen`, the outward walk, the fourth `instance` subject level in `subject.ts` — with zero naming controversy and zero seed churn. The button then lands as a rename plus knobs on a proven root. This is what ADR 0023's first Positive consequence claims for itself.
2. **The rename**, all 12 sites plus the 47 instances, in one commit. No new knobs.
3. **Geometry**, on its own so `pnpm vr` has one thing to explain.
4. **`contrast` with `auto`**, including the surface context and the three retired overrides.
5. **Destination union** and `submitLabel`'s absorption.
6. **`anchor` field, `buttonGroup`, and the jump link** — together.
7. **Icon knob**, last, possibly with `arrow` as its only option.

After any change under `data/`: `pnpm --filter @o3/migration load`, then look in a browser. Skipping this once hid a whole homepage reconciliation (#42).

## The instances that already exist

47 `button` instances live in committed JSON. 39 carry an explicit variant — 19 `light`, 17 `dark`, 3 `ghost` — and 8 carry none.

**The 39 keep their explicit value.** `auto` is the `initialValue` for new instances only. Migrating blind on the same commit as a rename means two changes and one screenshot to explain both.

**The 8 are the `siteSettings` nav and utility items**, and they are the reason the chrome-declares-its-surface decision above is not optional: they have no stored value to fall back on, so whatever `auto` does for them is what the nav does.

A follow-up ticket computes what `auto` would resolve to for each of the 39 and flips only the instances where the answer is identical — a migration with a pixel-identical diff by construction. Instances where `auto` resolves _differently_ come back as a short list for Nick, never as a silent visual change.

## Open

Carried deliberately, not overlooked.

- **Are slots declared as data, or do they stay implicit in renderer props?** Knobs are declared once and everything derives (ADR 0020). A declared slot is what would let the canvas offer "put a button here" on an empty area. The icon slot is the first declared slot in the repo, so whoever builds it will answer this by accident unless it is put to Nick first. **The largest unasked question in this tree.**
- **Size**: knob (this spec's answer), plain field, or placement-resolved. See above.
- **`CONTEXT.md`'s knob definition omits the toolbar.** Nick's definition is "a property exposed as a selector through a toolbar"; the doc says "a closed value set with a title, an icon, and a declared rule". The toolbar is what excludes `mark.speed`, `pageType`, `submitLabel`, and the new `anchor` field. Fold it in.
- **A context-resolved knob has no word yet.** ADR 0023 calls it a knob; Nick's definition requires a selector. `auto` reconciles the two — the selector exists, one of its options defers — and that sentence belongs in the ADR that lands with this work.
- **#121 blocks nothing here but the eyeball.** `draftMode()` is false in the Presentation frame, so `<VisualEditing />` never mounts and the canvas toolbar cannot appear. `mark` is fully testable without it; the `instance` subject level is the piece nobody can see until it clears. ⚠️ `SANITY_API_WRITE_TOKEN` is **not** what draft mode needs — that misconception already cost a session.

## Evidence

From a direct read of the Figma file over the REST API, 2026-08-14. These findings exist nowhere else in the repo, and the doc-drift ticket under [#33](https://github.com/o3world/o3-sanity/issues/33) should move them into `docs/figma-components.md`. The two claims that can be checked without opening Figma both hold: `docs/figma-components.md:49` and `tools/figma-sync/data/tracked-nodes.json:142` each say `Theme = Black | White`.

**The canonical frames have no emphasis axis.** Every button axis in the file is size, fill/theme, state, or breakpoint. Across all 9 canonical desktop and 5 mobile frames, **every band carries at most one button**, and its fill tracks the band. The CTA band `2177:1354`, where a secondary would live, contains exactly one button (`2209:2143`, `Theme=White` on `#0A0A0B`). The only adjacent-button cases are the Insight filter bar (already modelled as `FilterChip`) and carousel direction controls.

**The one Primary/Secondary vocabulary in the file is a decoy.** `2230:7645` belongs to an imported _client_ library (the 1682 Conference family). Its two instances sit inside device mockups on the Case Study frame — a picture of someone else's site — and its values are not a scale (`Dropdown` is one of them).

**Drift to fix**, all under #33:

| Finding                          | Detail                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Theme = Black \| Red \| White`  | `docs/figma-components.md:49` and `tracked-nodes.json` both claim `Black \| White`. Red is real (`#C90E00`, hover `#EB1000`) and **instanced zero times** — the #42 condition exactly. Do not adopt it; do stop claiming it does not exist.                                                                                            |
| Remote sets return zero children | `Button / Solid`, `Button / Ghost`, `Brand / Logo`, `Icon / Surface`, `Button / Outline` and more live in another library file. **`figma:sync` may be hashing empty subtrees for ~12 tracked sets**, which makes it structurally blind to changes in them. Label this one `bug`.                                                       |
| Dead node ids                    | `1868:3262`, `1864:2405`, `1710:2250` are cited in `button.tsx` and **do not exist in the file**. `1680:2090` exists but is a legacy instance. Per `CLAUDE.md`, superseded provenance is replaced, not narrated — fold this into the geometry commit.                                                                                  |
| Understated axes                 | Solid is `Size = Base\|Large\|Small\|Extra Small`, `State = Default\|Hover\|Focus\|Disabled`; the doc says two and two. Ghost is 4 sizes and 3 states; the doc says one and one.                                                                                                                                                       |
| Untracked local sets             | `Icon Button 2134:1724`, `Link 2225:2894`, `CTA 2177:1354`, `Case Study Card 2089:4169`, `Blog 2205:1146`, `Interior Hero 2107:1051`, `Icon 2177:1556`, `Mobile Heroes 2243:8668`, and a **second `Footer` set** at `2225:2672` distinct from the tracked `1280:1885`. `🧩 Local Components` holds **13** children, not "exactly two". |
| Home is mixed-generation         | `1680:2134` — three bands still instance the legacy `Button / Solid`; hero, partners, case studies and Blog use the new set. The canonical Home frame is not uniformly on either generation.                                                                                                                                           |

⚠️ **Tooling trap.** `mcp__figma_rest__get_figma_data` **silently drops VARIANT `propertyDefinitions`**. It returns only boolean props for `136:754`, which reads as "this set has no axes". Every axis above came from `GET /v1/files/:key/nodes`. An agent using the convenience tool will reach the opposite of the truth.

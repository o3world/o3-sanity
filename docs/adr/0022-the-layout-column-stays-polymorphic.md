# 0022. The layout column stays polymorphic, and its canvas toolbar stays silent

- **Status:** Accepted
- **Date:** 2026-08-14
- **Deciders:** NickO3 + Claude
- **Related:** [map #101](https://github.com/o3world/o3-sanity/issues/101), [issue #115](https://github.com/o3world/o3-sanity/issues/115), [spike #104](https://github.com/o3world/o3-sanity/issues/104), [ADR 0001](./0001-component-routing-port.md), [ADR 0003](./0003-disposable-dataset-migration-lock.md), [ADR 0020](./0020-a-block-declares-its-knobs-once.md), `docs/upstream/`

## Context

`layoutSection.items` is the one array in this repo the Presentation overlay
cannot attach a component inside. The spike on #104 traced why, and the trace
holds verbatim at the installed `sanity@6.8.0` and
`@sanity/visual-editing@5.7.3`:

- `@sanity/visual-editing` serialises an array with **two or more** member types
  as a `union`, and the union branch is the only one that consults the
  resolved-types map Studio answers over the comlink. An array with exactly one
  member serialises as an `arrayItem` and resolves natively at any depth.
- Studio never sends a usable answer for a nested union. Its projection is
  `` `"${i}": ${path}[0]._type` `` and it keeps the result only when
  `typeof result?.[i] === 'string'`. At depth ≥ 2 the leading segment is already
  an array filter, so the trailing `[0]` unwraps one level too few and the
  answer arrives as `["richText"]` and is dropped.
- The overlay would look it up under the wrong key anyway.
  `popUnkeyedPathSegments` builds the request key correctly, but the lookup
  builds `[prevPath.join('.'), next].filter(Boolean).join('')` — which at a
  nested union inserts a separator the GROQ path does not have:
  `sections.[_key=="a"].items[_key=="b"]`.

Either fix alone changes nothing, and the failure is silent and total:
`ElementOverlay` returns an undefined resolver context when the field does not
resolve, and our component resolver is then never called. There is no error, no
console warning, and no degraded mode to read `_type` in — the correction #104
made to map #101's lesson 4.

Exactly one array in the repo qualifies. Every other nested array here has one
member type (`railPanelsSection.panels`, `screenGridSection.screens`,
`statGroup.stats`, the reference arrays), and portable text is excluded on
purpose: we do not attach knobs to prose, and a run of copy is reached through
stega rather than through an attributed element.

Three things about the present state decide this, and all three are checkable:

**There is nothing for the toolbar to show in there.** `defineBaseBlock` takes
no `knobs` argument — a base block _cannot_ declare a design option today, by
construction. None of the five members of `layoutSection.items` has a file in
`packages/sanity/src/knobs/`, and where per-item knobs for shared objects
(`figure`, `cta`, `stat`) should live is still open fog on #101. So the payoff
from fixing attachment today is the item actions and the insert menu, on a
surface that is not attributed yet: `LayoutSection.tsx` never calls `itemAttr`.

**The content is small and the dataset is disposable.** Eleven `layoutSection`
instances exist, across the seven documents that have any, holding 23 items — 15
`richText`, 4 `figure`, 3 `cta`, 1 `embed`, and **no** `statGroup` at all
(counted in the `development` dataset and in the committed JSON; they agree). All eleven live in
committed JSON under `tools/migration/data/`, which ADR 0003 makes the source of
truth. So #115's "a migration of every `layoutSection` in the dataset" is really
a scripted edit to seven files and a `pnpm --filter @o3/migration load`. That
correction makes the data half of de-polymorphising nearly free — and it turned
out not to be the expensive half.

**Two of the three options expire; one does not.** The bugs are upstream, small,
and precisely located. A patch is deleted when they are fixed. A deferral ends
when they are fixed. A discriminator wrapper in the content model is still there
in five years.

## Decision

**Leave `layoutSection.items` polymorphic, accept that the canvas toolbar does
not attach inside a layout column, and report both bugs upstream.**

The deferral is recorded rather than remembered:

- **ADR 0022 is this record**, and #107 / #108 carry the scope note in their
  bodies where a reader of the closed tickets will still find it.
- **`nestedUnionArrays.test.ts`** asserts that `layoutSection.items` is the
  _only_ polymorphic array below a block root. The deferral's whole case is that
  one block is one block; a second one is a different decision and fails on the
  commit that adds it, not as "the toolbar doesn't work here" a month later.
- **`defineBaseBlock`'s doc comment names the trigger.** The day a base block
  wants a knob is the day this ADR is due for review, and the person adding one
  opens that factory first.
- **`LayoutSection.tsx` explains the silence at the line where the fix would
  go** — beside its items loop, which is the only place `itemAttr` could be
  called.
- **`docs/upstream/` holds both bug reports, drafted and unfiled.** Filing is a
  human's call.

## Alternatives considered

### De-polymorphise `items` into one object carrying a discriminator

Wrap the five members in a `layoutItem` object with a `kind` field and one
conditional field per member, making `items` single-member so it serialises as
an `arrayItem` and resolves natively at any depth.

- **Pros:** no patches, entirely in our control, forward-compatible with any
  upstream fix. The data cost is genuinely small once ADR 0003 is applied —
  seven committed JSON files and a `load`, not a live-content migration. It is
  the option the prior art did not have, because its polymorphic arrays were
  load-bearing content and ours is a layout container.
- **Cons:** the cost is not in the data, it is in the type seam. `LayoutItem` is
  not one type — `DispatchedBlock = PageSection | LayoutItem` is ADR 0001's
  compile-time guardrail, chosen _in place of_ schema-parity test suites, and
  `BaseBlockData<K> = Extract<LayoutItem, {_type: K}>` is what types all five
  base renderers. Collapsing `LayoutItem['_type']` to the single literal
  `'layoutItem'` drops the base tier out of `DispatchedBlockType`, so
  `BLOCK_MAP`'s `satisfies` clause stops checking the five components it exists
  to check, and each renderer's props have to be re-derived from a wrapper field
  instead of a union member.

  It also forks the repo's one shape for "an array of blocks" a commit after
  #112 unified it. `BLOCK_ARRAYS` derives `page.sections`, `caseStudy.story` and
  `layoutSection.items` from one declaration and its comment says the schema is
  the mirror; a wrapper makes `layoutSection.items` a mirror of nothing, because
  the schema's `of:` would be `layoutItem` while the insert roster stayed
  `BASE_BLOCKS`.

  And it is a permanent regression on the surface editors actually use. Adding
  an item today is one pick from Sanity's insert menu. After the wrap it is
  insert "Layout item", choose a kind, then fill the one field of five that the
  `hidden` predicate leaves showing.

- **Why not:** #115 offers the discriminator as "arguably better schema
  regardless". On this platform it is the reverse — a polymorphic array is
  Sanity's idiom for a mixed column, the Studio's insert menu is built for it,
  and our own type-level guardrail depends on it. That makes the wrapper a
  workaround dressed as modelling, and it is the only one of the three options
  whose cost does not expire when upstream ships the fix.

### Patch both packages with `pnpm patch`, as the prior art does

- **Pros:** proven — it ships in vtx-web. It fixes the mechanism rather than
  working around it, so every nested union resolves, including any future one,
  and nothing about the content model changes.
- **Cons:** this repo has no `patches/`, no Playwright, and no e2e project, so
  "an e2e gate to hold the pair" means standing up a live-comlink e2e harness
  for one block. Worse, the Studio-side bug lives in a **content-hashed dist
  chunk** (`PostMessageSchema-DpDWfJhW.js`), so the patch stops applying on
  every `sanity` release rather than every breaking one — a signal that fires
  constantly is a signal someone learns to clear without reading.
- **Why not:** the harness costs more than the feature it would gate, and the
  feature is empty today. Worth revisiting the moment a base block has a knob:
  at that point the payoff is real, the patches are still two small diffs, and
  the recheck is bought with something.

### Fix attachment now and let it show only item actions

Do the work — either option above — and accept that the menu offers Duplicate /
Remove / Move and the insert menu until base blocks grow knobs.

- **Pros:** the surface stops being dark, which is the one thing #115 says is
  unacceptable "the moment an editor tries and thinks the feature is broken".
- **Cons:** items in a layout column are not attributed at all today, so an
  editor has never seen chrome there to miss. And the menu that would appear
  would be the thin one — no knobs, because there are none — which is closer to
  "the feature is broken" than absence is. `menuModel.ts`'s own posture is that a
  missing control is a smaller failure than a dead one.
- **Why not:** it buys the appearance of the feature before the feature exists,
  at the price of whichever permanent cost the option above carries.

## Consequences

- **Positive:** nothing in the content model bends around a bug in a preview
  overlay. `layoutSection.items` stays the same shape as `page.sections` and
  `caseStudy.story`, so `BLOCK_ARRAYS` keeps being one declaration with the
  schema derived from it, and ADR 0001's `satisfies` guardrail keeps checking
  all five base renderers.
- **Positive:** the deferral has a guard rather than a memory.
  `nestedUnionArrays.test.ts` fails on the commit that would widen the blast
  radius, and it names this ADR in the failure message.
- **Positive:** the two bugs are written up precisely enough for someone to file
  in a few minutes. That is the only move that removes the constraint for
  everyone rather than routing around it here.
- **Negative:** the canvas toolbar has a hole, and it is silent. Hovering inside
  a layout column does nothing, and the reason is three files away from the
  symptom. The comments in `LayoutSection.tsx` and `defineBaseBlock` are what
  stand between that and someone spending a day debugging a working
  implementation.
- **Negative:** the answer is "not yet", which is the answer that ages worst. It
  is right while base blocks declare no design options and eleven layout
  sections hold twenty-three items; it is wrong the first time either is false,
  and nothing forces a re-read except the two comments and this record.
- **Risks / open questions:** the trigger named here — a base block wanting a
  knob — is the same question map #101 has open as fog, because `figure`, `cta`
  and `stat` are shared objects as well as base blocks and their per-item knobs
  have no home. Whoever answers that lands on this decision immediately, and at
  that point the patches are the option to weigh first: they cost an e2e harness
  once, and they expire.

## Addendum, 2026-08-15 — the trigger is armed, twice (#145, #149)

The question above has been answered, and the answer arms the trigger without
going anywhere near `defineBaseBlock`. ADR 0023 made a **shared object its own
knob root**, so a member of `layoutSection.items` now declares design options
through `defineSharedObject` rather than through the base-block factory:
`button` declares a fill (#145), and `buttonGroup` declares an alignment
(#149). Two members of the repo's one unreachable array carry a control the
canvas cannot draw.

**Nothing here changes.** The declaration is ready for the layout column and the
canvas surface is not: both objects are configured identically wherever else
they are placed, and it is only inside `items` that the overlay resolves
nothing. The trade this ADR weighed is the same trade, and the two upstream bugs
in `docs/upstream/` are still the fix that removes the constraint for everyone.

What changes is the size of the payoff, which was the whole of the "not yet".
The case for deferring rested on there being nothing to show in there; there is
now something, on two of the seven members. So the patches are no longer bought
with nothing, and the next person to hit an unreachable knob in a layout column
should re-read this record — including the alternatives — rather than debug the
overlay. The failure is still silent, and it is still three files from the
symptom.

`defineBaseBlock`'s doc comment names the trigger it can see; it cannot see this
one, because `defineSharedObject` is a different door into the same array. Both
factories now point here.

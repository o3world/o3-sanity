# 0020. A block declares its knobs once, and the schema is derived from that

- **Status:** Accepted
- **Date:** 2026-08-14
- **Deciders:** NickO3 + Claude
- **Related:** [map #101](https://github.com/o3world/o3-sanity/issues/101), [issue #102](https://github.com/o3world/o3-sanity/issues/102), [ADR 0004](./0004-layered-test-approach.md), [ADR 0019](./0019-editor-chrome-is-a-package.md), `packages/block-spec`

## Context

A **knob** is one design option on a block: a closed value set with a title, an
icon, and a rule for when it applies. `heroSection.variant` is one, and so are
`decoration`, `surface`, and `railPanelsSection.layout`. Three surfaces need to
know about it — the Studio form, the Storybook audit, and the canvas toolbar in
Presentation — and the goal behind #101 is that adding one costs one edit.

The prior art is vtx-web, whose quick-edit toolbar has shipped and works. Its
cost is the reason this ADR exists. Adding one design option to one block there
touches roughly six files in the easy case, and **15–20 across three packages,
five generated artifacts and three hand-kept mirrors** when the option is on a
new root, needs gating, or wants a swatch. The concept has no single home, so
six places each hold a piece of it: the schema field, a hand-mirrored catalog
entry, a generated JSON manifest, a `KNOB_ICONS` table that lives in the _web
app_ and silently decides whether an option is editable at all, a surface-
ownership table, and the story file. Four of the six are mirrors, held together
by about a dozen parity tests plus frozen fixtures that `vitest -u` deliberately
cannot update.

That shape is not carelessness. It follows from one real constraint: **the
preview bundle cannot import `sanity`.** The Presentation overlay runs inside
the site bundle, and pulling the Studio's schema barrel into it is not an
option. So vtx-web derives the pure artifact _from_ the impure one — a
build-time walker reads the live schema and writes `blockKnobs.generated.json`
— and hand-mirrors whatever the walker cannot see into a catalog module.

The walker is where the cost compounds, because a walker can only report what
it can recognise. Three give-ups matter:

- **`hidden:` closures are opaque.** A field gated by `({parent}) => parent?.variant !== 'band'`
  gets marked `unresolvedCondition`, and its control silently disappears from
  every editorial surface. Reading the predicate's serialized source was tried
  and rejected — vitest and tsx stringify differently, so the gate inverted
  without failing.
- **`options.list` means two things at once.** It is both "this is the value
  domain" and "publish this as an editor control", so a field that gained a
  list for an unrelated reason (a stega guard) became an editor-facing control
  offering values the downstream contract rejects at save. The fix excluded a
  whole root by name, and a differently-named field carrying the same object
  walked around it a few months later without anything failing.
- **Arrays are skipped entirely**, so nothing inside a list is ever knobbable
  through the manifest.

Our schemas already contain the first problem in quantity — `heroSection.eyebrow`
and `railPanelsSection.rail` are both closures today — so porting the toolbar
without changing the direction would import the cost along with the feature.

## Decision

**Invert the derivation. The pure declaration is authored; the Sanity schema is
generated from it.**

```
knobs (pure, zero runtime deps)
  ├── adapter → Sanity fields          @o3/sanity
  ├── adapter → Storybook stories      @o3/story-kit
  └── adapter → the editorial canvas   @o3/editor-chrome/canvas
```

Concretely:

- **`@o3/block-spec`** holds the vocabulary and one query — `knob()`,
  `defineBlockKnobs()`, `visibleKnobs()`, `resolveKnobValue()`. Zero runtime
  dependencies, so it bundles into the Studio, the site and Storybook alike.
- **Knob instances live in `packages/sanity/src/knobs/<blockName>.ts`**, one
  file per block, barrelled at `@o3/sanity/knobs`. They go in their own
  directory rather than beside their schema because there is no "beside" — all
  sixteen section blocks share a single `schemas/blocks/section.ts`. An eslint
  `no-restricted-imports` rule scoped to that directory keeps `sanity` out.
- **`defineSectionBlock` grows a `knobs:` argument.** It generates each knob's
  `options.list`, `initialValue`, title, and — the part that pays — a `hidden`
  predicate derived from a **declared** `showWhen`. The block's editorial
  fields stay hand-written in native `defineField`.
- **`surface` stops being a hardcoded append** and becomes `surfaceKnob()`, the
  knob every section block has.

Purity then follows from the dependency graph rather than from a test. The
generate script, the generated JSON, the catalog mirror and the staleness test
are not ported, because there is nothing left for them to mirror.

Two properties fall out, and both are the point:

**Visibility is data with two evaluators.** `showWhen: {at: 'variant', mode:
'oneOf', values: ['band']}` generates the form's `hidden` predicate _and_ is
read directly by the toolbar. The two cannot disagree, which is what makes "a
control exists exactly when it does something" enforceable rather than
aspirational.

**An enum is not a control.** A knob is declared explicitly. Enum-ness publishes
nothing, so the leak that put a machine field in front of an editor in vtx-web
has no path here.

We keep vtx-web's `queryKnobs` shape as `visibleKnobs()` — one question, every
gate behind it. That module is the one piece of the original whose interface was
right; its callers had assembled the same answer in six steps at each call site.

## Alternatives considered

### Walk the schema at build time, as vtx-web does

- **Pros:** the schema stays the single authored artifact, which is where a
  Sanity developer expects to look. No new package, no second file per block,
  no adapter to write. It is proven — it ships.
- **Cons:** it costs the four mirrors and their parity tests, and it caps what
  is expressible at what a walker can recognise. Every gate an author writes as
  a closure is a control that vanishes with no error, and the failure is
  invisible until an editor asks where a setting went.
- **Why not:** the mirrors are the cost we are trying to remove, and they are
  not incidental to the approach — they are what the approach needs in order to
  work. Adopting it would mean adopting its file count.

### A purity-guarded subtree inside `@o3/sanity`

Keep one package; put the knob declarations in a `pure/` subtree and forbid
`sanity` imports there with a test that bundles the barrel and fails on a
forbidden edge. This is vtx-web's "iron rule".

- **Pros:** one fewer package. Declarations sit inside the package that owns
  schemas, which is arguably where they belong.
- **Cons:** the guarantee becomes a test someone can scope wrong, and it fails
  at bundle time with a stack trace rather than at lint time with a one-line
  fix. vtx-web's version has to bundle a specific entry file to work, so it
  only covers the graph reachable from that entry.
- **Why not:** a package boundary is a graph edge that cannot be misconfigured
  into passing. The cost of a source-only package here is a `package.json` and
  a `knip.json` block — packages in this repo have no build step, so a new one
  is close to free.

### Express the whole block, fields included, in the pure layer

Go further: declare every field neutrally and generate the entire Sanity type,
so a block's definition is one file again.

- **Pros:** genuinely one declaration per block. No split-brain.
- **Cons:** it means re-expressing `defineField` — validation rules,
  references, portable text, previews, fieldsets, initial values — in our own
  vocabulary, and maintaining it against Sanity's. That is a large shallow
  module: a big interface wrapping something that already has a good one.
- **Why not:** the leverage is entirely in the _design options_, which are a
  small, closed, highly-duplicated subset. Editorial fields are written once
  and read by one renderer; they are not the thing that costs 15 files.

### Port the toolbar first and refactor to the declaration later

- **Pros:** fastest visible result. The toolbar is the part someone can see.
- **Cons:** the toolbar needs a knob source on day one, so "later" means
  building the generated-manifest mirror first and deleting it afterwards — and
  a mirror that works is rarely deleted.
- **Why not:** it rebuilds the problem in order to solve it.

## Consequences

- **Positive:** adding a design option is one edit to one file. It reaches
  Studio, Storybook and the canvas toolbar without any of them being touched,
  because all three read the same declaration.
- **Positive:** the whole class of parity tests goes away. One guard replaces
  them ([#114](https://github.com/o3world/o3-sanity/issues/114)): every knob
  the toolbar offers is visible in the form, and every design option the form
  shows is offered by the toolbar. Both directions, because either alone
  permits one of the two failures we are designing out.
- **Positive:** the Storybook knob and the editorial knob stop being two
  unrelated declarations that happen to share a word. In vtx-web the story-side
  knob map is validated against the schema by nothing at all, and carries no
  gating — so a Storybook control will happily set a field the form hides. Here
  `packages/story-kit/src/knobs.ts` becomes the Storybook adapter for the same
  declaration.
- **Negative:** a block's definition now lives in two files — its knobs and its
  schema. That is the real cost of the inversion and it is paid on every block.
  We judged it cheaper than four mirrors, but it is not free, and it will feel
  wrong the first few times.
- **Negative:** `defineSectionBlock` gains a second way to declare a field. Until
  breadth ([#113](https://github.com/o3world/o3-sanity/issues/113)) lands, some
  blocks declare design options as knobs and others as plain fields, and the
  toolbar is silent about the second kind. This is a migration state, and the
  one-off shape guard from #105 is what holds it.
- **Negative:** judgement moved to the author. "Is this enum a design option or
  a content field?" used to be answered by a denylist; now someone decides per
  field. `pageType` is not a knob; `formSection.reasons` is not a knob. The rule
  is whether an editor changing it is making a design decision on the canvas,
  and it only works if it is applied.
- **Risks / open questions:** the knob vocabulary is guessed from two codebases'
  worth of section blocks. `showWhen`'s four modes cover everything we can see
  today, but a gate that needs to read a sibling array's contents — vtx-web has
  one, deciding whether a list-level style reaches any member — does not fit,
  and would need either a fifth mode or an escape hatch. Deferred until a real
  case appears here rather than designed for now.

## Consequences, revisited

Written after six blocks were converted (`heroSection`, `railPanelsSection`,
`disciplineGridSection`, `inFlightSection`, `mediaSection`, `layoutSection` —
15 knobs) and after [#114](https://github.com/o3world/o3-sanity/issues/114)'s
guard landed. What follows is what happened, checked against what the section
above claimed.

- **The guard is one test, and it passed the first time it ran.** It walks all
  15 knobs across 148 document states — every combination of every knob's
  options plus unset — and asserts both directions against the form's own
  `hidden` predicate. It is as boring as predicted, and it is not vacuous:
  inverting the sign inside `hiddenUnless` produces 72 disagreements that name
  `railPanelsSection.rail` in both directions at once. The dozen parity tests
  and the frozen fixtures did not come with it. Neither did the generated JSON,
  the catalog module, the staleness test or the icon table.

- **The predicted cost is real, and it landed in a place the prediction
  missed.** Two files per block, as expected. What was not expected is that
  field _order_ would need rescuing: generating the knob fields would have
  moved `variant` from the top of the hero's form to the bottom, so `fields`
  grew a second kind of entry — a bare string naming the slot a knob's field
  sits in. That is a third thing an author has to know, and it exists only to
  keep an authored fact authored.

- **A gate is not always a knob.** The Context above counts
  `heroSection.eyebrow` and `railPanelsSection.rail` together as "two closures
  we already have". They converted differently. `rail` is a design option, so
  its gate rides the knob and the toolbar reads it. `eyebrow` is prose an
  editor types, so it stays a hand-written field and only borrows the gate
  compiler — which is why `hiddenUnless` is exported at all. Visibility being
  data turned out to be worth having for editorial fields too, and the
  consequence for #114 is that **gating cannot be the tell for what is a
  control**. The closed value set is; the rule is written down in
  `knobGuard.test.ts` beside the direction that needs it.

- **The pure layer met a typed field and grew a property for it**
  ([#119](https://github.com/o3world/o3-sanity/issues/119)). "Option values are
  strings" is right on this side of the seam and wrong at the schema boundary:
  `layoutSection.columns` is a `number` field whose literal union typegen
  publishes into the renderer's props. `valueType` is declared rather than
  sniffed for the reason this ADR exists, but it is a cost the inversion
  introduced — vtx-web's walker read the field's type off the schema and never
  had to be told. The seam has a live defect on its write leg
  ([#123](https://github.com/o3world/o3-sanity/issues/123)), which is the same
  crossing in the other direction.

- **`options.list` still means one thing, and that is what makes the second
  direction safe to state.** The guard reads a closed value set as a
  _suspicion_ that a field is a design option, and its only power is to fail
  and ask a human. Nothing is promoted to a control by its shape, so the leak
  that put a machine field in front of an editor in the prior art still has no
  path — and the denylist that failed to contain it there has no reason to
  exist here.

- **What the guard does not cover, and why.** `visibleKnobs({nested: true})`
  drops band knobs while the form keeps showing the field, because nesting is a
  fact about the host rather than about the document — a disagreement by
  design, and unreachable today besides. Item-surface knobs
  ([#122](https://github.com/o3world/o3-sanity/issues/122)) are the one change
  the guard should expect: both its field walk and its state product need an
  array-member context before an item knob can be checked.

# 0021. An array member is its own knob root

- **Status:** Accepted
- **Date:** 2026-08-14
- **Deciders:** NickO3 + Claude
- **Related:** [map #101](https://github.com/o3world/o3-sanity/issues/101), [issue #122](https://github.com/o3world/o3-sanity/issues/122), [issue #118](https://github.com/o3world/o3-sanity/issues/118), [ADR 0020](/adr/0020-a-block-declares-its-knobs-once)

## Context

The `item` surface has been in `KnobSurface` since `@o3/block-spec` shipped and
never had a consumer. #118 tried to give it one — a screen's own styling inside
`screenGridSection.screens` — by declaring `knob({name: 'screens[].tone',
surface: 'item'})` on the block, and every layer answered differently.
`surfaceForKnobPath` returned `block`, because the prefix table has no array
vocabulary. `knobFields` threw at schema load, so a block that declared one did
not start. `visibleKnobs` asked the reader for the literal string
`"screens[].tone"` and returned one resolution for five screens. And
`knobPatch` did not fail at all: it split the path on the dot, emitted
`setIfMissing({})` at a field literally called `screens[]`, and wrote the value
inside it — a real mutation into a field no schema declares.

None of that is a bug in any one of them. Every reader and writer in the repo
takes a path relative to the block root, and an item knob has no such path: the
member it configures is not identified until an editor points at one.

Two questions had to be answered before the layer could be built, and each had
a real alternative. **How a hovered member reaches its declaration**, which
#110's knob menu depends on because it resolves its subject from the DOM node
it is on. And **whether an item pick folds back optimistically**, given that the
root behind one is the whole array and a screen holds a `figure` with an asset
reference.

## Decision

**An array member is its own knob root, reached through the block that hosts
it, and folded back with a keyed field-level overlay.**

Concretely:

- `defineItemKnobs({type, title, knobs})` builds an `ItemKnobs` whose paths are
  relative to the member. `tone` is the member's own field; `screens[].tone`
  is not spelled anywhere.
- A block hangs its members' specs off `items`, keyed by the block-relative
  array field: `defineBlockKnobs({…, items: {screens: screenKnobs}})`. The
  lookup is `blockType` → spec → array field → member spec, and both halves of
  that key are already in the path the overlay was handed.
- `defineBlockKnobs` **refuses** a knob claiming `surface: 'item'`. The item
  surface is a fact about which spec you are holding, stamped by
  `defineItemKnobs` on every knob it takes, never computed by the prefix table.
- The optimistic overlay matches members by `_key` and copies only the fields a
  member's knobs write. It never copies the array.

Every existing reader and writer then works unchanged, which is the test the
shape had to pass. `visibleKnobs` resolves against one named member,
`resolveKnobValue` and `showWhenSatisfied` read member-relative paths, gate
inheritance works because a sibling gate is an ordinary same-root gate, and
`knobPatch` takes the member's path as its root — the two-level keyed write it
already had a passing test for.

## Alternatives considered

### A global registry keyed on the member's `_type`

Key item specs the way `SECTION_BLOCKS` keys blocks — `ITEM_KNOBS['screen']` —
and enforce uniqueness across the repo.

- **Pros:** one flat map, and the canvas already reads `_type` off the draft
  snapshot for the block, so the same read answers for the member. It needs no
  new path arithmetic.
- **Cons:** a member name is local to its array. An inline object in an array's
  `of` registers nothing globally, so two blocks may each declare a `screen`
  with different fields, and neither Sanity nor typegen says a word. Enforcing uniqueness means an author renaming a member for a
  reason no schema explains, and a collision that slips through attaches the
  wrong control to the right-looking element.
- **Why not:** the collision is silent in both directions — nothing fails when
  two blocks agree on a name, and the wrong roster is a live editorial surface
  writing to fields the member does not have. The host-based key cannot
  collide, and it costs one regex over a path the overlay already parses.

### One longer path from the block, with array vocabulary in the readers

Keep `screens[].tone` and teach the prefix table, `knobFields`, `visibleKnobs`
and `knobPatch` what `[]` means.

- **Pros:** one spec per block, so a block's declaration stays in one object and
  there is no second constructor to learn.
- **Cons:** it is four layers of new vocabulary for one concept, and the reader
  half cannot be finished: `visibleKnobs` still needs a member to resolve
  against, so every caller would have to pass one alongside the path. That is
  the item root, spelled less directly.
- **Why not:** `knobFields`' own error message already said the answer —
  "declare the containing object as a schema field and give it its own knobs".
  The path spelling adds vocabulary to five modules to avoid adding a
  constructor to one.

### No optimistic fold-back for item knobs

Let an item pick land on the mutation round-trip, and exclude item roots from
the overlay entirely.

- **Pros:** nothing can go backwards on screen. It is the honest refusal the
  ticket named as acceptable, and it is about six lines.
- **Cons:** the pick sits there for a beat doing nothing visible, which is the
  failure `patchableKnobRoots` exists to prevent — a slow control reads as a
  broken one.
- **Why not:** the keyed overlay is barely larger and gives the right picture.
  The reason a root copy was off the table — the array's members hold a
  dereferenced asset in the projection and a bare `{_ref}` in the echo — argues
  for copying _less_, not for copying nothing.

### Copy the whole array root, as block knobs do

- **Pros:** no new function; `patchableKnobRoots` already produces roots.
- **Cons:** it would trade every resolved image in the grid for a bare `{_ref}`
  the moment an editor picks a tone.
- **Why not:** this is the "does the document echo look like the projection"
  hazard `patchableKnobRoots` documents, landing for the first time. It is the
  one thing the ticket ruled out by name.

## Consequences

- **Positive:** the layers that were wrong are now unreachable rather than
  fixed. `defineBlockKnobs` throws on an item knob, so the silent `screens[]`
  write cannot be re-authored, and the error names the constructor to use.
- **Positive:** `defineArrayItem` shares `withKnobFields` with
  `defineSectionBlock` rather than re-implementing the splice. Field order is
  what typegen publishes, so one rule in one place is the difference between a
  member's props staying put and moving under the renderer.
- **Positive:** the story surface #106 deferred exists. `rosterKnobs` answers
  for a member the same way it answers for a block, and `itemKnobControls`
  builds one control group per member with the member's own gating applied.
- **Negative:** a converted block's declaration is now two objects in one file
  — the block's knobs and its members'. ADR 0020 already accepted two files per
  block; this is a third thing on the same page.
- **Negative:** the array field name is now load-bearing in two places, the
  schema and the `items` key. Nothing checks that they agree, because the knobs
  directory may not import `sanity` and cannot see the schema. A typo files the
  spec under an array that does not exist and the menu silently offers nothing
  — the same class of miss as an unconverted block. **Closed by
  [#118](https://github.com/o3world/o3-sanity/issues/118)**, which taught
  #114's guard to walk the member root: the guard imports both the schema and
  the declarations, so it is the one place that can see the two halves of the
  key at once, and a spec hung off an array the schema does not carry is
  reported by name.
- **Risks / open questions:** the lookup deliberately answers nothing for a
  member inside another member. Nothing produces one today, and the overlay
  cannot attach inside `layoutSection.items` anyway (#115), but a second
  nesting host would need a decision rather than an extension. Shared objects
  that are both base blocks and inline members (`figure`, `cta`, `stat`) still
  have no home for their per-item knobs — map #101's open fog, and the one case
  where a `_type` key would have been natural. **Answered by
  [ADR 0023](/adr/0023-an-instance-is-configured-by-its-component)**, which
  gives them exactly that key: a shared object's name is global, so the
  silent-collision argument above does not apply to it.

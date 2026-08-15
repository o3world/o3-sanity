# 0023. An instance is configured by its component

- **Status:** Accepted
- **Date:** 2026-08-14
- **Deciders:** NickO3 + Claude
- **Related:** [map #101](https://github.com/o3world/o3-sanity/issues/101), [issue #113](https://github.com/o3world/o3-sanity/issues/113), [ADR 0021](/adr/0021-an-array-member-is-its-own-knob-root), [ADR 0020](/adr/0020-a-block-declares-its-knobs-once), [ADR 0026](./0026-contrast-resolves-from-the-nearest-declared-surface.md) — the context-resolved knob this ADR pre-authorised

## Context

`mark` and `cta` are shared objects with design options, and each sits in three
kinds of position at once: a named object field on a section block
(`heroSection.cta`, `mark` on four blocks), a member of the polymorphic
`layoutSection.items`, and fields outside the block tree entirely
(`supporting.ts`'s nav and footer). `KnobRoot` is `BlockKnobs | ItemKnobs` and
`canvasSubject` knows three levels (`band | item | field`), so a hovered mark
or button resolves to `field` and offers nothing — and #113's remaining half
(mark's `hidden` closures, cta's `variant`) has no home to convert into.

[ADR 0021](/adr/0021-an-array-member-is-its-own-knob-root) rejected a
`_type`-keyed registry for array members because a member name is local to its
array and a collision is silent in both directions. Its own risks section named
the case that decision left open: shared objects that are both base blocks and
inline members, "the one case where a `_type` key would have been natural."

The vocabulary question resolved alongside this (CONTEXT.md → Component,
instance, slot): the repo adopts Figma's pair — a **component** is the
definition, an **instance** is one placed occurrence.

## Decision

**A shared object declares its own knob spec, keyed by its Sanity type name —
a third `KnobRoot`, and an instance exposes that spec wherever it is placed.**

Concretely:

- An `ObjectKnobs` registry keyed on the type name (`cta`, `mark`) joins
  `BlockKnobs` and `ItemKnobs`. One declaration per shared object; nothing is
  re-declared per placement.
- The canvas gains a fourth subject level, **`instance`**, between `item` and
  `field`. Resolution walks outward from the hovered element to the nearest
  enclosing object with a declaration — a `mark` inside `panels[_key]` is not
  itself keyed, its path is.
- A placement may not redefine an instance's knobs. Configuration that varies
  by position is a resolution concern (a value read from context), never a
  second declaration.

The collision argument that forced host-routing in ADR 0021 does not apply
here, and the distinction is principled rather than convenient: Sanity
registers a shared object's name globally, so two types cannot silently agree
on `cta` the way two blocks can each declare a `screen`. `mark.ts`'s doc
comment already asserts the conclusion — "one definition, so a mark is
configured identically wherever it is placed." Prior art is unanimous on the
same split: Figma defines properties on the main component and every instance
exposes them, a custom element's attributes belong to the element and not to
where it is slotted, and Storybook's `argTypes` hang off the component meta,
never the story that places it.

## Alternatives considered

### The host block declares it

Extend ADR 0021's shape: every block that embeds a `mark` hangs the spec off
its own declaration.

- **Pros:** no new `KnobRoot`, no new subject level, and one rule for
  everything below a block.
- **Cons:** declares `mark` four-plus times, drifting apart silently — the
  exact cost ADR 0020 exists to remove. And it cannot reach
  `layoutSection.items` at all: `ItemKnobs` is one spec per array field, and
  that array holds six member types.
- **Why not:** the argument that justified host-routing for members — local
  names can collide — does not hold for globally registered types, so the
  repetition buys nothing. A shape that cannot express the polymorphic array
  is not a smaller version of the answer; it is a different answer that runs
  out.

### Schema only, defer the canvas

Generate the fields from a spec and kill the `hidden` closures, satisfying
#113's stated "done when," but add no `KnobRoot` and leave the hovered
instance with no surface.

- **Pros:** smallest diff now; no `subject.ts` change; nothing speculative.
- **Cons:** a hovered mark or button still resolves to `field` and offers
  nothing, which reads as broken chrome the moment the button work lands. The
  same files are re-opened for the surface within weeks.
- **Why not:** the button rename makes `cta` the most-touched object on the
  canvas; shipping it configurable in the form but dead on the canvas is the
  split ADR 0020 was written to prevent — one concept, two behaviours,
  depending on which surface an editor happens to use.

## Consequences

- **Positive:** `mark` and `cta` convert once, closing #113's remaining half,
  and the button work lands on a root that already exists instead of deciding
  this under deadline.
- **Positive:** the vocabulary and the mechanism now say the same thing. An
  instance is configured by its component is one sentence, and it is also the
  registry's shape.
- **Negative:** a fourth subject level in `subject.ts`, and resolution gains a
  walk — nearest enclosing declared object — where the three existing levels
  are direct lookups.
- **Negative:** a second silent-miss surface: a shared object added without a
  spec offers nothing, the same class of miss as an unconverted block. #114's
  guard is the enforcement point and must learn the object registry the way
  #118 taught it the member root.
- **Risks / open questions:** instances inside `layoutSection.items` still
  cannot be reached by the overlay ([ADR 0022](/adr/0022-the-layout-column-stays-polymorphic)) —
  the declaration is ready for them, the surface is not; that ADR's reopen
  trigger ("a base block wanting a knob") is now armed by design rather than
  hypothetically. And "configured by context, not by placement" (a button
  resolving band contrast from the nearest surface) is deliberately allowed by
  the resolution-not-declaration rule above, but no such knob exists yet; the
  first one should cite this ADR and say how it resolves.

## Consequences, revisited

Written after [#145](https://github.com/o3world/o3-sanity/issues/145) converted
`mark` and `cta` — the whole of the decision, both roots and both directions of
the guard. What follows is what happened, checked against what the section above
claimed.

- **The fourth level is not in `subject.ts`, and it cannot be.** The Decision
  says the canvas gains an `instance` level "between `item` and `field`", which
  reads as a change to `canvasSubject`. `canvasSubject` is a pure function of
  the hovered path, and an instance is not knowable from a path: `mark` is a
  field name on four blocks and a keyed member in a column, and only the stored
  `_type` distinguishes it from any other field. The overlay resolver has the
  path and no document, so the walk lives one level down in `nearestInstance`,
  where the draft snapshot is. `instance` is a fourth **knob surface** instead —
  which is what the menu groups on, and what routes a pick to the right root.

- **`defineBlockKnobs` refuses an instance knob**, the way it already refused an
  item knob, so "a placement may not redefine an instance's knobs" is a compile
  path that does not exist rather than a rule someone remembers.

- **The guard learned the object registry, and it learned it asymmetrically.**
  Blocks are walked declaration-first, because `defineSectionBlock` will not
  build one without a spec. Shared objects are walked schema-first, over every
  registered object whether or not anybody declared knobs for it — because a
  shared object can still reach for `defineType` directly, and the silent miss
  this ADR predicted is exactly an object that publishes a closed set nobody
  declared. `defineSharedObject` is the compile-time half; the guard is the half
  that catches an object which does not use it.

- **`mark` had four closures, not three, and only three of them were knobs.**
  `kind`, `state` and `size` are closed sets and convert; `speed` (a free
  multiplier) and `paused` (a boolean) are not sets an editor picks from, so
  they stay hand-written fields and borrow the same declared gate through
  `hiddenUnless`. The rule ADR 0020 arrived at for `heroSection.eyebrow` holds
  one root down: gating is not the tell, the closed value set is.

- **The adapter draws every knob as a select list.** `mark.state` has nine
  options and forced the question; the answer is that a knob is a select
  whatever its size, which is the house preference and the shape that keeps
  reading as one choice as a set grows. `knobFields` sets no `layout:` at all
  and takes Sanity's default, so there is no size rule to remember and no
  presentation fact travelling into `Knob`.

- **`generated.ts` did not move.** Field order and field types are preserved
  through `withKnobFields`, which is the whole reason the splice is shared, and
  a typegen run produces a byte-identical file. That is the property that let
  two schema types convert without touching a renderer.

- **Optimistic fold-back does not reach an instance yet.** `patchableKnobRoots`
  answers for a block's own roots and `patchableItemRoots` for a member's, and
  an instance inside an array member is neither. A pick on a mark lands on the
  mutation round-trip rather than on the click. Nothing is wrong on screen, it
  is a beat slower than a block knob — the same gap #122 closed for members, at
  the root added here.

# 0026. Contrast resolves from the nearest declared surface

- **Status:** Accepted
- **Date:** 2026-08-15
- **Deciders:** NickO3 + Claude
- **Related:** [spec #137](https://github.com/o3world/o3-sanity/issues/137), [issue #147](https://github.com/o3world/o3-sanity/issues/147), [ADR 0023](./0023-an-instance-is-configured-by-its-component.md), [ADR 0020](./0020-a-block-declares-its-knobs-once.md), [ADR 0008](./0008-shadcn-anatomy-not-theme.md)

## Context

[ADR 0023](./0023-an-instance-is-configured-by-its-component.md) closed with an
open question and pre-authorised its answer: "configured by context, not by
placement (a button resolving band contrast from the nearest surface) is
deliberately allowed by the resolution-not-declaration rule above, but no such
knob exists yet; the first one should cite this ADR and say how it resolves."
This is that knob, and this is the saying.

The button's one design option was `variant`, spelled `dark | light | ghost` —
named for the button's own colour rather than for what it stands on. An editor
choosing `light` on a light band produced an invisible button, and nothing told
them. On the bands where that mistake was likeliest, the renderer took the
choice away instead: four call sites forced a fill past whatever the document
said.

```
HeroSection      variant="light"   "this band owns its background"
CtaSection       variant="light"   "the fill is structural rather than editorial"
SiteNav          BUTTON_BRAND_RED  "the chrome owns its own surface"
InquiryForm      surface === 'ink' ? 'light' : 'dark'
```

Those comments are the feature written out in prose. Three of them argue that
the band knows which fill is readable on it, and the fourth computes exactly
that. What none of them could do is generalise: a control that turns and does
nothing, on four bands, with no way for an editor to find out which four.

## Decision

**The knob is `contrast`, its default is `auto`, and Auto resolves from the
nearest enclosing declared surface — through React context, in the content
layer, by one pure function in `@o3/block-spec`.**

### It is called contrast

`variant` is already this repo's word for the axis that changes what a block
_is_: `heroSection.variant` picks a composition, `mediaSection.variant` picks a
treatment, `collectionHero`'s picks a generation. A second axis on the button —
emphasis — is filed and deliberately not built (#137), and the shaping
constraint on it is that adding it must cost one declaration. Two axes on one
component, one of them called `variant`, leaves nobody able to say which is
which. The axis this names is the button's relationship to its background, so
it is called that.

### The rule, entire

```
auto  + white  →  dark      dark    →  dark     (on any surface, or none)
auto  + bone   →  dark      light   →  light
auto  + ink    →  light     ghost   →  ghost
auto  + none   →  dark      brand   →  dark     (retired, mapped)
                            inverse →  light    (retired, mapped)
```

Four properties are load-bearing:

- **An explicit choice is honoured everywhere.** This is the half that is new.
- **No surface gives `dark`.** A light button on an unknown background is the
  one answer that can render invisible; a dark one on ink is merely wrong.
- **Auto never gives `ghost`.** "Readable on this band" and "deliberately
  unfilled" are separate decisions, and collapsing them would also be the first
  step towards `contrast` quietly meaning emphasis.
- **Anything unrecognised resolves like Auto**, because that is what the
  editor's control is showing them: `resolveKnobValue` falls a stored value
  outside the option set back to `initialValue`, which is `auto`. A control
  reading _Auto_ while the page draws something else is the disagreement ADR
  0020 exists to remove.

`resolveContrast(stored, surface)` sits beside `resolveKnobValue(knob, stored)`
in the zero-dependency spec package. One answers what a **control displays**,
the other what the **renderer draws**; keeping them in one package is what lets
the canvas show an editor what Auto currently means without a second copy of
the table. It absorbs the pre-#42 legacy map that `ButtonLink` used to carry,
so a dataset that has not been rebuilt — and every `migration.locked` document —
keeps resolving.

### Whatever paints a background declares it

`SurfaceProvider` is a React context in `@o3/ui`. `SectionShell` renders one
around every band that uses it, so nine of the sixteen section blocks get it for
free; the seven that build their own `<section>` reach for it in the same breath
as `SURFACE_CLASS`. `CollectionHero` declares `ink`.

**Chrome declares its own.** The nav pill, the utility strip and the footer sit
outside the block tree and never enter a band, and they are exactly where the
instances carrying no explicit fill live. All three declare `ink`. Making Auto
unavailable outside a band was rejected: the knob would then mean two things
depending on where the instance sits, with nothing on screen saying which.

The nav's brand red goes with the override. Figma's nav pill instances
`Theme=White` (`2205:1298`) — white fill, ink label — and the shipped red
matches nothing in the design file; Figma outranks the shipped site. The button
does not follow the ink flip, because contrast resolves from a surface a band
_declares_ and the flip is a runtime read of what happens to be passing
underneath.

### The presentational button learns nothing

`@o3/ui`'s `Button` still knows `dark | light | ghost` and nothing about
surfaces, contexts or a CMS. Resolution happens one layer up, in `ButtonLink`,
which is what keeps the component usable in Storybook and in the design-system
package (ADR 0008).

## Alternatives considered

### Thread a `surface` prop through every renderer

Each block already resolves its own surface; pass it to `ButtonLink`.

- **Pros:** no context, no client-component boundary, and the value's path is
  visible in the source.
- **Cons:** it cannot reach a `button` base block dropped into a
  `layoutSection` column. That block receives its own fields and nothing about
  where it landed, and the dispatch seam is generic over six member types. It
  also puts a `surface` prop on ten call sites that exists only to be forwarded.
- **Why not:** a rule with a hole in the one placement the layout builder is
  about is not a smaller version of the answer. And a prop cannot express
  "nearest enclosing" at all — every intermediate component would have to know
  to forward it.

### Resolve in CSS, off a `data-surface` attribute

The band stamps an attribute; the button carries `[data-surface=ink]_&:…`
variants.

- **Pros:** no context, no client boundary, no JS.
- **Cons:** the resolution is then in a Tailwind variant rather than in a
  function, so the canvas cannot say what Auto means, Storybook cannot test it,
  and the rule lives in a string.
- **Why not:** #137 asks for one pure function precisely so the renderer, the
  canvas and Storybook cannot disagree. A CSS rule is a fourth opinion.

### Keep `variant` and add `auto` to it

Rename nothing; add the option.

- **Pros:** no content migration, no generated-types churn, one commit smaller.
- **Cons:** it defers the collision rather than avoiding it. The emphasis axis
  is already filed; adding it beside a `variant` that means contrast is a
  second rename over the same 39 instances plus whatever has been authored by
  then.
- **Why not:** the rename is cheapest now, when the corpus is 47 instances and
  the compile-time contract catches every site.

## Consequences

- **Positive:** an editor changes a band from white to ink and the buttons on it
  flip by themselves; they never learn which fill is safe on which band. The
  four overrides are gone and the choice an editor makes is honoured
  everywhere.
- **Positive:** "whatever paints a background declares it" is one rule, applied
  to all sixteen bands and all three pieces of chrome, so a band added later
  serves the buttons in it without anyone thinking about contrast.
- **Positive:** a vocabulary gap is closed. A _context-resolved knob_ is a knob
  whose selector exists and one of whose options declines to answer, deferring
  to a pure function of the render context. That reconciles ADR 0023's use of
  "knob" with the spoken definition that requires a selector.
- **Negative:** `ButtonLink` is now a client component, and it is the
  most-placed component in the system. The boundary is small — a label, an
  optional icon, and an element choice — and `next/link` had already crossed
  it for every button with a destination, but it is a real cost and the only
  one context imposes.
- **Negative:** a second silent-miss surface, of the class ADR 0023 already
  named. A bespoke band that paints a surface and forgets to declare one gives
  its buttons `dark`, which is readable on two surfaces out of three and
  therefore quiet on the third. Nothing enforces the pairing; `SURFACE_CLASS`
  and `SurfaceProvider` sitting in the same import is the only prompt.
- **Negative:** the nav button's fill is fixed while the bar's skin flips. On a
  light band the pill goes `scrim-light` and the button stays white. That is
  what the design file draws and what the shipped red also did, but it is now a
  consequence of the resolution rule rather than a choice, and a flipping
  button would need the surface to be a runtime value rather than a declared
  one.
- **Risks / open questions:** existing instances keep their explicit fills —
  39 of 47 — so the site looks the same on the day this ships and Auto governs
  only new instances and the eight that never carried one. Migrating the 39 is
  a follow-up with a provably empty visual diff. And the interior-page hero
  composition still wants an eye on it: `CollectionHero` declares `ink` for both
  its generations, but that branch renders no button today, so the declaration
  is provision rather than a change.

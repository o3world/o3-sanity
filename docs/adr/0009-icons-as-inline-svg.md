# 0009. Icons ship as inline SVG, not an icon font or an icon library

- **Status:** Accepted
- **Date:** 2026-08-01
- **Deciders:** NickO3 + Claude
- **Related:** [issue #38](https://github.com/o3world/o3-sanity/issues/38), [issue #33](https://github.com/o3world/o3-sanity/issues/33), [ADR 0008](./0008-shadcn-anatomy-not-theme.md)

## Context

The canonical frames draw icons as **Material Symbols Outlined** glyphs, driven
by a text property on a component: `.building block Icon_text` (`136:14`) takes
an `Icon name` prop whose value is the literal glyph name — `arrow_forward`,
`close`. Every `Button / Solid` instance carries one at 20px.

That is a font-based icon system, and adopting it literally means shipping a
webfont. #36's working agreement requires a new dependency to be surfaced
rather than assumed, and this is one either way — a font, an icon package, or
neither.

The glyph inventory is **small and not fully known**. Confirmed in canonical
frames: `arrow_forward` (every button) and `close`. The perspectives carousel
controls (`Icon / Surface`, `778:1862`) and the 402 nav's "Open menu" affordance
(`1814:1636` — three drawn bars, not a glyph) suggest a handful more. A complete
list needs a per-frame audit that no page layer is blocked on.

## Decision

**Inline SVG components, one per glyph, in `packages/ui`. No icon font, no icon
package.** Glyph paths are taken from Material Symbols (Apache-2.0), so the
shapes still match the frames exactly.

The repo already works this way — `ArrowIcon` is a hand-drawn O3 arrow from the
prototype era. This extends that pattern rather than introducing one.

Three reasons, in order of weight:

1. **A webfont is a blocking request for a marketing site.** Material Symbols
   Outlined is a variable font in the hundreds of KB; even subset, it is a
   render-blocking dependency for what is currently two glyphs. This site's
   whole job is to load fast for a prospective client.
2. **Icon fonts fail badly.** Before the font loads, or if it fails, glyph names
   render as literal text or tofu boxes — and because the glyph _is_ text, it is
   read by screen readers unless every instance is hidden by hand.
3. **The glyph list is unknown and small.** An approach that costs one file per
   glyph scales cleanly from two; an approach with a fixed several-hundred-KB
   floor does not, and would be paid in full on day one for `arrow_forward`.

**Adding a glyph is a per-ticket step**, like adding a shadcn component (ADR
0008): copy the path from Material Symbols at the size the frame specifies, add
it beside `ArrowIcon`, give it a story.

## Alternatives considered

### Ship Material Symbols Outlined

- **Pros:** exact parity with Figma, and `Icon name` maps to a prop with no translation — the component map stays literal.
- **Cons:** a render-blocking font for a handful of glyphs; tofu/flash-of-text before load; glyphs are text and need hiding from assistive tech at every call site. Subsetting helps the bytes but adds a build step and has to be redone whenever a frame introduces a glyph.
- **Why not:** the cost is paid on every page load for every visitor, to save an occasional copy-paste.

### `lucide-react` (shadcn's default)

- **Pros:** tree-shaken SVG, one dependency, huge coverage, and the natural fit alongside shadcn components.
- **Cons:** **it is not the icon set the design uses.** Lucide's `arrow-right` is a different drawing from Material's `arrow_forward` — different weight, terminals, and optical size. Adopting it silently substitutes the design's icon language, and #33 says Figma wins on visual language.
- **Why not:** it trades design fidelity for convenience, in the one area where the frames are unambiguous. Reconsider only if the glyph count grows past what hand-copying can carry.

### Inline SVG, drawn by hand rather than from Material Symbols

- **Pros:** total control; no third-party licence to track.
- **Cons:** redrawing a standard arrow by eye is how you get an arrow that is subtly not the one in the frame.
- **Why not:** the paths are Apache-2.0 and exact. Copying them is both cheaper and more faithful.

## Consequences

- **No new runtime dependency.** The icon question is settled without one, which
  is the outcome working agreement 3 exists to check.
- `.building block Icon_text`'s `Icon name` **text prop does not survive into
  code**. It becomes a component choice — `<ArrowIcon />` — not a string prop.
  Passing glyph names as strings would recreate the icon-font ergonomics without
  the font, and defeats tree-shaking.
- Attribution: Material Symbols is Apache-2.0, which requires the licence be
  carried. Noted where the glyphs live.
- Icons are decorative in every canonical use — they sit beside a text label —
  so they render `aria-hidden`, with the label carrying the meaning. The one
  exception is the 402 nav's menu control, which is icon-only and needs an
  accessible name (#41).
- If a future frame needs many glyphs at once, this decision is worth revisiting
  against `lucide-react` — but only alongside a design decision to change icon
  language, since the two are the same question.

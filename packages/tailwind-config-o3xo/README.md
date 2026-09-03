# @o3/tailwind-config-o3xo

The O3XO design tokens — the second brand's paint, and the sibling of
[`@o3/tailwind-config`](../tailwind-config/README.md), which stays O3's
([ADR 0028](../../docs/adr/0028-o3xo-is-a-second-app-in-the-monorepo.md)).

A consumer imports the base theme first and this one second, then sets
`data-brand="o3xo"` on `<html>`:

```css
@import '@o3/tailwind-config/theme.css';
@import '@o3/tailwind-config-o3xo/theme.css';
```

The order is load-bearing. The base theme declares its colors in a plain
`@theme` block, so every utility it generates compiles to `var(--color-*)`;
this package re-points those custom properties under
`:root[data-brand='o3xo']`, which reskins every token-reading component
without touching one. That is the mechanism the Storybook probe proved and
ADR 0028 adopted.

`theme.css` is an index; each concern lives in its own file under `tokens/`.

## Provenance

Every value is read off the **O3XO: UI kit** Figma file
(`G6M2gu5qKFvhGxwj3W365b`) — the `↳ Color` canvas (`4214:2932`) for the paint,
the `↳ Typography` canvas (`462:833`) for the ramp, and the Grids frame on the
`↳ Layouts` canvas (`4214:3643`) for the breakpoints. Each token's comment
names the kit's own swatch or style. The action red is confirmed against the
Button set (`4405:6386`), where every solid variant fills it.

Where the kit is silent, **the live site is the fallback record** (ADR 0028's
second addendum). One type step comes from it and says so: `display-md`.

Within that file only the Website Components canvases, the Layouts canvas and
the Styles canvases are trustworthy; `Templates (Old)` and `Asset Dump` are
working material. Read
[`docs/agents/figma.md`](../../docs/agents/figma.md) before adding to this
package — use the `figma_rest` MCP server, and confirm you are on the frame
rather than a child node.

Two values are not read off a frame, and each says so where it is declared.
`bone-soft` is interpolated, because the kit has no swatch between `grey/95`
and `white/solid`. `--gradient-sphere-bloom` is derived from O3's, because the
kit draws no orbital sphere — see Gradients below.

## What this package does not carry

Band rhythm, radii, motion, and the document-level base rules.

Roles the kit paints the way O3 does are left out rather than restated: a
restated value is one more place to drift. Each token file names the ones it
skipped and why — `white`, `utility`, the `on-ink-*` alphas, `scrim-light`,
`on-light-line`, the card scrims and the ink fade.

## Roles are shared; vocabularies may diverge

`white | bone | ink` are **roles**, not colors. Both packages define them and
neither renames them, so a section block storing `surface: 'bone'` paints
O3's warm `#F1F0EC` or O3XO's cool `#F3F3F3` depending only on the brand
attribute.

Where the vocabularies diverge, the brand-only role lives in one package
alone. Today that is **`accent`** — O3XO's yellow, which no O3 role names.

A component in `packages/ui` or `packages/content-ui` may only reach for roles
**both** packages define. `packages/ui/src/brand-token-seam.test.ts` is the
guard: it derives the shared vocabulary and the brand-only roles from these
files, so a role added to both packages is legal the moment it lands and a role
added to one is not. It reads the utility class, a `var()` reference and the raw
hex alike; comments are exempt, which is what lets a component explain why it
does not paint with `accent`.

`accent` is declared in a `@theme reference` block so the utilities exist
without the variable being emitted at `:root`; the only `--color-accent`
declaration that lands in the document is inside the `[data-brand='o3xo']`
block. Note what that does **not** buy: Tailwind compiles the utility to
`var(--color-accent, #ffbe00)`, fallback included, so `bg-accent` in a shared
component still paints yellow under `data-brand="o3"` in Storybook. No CSS
arrangement prevents that — the lint is the guard.

## Colors (`--color-*`)

| Token             | O3XO value          | Kit swatch      | O3's value          |
| ----------------- | ------------------- | --------------- | ------------------- |
| `brand`           | `#DC2626`           | `red/solid`     | `#EB1000`           |
| `accent`          | `#FFBE00`           | `orange/50`     | — (O3XO only)       |
| `ink`             | `#111827`           | `azure/11`      | `#0A0A0B`           |
| `ink-warm`        | `#20252B`           | `azure/15`      | `#0F100B`           |
| `ink-deep`        | `#000000`           | `black/solid`   | `#030303`           |
| `bone`            | `#F3F3F3`           | `grey/95`       | `#F1F0EC`           |
| `bone-soft`       | `#F9F9F9`           | ⚠️ interpolated | `#F7F7F6`           |
| `fg`              | `#111827`           | `azure/11`      | `#232323`           |
| `fg-body`         | `#4B5563`           | `azure/34`      | `#55524E`           |
| `fg-muted`        | `#4B5563`           | `azure/34`      | `#76746F`           |
| `fg-subtle`       | `#9CA3AF`           | `azure/65`      | `#A3A3A3`           |
| `fg-quiet`        | `rgba(17,24,39,.5)` | `azure/11` @50% | `rgba(10,10,10,.5)` |
| `scrim`           | `rgba(0,0,0,.2)`    | `black` @20%    | `rgba(3,3,3,.2)`    |
| `surface-muted`   | `#E5E7EB`           | `grey/91`       | `#D3D3D3`           |
| `on-utility`      | `#9CA3AF`           | `azure/65`      | `#AAA69E`           |
| `on-utility-line` | `#20252B`           | `azure/15`      | `#242321`           |
| `line`            | `#E5E7EB`           | `grey/91`       | `#D6D3CC`           |
| `line-soft`       | `#F3F3F3`           | `grey/95`       | `#ECECEA`           |

Two places the palettes are shaped differently, not just coloured
differently:

- **The darks do not split three ways.** O3 runs `ink` / `ink-warm` /
  `ink-deep` at three jobs. The kit draws `azure/11` for the dark surface and
  `black/solid` for the gradient floor and has no third, so `ink-warm` takes
  the next azure step up rather than inventing a warm black the brand does
  not have.
- **Body and muted copy are one value.** O3's `fg-body` and `fg-muted` are two
  reads off two generations of frame. The kit sets both at `azure/34`, so they
  converge here.

## Typography (`--text-*`)

The face is **Figtree** in both brands, so the family stacks are not restated.
The kit draws Light 300 through Bold 700 and the app loads the variable face
through `next/font/google`, whose weight axis covers all of it.

The `↳ Typography` canvas is a spec sheet: each named style is drawn twice,
from a two-mode variable collection (`279:1431`) — a desktop column and a
mobile one. The clamps are **solved** to hit the mobile value at **430** (the
kit's phone-portrait artboard, `4214:3650`) and the desktop value at **1440**
(the width every kit band is drawn at, `4406:6595` and its neighbours), the
way O3's ramp is solved between its own two frame widths.

| Utility             | 430    | 1440   | Weight | Leading | Kit style      |
| ------------------- | ------ | ------ | ------ | ------- | -------------- |
| `text-hero`         | `48px` | `60px` | 400    | 1.2     | H1             |
| `text-cta`          | `36px` | `48px` | 400    | 1.2     | H2             |
| `text-display-xl`   | `36px` | `48px` | 400    | 1.2     | H2             |
| `text-quote`        | `24px` | `36px` | 300    | 1.2     | H3, in Light   |
| `text-display-lg`   | `24px` | `36px` | 400    | 1.2     | H3             |
| `text-body-heading` | `24px` | `36px` | 400    | 1.2     | H3             |
| `text-display-md`   | `28px` | `28px` | 400    | 1.2     | ⚠️ live site   |
| `text-display-sm`   | `20px` | `24px` | 400    | 1.2     | H4             |
| `text-lead`         | `18px` | `20px` | 300    | 1.5     | Intro          |
| `text-body`         | `16px` | `16px` | 300    | 1.5     | P regular      |
| `text-eyebrow-lg`   | `16px` | `16px` | 300    | 1.5     | P regular      |
| `text-button`       | `18px` | `18px` | 500    | 1.333   | Interactive lg |
| `text-eyebrow`      | `14px` | `14px` | 400    | 1.45    | Label          |
| `text-meta`         | `14px` | `14px` | 400    | 1.45    | Label          |
| `text-nav`          | `14px` | `14px` | 500    | 1.429   | Interactive sm |
| `text-legal`        | `12px` | `12px` | 500    | 1.667   | Interactive xs |

**Tracking is 0 on every step.** O3 tracks `hero`, `cta`, `display-md` and
both eyebrows; the kit tracks nothing, and neither does the live site.

`text-button` is the one step the two brands agree on to the pixel, so it is
not restated. `text-display-md` is the one step the kit's ramp does not name —
it falls in the gap between H3 (36) and H4 (24), and the live site draws 28
there at both the insights index and inside an insight.

Three shapes are worth naming because they are not O3's:

- **The kit sets long-form prose in Light at 16.** O3 reads it at 20/1.6 in
  Regular. Every heading, by contrast, is Regular where O3's `Heading/*`
  styles have moved to Light.
- **There is no bold, tracked eyebrow.** The kit's one Label style carries
  both the card kicker and the meta row, and the section-level kicker is drawn
  as body copy. The uppercase transform stays in the base theme's `eyebrow`
  utility; the kit's section kicker is sentence case, which is the header
  pill's business rather than a token's.
- **`cta` and `display-xl` ride one step.** The kit sets the CTA band headline
  at the same size as every section headline.

## Breakpoints (`--breakpoint-*`)

The Grids frame (`4214:3643`) states the contract on the frame: Radix widths,
min-width based. The kit's first band is the unprefixed base, so the five
prefixes carry the five thresholds above it.

| Prefix | O3XO     | Kit band            | Columns | Gutter | Page margin |
| ------ | -------- | ------------------- | ------- | ------ | ----------- |
| —      | `0`      | Phones (portrait)   | 4       | `16px` | `16px`      |
| `sm`   | `520px`  | Phones (landscape)  | 8       | `16px` | `16px`      |
| `md`   | `768px`  | Tablets (portrait)  | 8       | `24px` | `16px`      |
| `lg`   | `1024px` | Tablets (landscape) | 12      | `24px` | `96px`      |
| `xl`   | `1280px` | Laptops             | 12      | `24px` | `96px`      |
| `2xl`  | `1640px` | Desktops            | 12      | `24px` | centered    |

Only `sm` and `2xl` move off Tailwind's scale; the other three are named
anyway so the list reads as one scale and the compiled media queries carry the
kit's own numbers.

**This is the one thing in the package that is not a brand block.** Tailwind
compiles `lg:` to a literal media query and no media query can read a custom
property, so the breakpoints are declared in `@theme` and reach every
stylesheet that imports this file — `apps/o3xo`, and Storybook, which loads
both brands. `packages/ui/src/brand-ramp-seam.test.ts` guards both halves: the
ramp must stay in the brand block, and the breakpoints must stay out of it.

## Gradients

Six fills carry a brand color and are re-pointed: `--gradient-statement`,
`--gradient-brand-glow`, `--gradient-sphere-bloom`, and the three surface
washes. Same shapes and stop positions as the base theme — those are
composition — with O3XO's colors.

`--gradient-sphere-bloom` is the second value in this package that is not read
off a frame, and the reason differs from `bone-soft`'s: the kit draws no
orbital sphere at all, because the sphere is O3's composition. Its stops are
O3's sampled stops moved onto O3XO's red — hue to 0°, saturation × 0.83, value
held — which keeps the falloff the hero raster was measured for.

`text-gradient` and `bg-brand-glow` are `@utility` classes in the base theme
that read these custom properties, so they follow the brand with no
redeclaration here.

## Verifying

There is no `tokens:dump` in this package: it emits one scoped block and three
accent utilities, so a compile diff says less than looking at it does. The
check that matters is Storybook's **Brand** toolbar — flip it on any story and
watch the paint move. A component that does not move is a hardcoded-paint leak
(the shortlist is #221).

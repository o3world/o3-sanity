# @o3/tailwind-config

The O3 design tokens — a CSS-first Tailwind v4 theme. Every app and package in
the monorepo imports one file:

```css
@import '@o3/tailwind-config/theme.css';
```

`theme.css` is an index; each concern lives in its own file under `tokens/`.

## Provenance

Every value is read off the **canonical Figma frames** — the "Design Concept"
section (`1632:1510`) of _O3DX: Visual exploration_
(`RvraLJaZ0zWm8UaD5AJf43`), at the authoritative **1440** desktop width. Each
token's comment names the node it came from.

Figma is the source of record (map #33) and outranks `prototype/`, which is
retired (#48). These tokens were previously extracted from the prototype; where
the two disagreed, the Figma value won. `drift` in
`packages/ui/src/foundations/figma-home-spec.ts` records every disagreement.

Read [`docs/agents/figma.md`](../../docs/agents/figma.md) before adding to
this package — the file has traps that have already cost two tickets.

## What earns a token

A Figma value becomes a token when **either**:

- **(a)** it is bound to a named Figma variable (`text/tertiary`,
  `Layout/Layout 128`, `Gradient/Red/1`), **or**
- **(b)** it recurs — the same value doing the same job in two or more places
  across the canonical frames.

Everything else stays a **literal at the call site**, with its node ID in a
comment. A value that appears exactly once is composition, not vocabulary — the
pull-quote attribution's `1.5em` line-height, the 5.8px carousel chip, the 87px
CTA bleed strip, the 1026px partners measure.

Two tokens deliberately break the rule and are marked **NO CANONICAL ANCHOR**:
`brand-tint` and `line`/`line-soft` are prototype-era values kept alive by
existing call sites, pending #38.

## Responsive

**Responsive is a renderer concern** — one set of fields at every width, no
per-breakpoint schema. The frames are **endpoints, not breakpoints**: Tailwind's
default scale stands, with base = the 402 frame and `lg` (1024) = the 1440
frame's composition. `md` is licensed for intermediate reflow but **no frame
backs it**, so anything placed there is a code decision.

Size **interpolates** between the two frame widths; composition **switches** at
`lg`. Two sections diverge structurally — the NavBar (pill → hamburger) and the
insights carousel (→ vertical stack). Full reasoning and the band-by-band
comparison: [ADR 0006](../../docs/adr/0006-responsive-contract.md).

## Surfaces

The design runs on **five neutrals**, not three. The `white | bone | ink`
enum on section blocks survives, but the darks split three ways:

| Token       | Value     | Role                                                           |
| ----------- | --------- | -------------------------------------------------------------- |
| `white`     | `#FFFFFF` | Plain light band (platforms, ways-to-work); light button fill  |
| `bone`      | `#F1F0EC` | Partners, pull quote, insights — often washed, not flat        |
| `bone-soft` | `#F7F7F6` | Bone's lighter end — the warm wash's near-white                |
| `ink`       | `#0A0A0B` | The dominant dark: headlines on light, dark buttons, card base |
| `ink-warm`  | `#0F100B` | The Work / Live hero band only                                 |
| `ink-deep`  | `#030303` | Gradient stops and the NavBar pill                             |
| `utility`   | `#000000` | The black chrome: Utility Nav strip and the footer band        |

The 2026-08 Figma token pass bound these to a proper variable collection and
warmed two of them (`bone` was `#F0F0F0`, `ink` was `#0A0A0A`); variable ids
are in each token's comment in `tokens/color.css`.

## Colors (`--color-*`)

| Token                | Value                   | Role                                                            |
| -------------------- | ----------------------- | --------------------------------------------------------------- |
| `brand`              | `#EB1000`               | Flat **once** on Home — the footer link headers. Else the glow. |
| `brand-tint`         | `#FF6A5A`               | ⚠️ No canonical anchor — prototype-era, pending #38             |
| `fg`                 | `#232323`               | Body copy and card titles on light bands (`text/default`)       |
| `fg-muted`           | `#76746F`               | The **neutral** eyebrow and card meta (was `#636363`)           |
| `fg-subtle`          | `#A3A3A3`               | ⚠️ No canonical anchor — legal row moved to `on-utility`, #38   |
| `fg-quiet`           | `rgba(10,10,10,.5)`     | Pull-quote attribution — tinted ink, not a grey                 |
| `on-ink`             | `rgba(255,255,255,.92)` | CTA band headline (`color/white/ 92%`)                          |
| `on-ink-muted`       | `rgba(255,255,255,.65)` | Stat labels beside the 48px figure                              |
| `on-ink-subtle`      | `rgba(255,255,255,.6)`  | CTA band subhead (`color/white/ 60%`)                           |
| `on-ink-line`        | `rgba(255,255,255,.2)`  | The orbital arc behind the footer; hairlines on dark            |
| `scrim`              | `rgba(3,3,3,.2)`        | The floating pill NavBar fill                                   |
| `surface-muted`      | `#D3D3D3`               | Carousel controls (`bg/button/secondary`)                       |
| `line` / `line-soft` | `#DDDDDB` / `#ECECEA`   | ⚠️ No canonical anchor — the frames separate with washes        |

**Copy on dark is white at an alpha, never a solid grey** — it has to
composite over the photography behind it. `fg-inverse-muted` and `ink-soft`
survive as deprecated aliases (`on-ink-muted` and `ink` respectively) so
existing call sites keep compiling; both go in #38.

## Typography

**Figtree** is both the display and the body face. Display weight is **400**
(Regular) — there is no Light in the canonical frames — and line-height is
**1.2** nearly everywhere. This package does not load the font; the app does,
exposing the family as `--font-figtree`.

Figma specifies a **fixed px ramp at each frame width**. Every clamp is
**solved** to hit the 402 frame's value at 402 and the 1440 frame's at 1440 —
both ends are read values (ADR 0006).

| Utility             | 402    | 1440   | Tracking  | Role                                               |
| ------------------- | ------ | ------ | --------- | -------------------------------------------------- |
| `text-hero`         | `36px` | `64px` | 0         | Home hero headline; the partners statement         |
| `text-quote`        | `30px` | `48px` | 0         | The pull quote (desktop dropped 64 → 48, 2026-08)  |
| `text-cta`          | `36px` | `64px` | -1px      | The CTA band headline — rides the hero variable    |
| `text-display-xl`   | `40px` | `48px` | 0         | **Every** section headline; the Work hero          |
| `text-display-lg`   | `18px` | `36px` | 0         | Pull-quote attribution, rail numerals              |
| `text-display-md`   | `22px` | `28px` | -0.0286em | Case-study problem statement ⚠️ floor interpolated |
| `text-lead`         | `20px` | `24px` | 0         | Standfirst beside a headline; CTA subhead          |
| `text-body`         | `16px` | `20px` | 0, lh 1.6 | Long-form prose — every `bodyText` field           |
| `text-body-heading` | `40px` | `36px` | 0         | An h2 inside a body ⚠️ descends — both ends read   |
| `text-button`       | `18px` | `18px` | 0, wt 500 | Every button label                                 |
| `text-eyebrow-lg`   | `18px` | `18px` | 0.1em     | Section kicker ("OUR PARTNERS")                    |
| `text-eyebrow`      | `16px` | `16px` | 0.1em     | Card kicker ("HEALTHCARE"), Work hero kicker       |
| `text-nav`          | `14px` | `14px` | 0         | Footer navigation links                            |
| `text-meta`         | `13px` | `13px` | 0.1em     | Insights-card meta row                             |
| `text-legal`        | `12px` | `12px` | 0         | Footer legal row                                   |

**Small UI text does not scale** — button, eyebrow, meta, nav and legal are
identical at both widths, read rather than assumed. Only display type and
rhythm interpolate. `display-md` is the one floor with no 402 example to read,
so it is interpolated from the ramp and says so in the file.

The 2026-08 Figma token pass bound the display ramp to variables with a
desktop and a mobile mode, landing exactly on ADR 0006's two endpoint widths.
It also moved three steps: the desktop quote dropped from 64 to 48
(display-xl's ceiling, but the un-migrated 402 node keeps the 30 floor), the
60px CTA step was retired for the hero's 36 → 64 with -1px tracking (the
shared CTA component on seven frames), and `lead` now shares one variable
pair with `display-sm` (24/34 desktop, 20/26 mobile) — display line heights
are read px pairs now, not a flat 1.2. Details on each token.

`body-heading` is the one step whose clamp **descends**: the Insights frames
read 40px at 402 and 36px at 1440, and solving the clamp to both ends the way
ADR 0006 requires means shrinking 4px across the range. The alternatives
(`display-lg`'s 18px floor; a step at `lg`) both looked worse than a ramp
nobody can see — the full reasoning is on the token.

There is **no distinct hero step**: the Home hero is photographic with no live
text, and the Work hero headline is 48px — the same step as every section
headline.

The `eyebrow` and `eyebrow-lg` utility classes bundle the full kicker style
**including** `text-transform: uppercase` (no theme namespace). The canonical
color is neutral `text-fg-muted`, **not** brand red — the red eyebrow was a
prototype convention. Flipping the `Eyebrow` component's default tone is #38.

## Layout

Section rhythm is **not one value** — the frames hand-tune each band from a
three-step scale, and top and bottom often differ (`96px 96px 128px`,
`128px 96px 192px`). This package ships the steps; teaching `SectionShell` to
take a per-band rhythm is #41.

| Token                 | 402     | 1440                 | Utility         | Role                             |
| --------------------- | ------- | -------------------- | --------------- | -------------------------------- |
| `--spacing-gutter`    | `20px`  | `96px`               | `px-gutter`     | Horizontal padding on every band |
| `--spacing-band-sm`   | `96px`  | `96px`               | `py-band-sm`    | The rhythm steps the frames use  |
| `--spacing-band-md`   | `128px` | `128px`              | `py-band-md`    | (`Layout/Layout 128`)            |
| `--spacing-band-lg`   | `128px` | `192px`              | `py-band-lg`    | The only step that compresses    |
| `--spacing-section-y` | `96px`  | `192px`              | `py-section-y`  | Default for a band with no frame |
| `--container-section` | —       | `78rem` (1248px)     | `max-w-section` | 1440 less two 96px gutters       |
| `--container-content` | —       | `64.625rem` (1034px) | `max-w-content` | Centered statements              |

## Radii

The canonical design is **square**. The tokens stay so a future decision is one
edit here rather than a 25-call-site sweep.

| Token           | Value | Utility        |
| --------------- | ----- | -------------- |
| `--radius-btn`  | `0`   | `rounded-btn`  |
| `--radius-card` | `0`   | `rounded-card` |

(The pill NavBar is `border-radius: 900px` — that's `rounded-full`, no token.)

## Motion

| Token                    | Value                             | Role                                                                                            |
| ------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `--ease-out`             | `cubic-bezier(0.2, 0.7, 0.2, 1)`  | The house curve: hovers + scroll reveals. Deliberately overrides Tailwind's built-in `ease-out` |
| `--ease-mask`            | `cubic-bezier(0.16, 0.9, 0.2, 1)` | Hero headline line-mask reveal                                                                  |
| `--duration-hover`       | `220ms`                           | Hover transitions                                                                               |
| `--duration-reveal`      | `700ms`                           | Standard scroll-reveal                                                                          |
| `--duration-reveal-slow` | `850ms`                           | Hero fade-ups, intro overlay slide                                                              |

Durations are plain custom properties (Tailwind v4 has no `--duration-*`
namespace): use `duration-(--duration-hover)` in class lists or
`var(--duration-reveal)` in CSS.

**Motion is the one concern Figma cannot supply** — the frames are static, and
the orbital vocabulary lives in `prototype/`. What carries it once the
prototype retires is open on map #33.

## Gradients

**Load-bearing, not decoration.** The red is a gradient nearly everywhere it
appears, light bands wash rather than sit flat, and the 64px statements are
filled with a fade rather than a solid. Tailwind v4 has no `--gradient-*`
namespace, so these are plain custom properties.

| Token                            | Utility         | Role                                                           |
| -------------------------------- | --------------- | -------------------------------------------------------------- |
| `--gradient-statement`           | `text-gradient` | Background-clipped onto the 64px statement headlines           |
| `--gradient-card-scrim`          | —               | Horizontal scrim over case-study card photography              |
| `--gradient-card-veil`           | —               | Vertical scrim on the insights cards                           |
| `--gradient-brand-glow`          | `bg-brand-glow` | Figma `Gradient/Red/1` — two stacked radials; the red at scale |
| `--gradient-surface-wash`        | —               | Light bands washing white → bone instead of sitting flat       |
| `--gradient-surface-wash-angled` | —               | The 188° variant behind the case-study card stack              |
| `--gradient-surface-wash-warm`   | —               | The all-warm wash, `bone-soft` → `bone` (partners, Sanity)     |
| `--gradient-ink-fade`            | —               | The bleed strip fading the CTA band into the black footer      |

```jsx
<div className="bg-(image:--gradient-card-scrim)" />
<h2 className="text-gradient">The best partnerships…</h2>
<div className="bg-brand-glow" />
```

## Base behaviour

Importing the theme also applies two document-level rules: smooth in-page
scrolling (gated on `prefers-reduced-motion`) and brand-red `::selection`.

## Verifying refactors

```sh
pnpm --filter @o3/tailwind-config tokens:dump > before.css
# …refactor…
pnpm --filter @o3/tailwind-config tokens:dump > after.css
diff before.css after.css
```

`scripts/dump-compiled.mjs` compiles the theme the way an app does and emits
one representative utility per token, so a dropped `@import` or broken
`@theme` block shows up as a diff instead of a visual regression.

# @o3/tailwind-config

The O3 design tokens — a CSS-first Tailwind v4 theme. Every app and package in
the monorepo imports one file:

```css
@import '@o3/tailwind-config/theme.css';
```

`theme.css` is an index; each concern lives in its own file under `tokens/`.
Every value is extracted from the redesign prototype
(`prototype/O3 Homepage v2.dc.html`, cross-checked against `O3 Work.dc.html`
and `O3 Case Study.dc.html`) — each token's comment names the prototype
section it came from.

## The three-surface system

The site is a stack of full-bleed bands on three surfaces. Text roles are
per-surface — never mix a light-surface text token onto a dark band:

| Surface   | Background                                               | Headings     | Body            | Support                 | Brand accent      |
| --------- | -------------------------------------------------------- | ------------ | --------------- | ----------------------- | ----------------- |
| **white** | `bg-white` `#FFFFFF`                                     | `text-fg`    | `text-fg-muted` | `text-fg-subtle`        | `text-brand`      |
| **bone**  | `bg-bone` `#EFEEEC`                                      | `text-fg`    | `text-fg-muted` | `text-fg-subtle`        | `text-brand`      |
| **ink**   | `bg-ink` `#030303` (hero/cards: `bg-ink-soft` `#0A0A0B`) | `text-white` | `text-white`    | `text-fg-inverse-muted` | `text-brand-tint` |

## Colors (`--color-*`)

| Token              | Value     | Role                                                               |
| ------------------ | --------- | ------------------------------------------------------------------ |
| `brand`            | `#EB1000` | The O3 red: CTAs, eyebrows, rail ticks, selection (light surfaces) |
| `brand-tint`       | `#FF6A5A` | Brand red on dark surfaces (work-case eyebrows and links)          |
| `ink`              | `#030303` | Primary dark surface; default link ink on light surfaces           |
| `ink-soft`         | `#0A0A0B` | Lifted dark surface: hero bg, work-case card bg                    |
| `bone`             | `#EFEEEC` | Warm light surface: partners, quote, insights                      |
| `white`            | `#FFFFFF` | Plain light surface; card bg on bone                               |
| `fg`               | `#232323` | Body + heading ink on light surfaces                               |
| `fg-muted`         | `#6E6E6E` | Supporting copy on light surfaces                                  |
| `fg-subtle`        | `#9A9A98` | Tertiary copy / meta rows on light surfaces                        |
| `fg-inverse-muted` | `#A4A4A4` | Muted copy on dark surfaces                                        |
| `line`             | `#DDDDDB` | Rules + image placeholders on light surfaces                       |
| `line-soft`        | `#ECECEA` | Hairlines inside white cards                                       |

Utilities: `bg-bone`, `text-brand`, `border-line`, etc.

## Typography

**Figtree** is both the display and the body face; the display voice comes
from weight 300, size, and negative tracking. This package does **not** load
the font — the app does. The prototype uses Google Fonts:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&display=swap"
  rel="stylesheet"
/>
```

A Next.js app should use `next/font/google` and expose the family as
`--font-figtree`; the `--font-sans` / `--font-display` stacks read that
variable first and fall back to the plain `Figtree` family name.

Fluid display steps (each bundles line-height, tracking, and weight 300):

| Utility           | Size                           | Line-height | Tracking           | Prototype source        |
| ----------------- | ------------------------------ | ----------- | ------------------ | ----------------------- |
| `text-hero`       | `clamp(2.6rem, 4.6vw, 4.8rem)` | 1.12        | -0.02em            | Homepage h1             |
| `text-display-xl` | `clamp(38px, 5vw, 72px)`       | 1.05        | -0.02em            | Section headlines       |
| `text-display-lg` | `clamp(30px, 3.4vw, 48px)`     | 1.1         | -0.015em           | Engagement-model h3s    |
| `text-display-md` | `clamp(24px, 2.6vw, 36px)`     | 1.3         | -0.01em            | Work-case narrative h3s |
| `text-eyebrow`    | `12px`                         | 1.2         | 0.14em, weight 700 | Uppercase kickers       |

The `eyebrow` utility class bundles the full eyebrow style **including**
`text-transform: uppercase` (which has no theme namespace). Pair it with
`text-brand` on light surfaces or `text-brand-tint` on dark ones.

## Layout

| Token                 | Value                       | Utility         | Role                                   |
| --------------------- | --------------------------- | --------------- | -------------------------------------- |
| `--spacing-section-y` | `clamp(120px, 14vw, 200px)` | `py-section-y`  | Vertical padding of every section band |
| `--container-content` | `68.75rem` (1100px)         | `max-w-content` | Centered statements: hero copy, quote  |
| `--container-section` | `77.5rem` (1240px)          | `max-w-section` | Standard section shell                 |

## Radii

| Token           | Value  | Utility        | Role                      |
| --------------- | ------ | -------------- | ------------------------- |
| `--radius-btn`  | `6px`  | `rounded-btn`  | Buttons, logo-mark corner |
| `--radius-card` | `16px` | `rounded-card` | Work-case + insight cards |

(The pill nav is `rounded-full` — no token needed.)

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

## Base behaviour

Importing the theme also applies two document-level rules from the prototype:
smooth in-page scrolling (gated on `prefers-reduced-motion`) and brand-red
`::selection`.

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

## Building with O3Ui

O3 is a **Tailwind v4 utility-class system**. Components carry their own styling;
write your layout glue in the same vocabulary. No provider or theme wrapper is
needed — link `styles.css`, load the bundle, and components render correctly.

### The one rule that will bite you: there is no Tailwind compiler here

`_ds_bundle.css` is _compiled_ output. A utility class exists **only if some O3
component or story already used it**. `bg-ink`, `text-display-xl` and `px-gutter`
resolve; a plausible-looking class nobody used — `py-section-y`, `gap-band-lg`,
`border-on-ink-line` — resolves to **nothing**, silently.

So: use the vocabulary below, and for anything outside it reach for the token
directly. Every token is a real custom property on `:root`:

```jsx
<div style={{ paddingBlock: 'var(--spacing-band-lg)', borderColor: 'var(--color-on-ink-line)' }}>
```

Standard Tailwind utilities (`flex`, `gap-7`, `max-w-[520px]`, `text-center`) are
present for the values the kit already uses. Never invent a token or class name.

### Surfaces are the core idea

Five neutrals, three of them surfaces. A band picks one; the text roles follow it.

| Surface | Class                                        | Copy on it                                               |
| ------- | -------------------------------------------- | -------------------------------------------------------- |
| white   | `bg-white`                                   | `text-fg`, `text-fg-muted`, `text-fg-body`               |
| bone    | `bg-bone`                                    | `text-fg`, `text-fg-muted`                               |
| ink     | `bg-ink` (also `bg-ink-warm`, `bg-ink-deep`) | `text-on-ink`, `text-on-ink-muted`, `text-on-ink-subtle` |

**Copy on dark is white at an alpha, never a solid grey** — it has to composite
over the photography behind it. Prefer `SectionShell` over hand-rolling a band:
it owns the surface, the measure and the vertical rhythm, and publishes the
surface to its children (`useSurface`). `bg-black` / `text-on-utility` are the
chrome bands (utility nav, footer), not in-page surfaces.

### The vocabulary

- **Color** — `bg-{white,bone,ink,ink-warm,ink-deep,black,utility,scrim}` ·
  `text-{fg,fg-muted,fg-body,fg-quiet,on-ink,on-ink-muted,on-ink-subtle,on-utility,brand,white}` ·
  `border-line`
- **Type ramp** — `text-{hero,quote,cta,display-xl,display-lg,display-md,display-sm,lead,body,body-heading,button,meta,nav,legal}`.
  Each carries its own size, leading, tracking and weight. Sizes are fluid
  `clamp()`s solved between the 402 and 1440 frames, so **don't add responsive
  variants** — composition switches at `lg`, size interpolates on its own.
  `display-xl` is the workhorse section headline; `body` is the only step set for
  reading in paragraphs (1.6 leading).
- **Eyebrows** — `eyebrow` / `eyebrow-lg` (uppercase + tracking baked in). Colour
  is the call site's job: `text-fg-muted` on light, plain white on dark.
  **The default eyebrow is neutral grey, not brand red.**
- **Layout** — `max-w-{section,content,article}` · `px-gutter` ·
  `py-{band-lg,band-md,band-sm}`
- **Radius** — `rounded-btn`, `rounded-card` (the design is nearly square-cornered)
- **Gradient** — `text-gradient`, `bg-brand-glow`

**Red is a gradient, not a flat fill.** `--color-brand` (#EB1000) appears flat in
exactly one place in the whole design. Reach for `bg-brand-glow` / `text-gradient`;
a flat red area is almost always wrong.

### Where the truth is

`styles.css` and its import closure — `tokens/theme.css` → `tokens/tokens/*.css`
(color, typography, layout, radius, motion, gradient) — carry every token with a
comment saying what it is for and which frame it came from. Read those before
styling. Per component: `components/<group>/<Name>/<Name>.prompt.md` and `.d.ts`.

### A typical build

```jsx
const { SectionShell, Eyebrow, DisplayHeading, Button, ArrowIcon } = window.O3Ui

;<SectionShell surface="ink">
  <div className="flex flex-col items-start gap-7">
    <Eyebrow tone="inverse">Our Partners</Eyebrow>
    <DisplayHeading level="xl">
      We work with B2B and enterprise teams to reimagine experiences.
    </DisplayHeading>
    <p className="text-lead text-on-ink-subtle max-w-[520px]">
      Strategy, design, engineering and AI under one roof.
    </p>
    <Button variant="light" icon={<ArrowIcon />}>
      View our work
    </Button>
  </div>
</SectionShell>
```

`Button` takes `variant="dark|light|ghost"` — `light` is the one for ink bands —
and fills its icon slot from the parent (`ArrowIcon`, `ExternalLinkIcon`,
`ChevronDownIcon`).

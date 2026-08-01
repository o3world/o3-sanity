# 0008. shadcn is a source pattern, not a theme

- **Status:** Accepted
- **Date:** 2026-08-01
- **Deciders:** NickO3 + Claude
- **Related:** [issue #36](https://github.com/o3world/o3-sanity/issues/36), [issue #33](https://github.com/o3world/o3-sanity/issues/33), [issue #38](https://github.com/o3world/o3-sanity/issues/38), [ADR 0001](./0001-component-routing-port.md)

## Context

#36 framed this as a greenfield decision: "shadcn is copy-in source, not a
dependency — so 'adding' it is a set of conventions, not an install."

That framing is out of date. shadcn is **already substantially adopted**, and
was never written down:

| On disk today                                                            | What it settles                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------- |
| `packages/ui/components.json`                                            | The CLI is configured, aliases and all            |
| `packages/ui/src/components/ui/{button,card}.tsx`                        | Where shadcn-derived components live              |
| `packages/ui/src/lib/utils.ts` → `cn()`                                  | The class-merge utility, with a project extension |
| `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge` in deps | The primitive and variant libraries               |
| `cva` + a `*Variants` export on all 11 components                        | The variant convention                            |

So four of the ticket's six questions already have de-facto answers. The job is
to ratify them, correct the two places where the config contradicts the code,
and settle the one question that is genuinely open: **theming**.

That one matters because the seam is broken in a way nothing catches.
`components.json` declares `cssVariables: true`, which tells the CLI to
generate components against `--background`, `--foreground`, `--primary`,
`--muted-foreground`, `--border`, `--ring`. **`@o3/tailwind-config` defines none
of them.** Tailwind emits nothing for a class whose token does not exist, so
`npx shadcn add dialog` today produces a component that renders **unstyled** —
which reads as a CSS bug rather than a skipped step.

## Decision

### 1. shadcn's anatomy, O3's tokens

Take the **anatomy** — a Radix primitive, `cva`, `asChild` via `Slot`, `cn`,
the `forwardRef`-free prop shape. Reject the **palette** entirely.

This is not a preference, it is structural. shadcn assumes **one**
background/foreground pair per theme, swapped wholesale for dark mode. This
site puts **three surfaces on one page at once** — `white | bone | ink`, chosen
per section block and injected by `defineSectionBlock` — with text roles that
differ per surface (`text-fg` on light, `text-white` and the `on-ink-*` alphas
on dark). A single `--foreground` cannot simultaneously mean "#232323 on bone"
and "white at 92% on ink" in one document.

Mapping shadcn's variables onto ours would mean re-scoping the whole set per
surface (`[data-surface='ink'] { --foreground: … }`) — possible, but it buys
nothing: every generated component is hand-translated anyway, and the
indirection would hide which O3 token a component actually uses.

**Every component the CLI generates is a draft.** Translating it to O3 tokens
is a required step, not a tidy-up.

### 2. `cssVariables` stays `true` — so that failure is loud

Counter-intuitive, and the reason is the guard. With `cssVariables: true` the
CLI emits `bg-background`, which does not exist here and is caught by
`shadcn-seam.test.ts`. With `false` it emits `bg-neutral-900`, which renders a
**plausible dark grey** that no test would question and a reviewer would
probably accept.

An invisible failure caught at commit beats a visible-but-plausible one that
ships. The test guards both routes: shadcn token names, and numbered Tailwind
palette classes.

### 3. Where it lives

Unchanged, now stated:

- `packages/ui/src/components/ui/` — shadcn-derived. Storybook consumes
  `packages/ui`, which is why it lives here and not in `apps/web`.
- `packages/ui/src/components/` — bespoke O3 primitives, kebab-case files.

**A component earns a place in `ui/` only when shadcn supplies real behaviour** —
focus management, portals, ARIA wiring, keyboard interaction. shadcn adds
nothing to a `<p>` with an uppercase class, so `Eyebrow` stays bespoke. The
folder is a statement about where the behaviour came from, not a quality tier.

### 4. What happens to the existing components

Nothing, mostly. Of the eleven:

| Component                                                                                          | Fate                                                                            |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `Button`, `Card`                                                                                   | Already in `ui/`; stay. Their **variants** need realigning to Figma (#38)       |
| `SectionShell`                                                                                     | Bespoke and stays — the three-surface organism is the thing shadcn cannot model |
| `ArrowLink`, `ArrowIcon`, `LogoTile`, `Stat`, `Eyebrow`, `DisplayHeading`, `MaskedLines`, `Reveal` | Bespoke, no shadcn equivalent. Left alone                                       |

Nothing is deleted and nothing is rebuilt on a shadcn primitive as part of this
ADR. A rewrite would be churn against components that already match the tokens.

### 5. A Figma variant axis maps 1:1 onto a `cva` variant

This is the rule #38's component map depends on, so it is stated precisely:

- **One Figma variant axis → one key in `cva`'s `variants`.** `Button / Solid`
  is Size×State, so `variants: { size: …, state: … }`. `Brand / Logo` is
  Color, so `variants: { color: … }`.
- **The Figma variant value is the cva value**, lowercased and kebabed:
  `Size=Base` → `size: { base: … }`.
- **`defaultVariants` must equal Figma's Default variant.** Where they disagree
  today, Figma wins (#33).
- **A variant that exists only in code needs a comment saying why.** The `ghost`
  button variant is one — the prototype had no such thing.

The immediate consequence: `Button`'s current axes (`brand | inverse | ghost`,
`sm | default | lg`) do **not** match Figma's (`Size=Base|Large`, fills dark and
light, and no red button anywhere on the canonical Home frame). Realigning it
is #38, flagged in ADR 0007's sibling drift table and in `foundations/button.stories.tsx`.

### 6. Which components, and how they arrive

**On demand, per page-layer ticket. Never `--all`.** The frames call for
`sheet` (the 402 nav — ADR 0006), `navigation-menu` (the 1440 pill),
`carousel` (the perspectives row), and probably `accordion` and `tabs` for
Solutions. Adding the registry wholesale would fill `ui/` with untranslated
drafts the guard would then block.

The CLI is used to **fetch anatomy**, not as a source of truth:

```bash
npx shadcn@latest view <component>   # read it before deciding
npx shadcn@latest add <component>    # then translate it to O3 tokens
```

`style` is corrected from `default` to `new-york`, which is what the code
already does — `button.tsx` imports the unified `radix-ui` package, the
new-york convention.

## Alternatives considered

### Map shadcn's variables onto the surface system

- **Pros:** generated components would work untouched; the CLI stays useful at full strength.
- **Cons:** needs the whole variable set re-scoped per surface, and a reader of a component can no longer tell which O3 token it resolves to. It also inverts authority — the design would be described in shadcn's vocabulary rather than Figma's.
- **Why not:** it optimises for not editing generated code, which we have to read and adjust anyway.

### Adopt shadcn's variables _alongside_ the O3 ones

- **Pros:** no translation step; both vocabularies available.
- **Cons:** two names for the same colour, and no rule for which to reach for. That is precisely the drift CONTEXT.md's "one word per concept" exists to prevent.
- **Why not:** a design system with two palettes has none.

### Publish O3's components as a custom shadcn registry

- **Pros:** `registry:base` could carry components, tokens and config as one installable payload; genuinely useful across projects.
- **Cons:** infrastructure for a reuse case that does not exist — this is one site.
- **Why not:** Speculative. Worth revisiting only if a second O3 property appears.

### Put shadcn in `apps/web` instead

- **Pros:** components live next to their only consumer.
- **Cons:** Storybook consumes `packages/ui`, so every component would be invisible to the story layer — which is this repo's test layer for presentational code (ADR 0004).
- **Why not:** it would cost the tests.

## Consequences

- **The translation step is enforced, not documented.**
  `packages/ui/src/components/ui/shadcn-seam.test.ts` fails on any shadcn theme
  token or numbered Tailwind palette class in `ui/`. Comments are exempt, so an
  ADR reference or an explanatory note is fine.
- `cn()`'s font-size registration is now covered by `utils.test.ts`, which
  derives the truth from `typography.css`. It had gone stale: #37 added seven
  type steps and the list kept its original five, so `cn('text-lead',
'text-fg-muted')` silently dropped the size. That is exactly the failure the
  old "keep this list in sync" comment invited.
- `components.json` `style` becomes `new-york`, matching the unified `radix-ui`
  imports already in the code.
- **#38 is unblocked** and inherits a stated rule for expressing a Figma variant
  axis in code, which is what makes its component map mechanical.
- `Button` is known-divergent from its Figma component set. That is #38's first
  job, not a defect introduced here.
  - **Corrected by #38:** the realignment is not component-local. `variant` is
    also a schema enum (`cta.variant`) stored in committed seed JSON, so the
    change spans the content model, the seed corpus, the renderer and typegen.
    It moves to #42 / #41 — see [`docs/figma-components.md`](../figma-components.md).

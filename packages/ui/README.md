# @o3/ui

Shared components. Storybook consumes this package, so anything presentational
lives here rather than in `apps/web` — a story is this repo's test layer for
presentational code (ADR 0004).

```tsx
import { Button, SectionShell, Eyebrow, cn } from '@o3/ui'
```

## Two folders, one distinction

| Folder               | Holds                                         |
| -------------------- | --------------------------------------------- |
| `src/components/ui/` | shadcn-derived — a Radix primitive underneath |
| `src/components/`    | Bespoke O3 primitives, kebab-case files       |

A component earns a place in `ui/` only when shadcn supplies real **behaviour**:
focus management, portals, ARIA wiring, keyboard interaction. shadcn adds
nothing to a `<p>` with an uppercase class, so `Eyebrow` is bespoke. The folder
records where the behaviour came from — it is not a quality tier.

## Adding a shadcn component

**shadcn's anatomy, O3's tokens** (ADR 0008). The generated file is a _draft_.

```bash
npx shadcn@latest view <component>    # read it first
npx shadcn@latest add <component>     # lands in src/components/ui/
```

Then translate it before committing:

1. Replace every shadcn theme class — `bg-background`, `text-muted-foreground`,
   `border-input`, `ring-ring` — with an O3 token. **None of them exist in
   `@o3/tailwind-config`**, and Tailwind emits nothing for a class whose token
   is missing, so an untranslated component renders unstyled rather than
   erroring.
2. Align its `cva` variants to the Figma component set: one Figma variant axis
   → one `variants` key, Figma's value name as the cva value, and
   `defaultVariants` equal to Figma's Default.
3. Add a story. A component with a story needs no test file — the story is the
   test (AGENTS.md).

`shadcn-seam.test.ts` fails the build if step 1 is skipped, and also rejects
numbered Tailwind palette classes (`bg-neutral-900`) — the O3 palette is
semantic. Comments are exempt.

Components are added **on demand, per ticket. Never `--all`** — the registry
would arrive as untranslated drafts the guard then blocks.

## `cn()`

`clsx` + `tailwind-merge`, with one project extension: Tailwind v4 keeps our
type scale in CSS, and tailwind-merge ships a fixed table that knows nothing
about it. An unrecognised `text-…` falls into the **colour** conflict group, so
`cn('text-hero', 'text-brand')` would silently drop the size.

`FONT_SIZE_UTILITIES` in `src/lib/utils.ts` registers every step. It is
hand-maintained — `cn` runs in the browser and cannot read CSS — so
`utils.test.ts` derives the real list from `tokens/typography.css` and fails on
drift. Add a type step to the theme, add it there too; the test will tell you.

## Tokens

Every colour, size and spacing value comes from `@o3/tailwind-config`, which is
read off the canonical Figma frames. Never pick a value by eye — see that
package's README for the rule on what earns a token.

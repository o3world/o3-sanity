import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PrototypeFrame, prototypeParameters } from './frame'

/**
 * **The question this answers:** what does the 402 nav open into — how much
 * screen does the panel take, how loud is its surface, and how big does the
 * nav copy get?
 *
 * `1814:1636` is the closed hamburger and **no frame in the file draws the
 * panel behind it** (ADR 0006 → Consequences). This set proposes three, on one
 * page, switchable from a floating bar or with the arrow keys:
 *
 * - **A · Takeover** — full-bleed `ink-deep` below the bar, five items at
 *   `--text-display-xl` (40px at 402) and nothing else.
 * - **B · Drop panel** — hugs five 56px rows under the bar, hero still visible,
 *   items at `--text-button` (18px, identical to the 1440 pill).
 * - **C · Ledger** — full-bleed on `--gradient-brand-glow`, numbered ruled rows
 *   at `--text-hero` (30px at 402) with the route shown.
 *
 * All three keep the bar exactly where `1814:1630` puts it, so "Let's talk" is
 * never duplicated or relocated; all three turn the control into the close in
 * place, with `aria-label` / `aria-expanded` / `aria-controls` (ADR 0009's one
 * icon-only exception); all three collapse their entrance entirely under
 * `prefers-reduced-motion`. Every value is traced in a provenance table at the
 * foot of the page — check it against `packages/tailwind-config`, never the
 * other way round.
 *
 * **What decides it:** the design owner picking a variant (or parts of
 * several), plus #51's fourth acceptance criterion — whether this becomes a
 * Figma frame or code becomes the source of record for this one component.
 *
 * **What supersedes it:** a Figma frame. Figma is the design source of record
 * (AGENTS.md → Design source of record, map #33); if a frame lands and
 * disagrees, this page is stale and the frame wins. It is **not** superseded by
 * the implementation — when #51's decision lands in `packages/ui`, this page
 * stays as the record of how the component got its shape.
 *
 * **Sibling capture:** `Prototypes/Mobile menu — open state (Aug 2026)` argues
 * the same gap and takes the opposite side on one point — it pins a second
 * "Let's talk" into the thumb arc. The two are deliberately left bracketing
 * that question.
 */
const meta = {
  title: 'Prototypes/Mobile menu — three open states (Aug 2026)',
  component: PrototypeFrame,
  parameters: prototypeParameters,
} satisfies Meta<typeof PrototypeFrame>

export default meta
type Story = StoryObj<typeof meta>

const set = '2026-08-mobile-menu-variants'
const captured = 'August 2026'

/** Lands on A; the in-page switcher and ← / → reach the other two. */
export const AllThree: Story = {
  args: {
    set,
    page: 'index.html',
    label: 'Mobile menu — three open states (#51)',
    captured,
  },
}

export const ATakeover: Story = {
  args: {
    set,
    page: 'index.html?variant=a',
    label: 'A · Takeover — full-bleed ink-deep, 40px items',
    captured,
  },
}

export const BDropPanel: Story = {
  args: {
    set,
    page: 'index.html?variant=b',
    label: 'B · Drop panel — hugs the bar, 18px rows',
    captured,
  },
}

export const CLedger: Story = {
  args: {
    set,
    page: 'index.html?variant=c',
    label: 'C · Ledger — Gradient/Red/1, numbered rows',
    captured,
  },
}

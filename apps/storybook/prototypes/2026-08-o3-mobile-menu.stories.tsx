import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PrototypeFrame, prototypeParameters } from './frame'

/**
 * **The question this answers:** what does the 402 nav open into?
 *
 * Every canonical page layer has a 1440 and a 402 frame, and the 402 NavBar
 * collapses to a logo and a 42×42 `Open menu` control (`1814:1636`) — but no
 * frame in the Figma file draws the panel behind it. Not on Home mobile, not
 * on Local Components. The prototype proposes one, with the closed bar rebuilt
 * from `1814:1630` beside it for comparison, and every value traced back to a
 * token or a frame node in a table so a reviewer can check it rather than
 * trust it.
 *
 * Open state on the right is interactive: the control toggles, Escape closes,
 * and the staggered rise collapses under `prefers-reduced-motion`.
 *
 * **This is a proposal, not a decision.** It fills a gap Figma leaves rather
 * than reading something Figma already says, and it stays a snapshot even if
 * #51 accepts it — the implementation lands in `packages/ui`, and this page
 * keeps the argument that got it there. Figma remains the source of record
 * (AGENTS.md → Design source of record, map #33).
 */
const meta = {
  title: 'Prototypes/Mobile menu — open state (Aug 2026)',
  component: PrototypeFrame,
  parameters: prototypeParameters,
} satisfies Meta<typeof PrototypeFrame>

export default meta
type Story = StoryObj<typeof meta>

export const Proposal: Story = {
  args: {
    set: '2026-08-o3-mobile-menu',
    page: 'index.html',
    label: 'Mobile menu — open-state proposal (#51)',
    captured: 'August 2026',
  },
}

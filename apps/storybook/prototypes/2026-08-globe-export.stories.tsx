import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PrototypeFrame, prototypeParameters } from './frame'

/**
 * **The official globe exports** — the red one at hero settings and the neutral
 * grey one that names itself the background globe. Two self-contained pages,
 * no build step, all tuning in a `CONFIG` object at the top of each `globe.js`.
 *
 * **This capture is the source of record for the globe** — the one recorded
 * exception to the rule the strip above states, because the design file only
 * ever carried this globe as a flattened raster. The exception itself is
 * written down where the rules live (`AGENTS.md` → Captured prototypes, and
 * this directory's README), not here; a story docblock is not a place a rule
 * can be found from.
 *
 * **What the pages carry that the ported component does not.** They ship at
 * `scale: 1` and full opacity so they read as complete assets. The site's own
 * treatment differs and is recorded in `EXPORT-README.md` beside them: the hero
 * blows its copy up to 2.5×, and the background globe runs at **0.15 opacity**.
 * The port absorbs the first into each call site's width ratio and the second
 * into the `background` preset. Read the README before changing either.
 *
 * **What supersedes it:** a newer export. Not a frame, and not the
 * implementation — when the values here are re-tuned, the new export lands
 * beside this one and the component follows it.
 */
const meta = {
  title: 'Prototypes/Globe — official exports (Aug 2026)',
  component: PrototypeFrame,
  parameters: prototypeParameters,
} satisfies Meta<typeof PrototypeFrame>

export default meta
type Story = StoryObj<typeof meta>

const set = '2026-08-globe-export'
const captured = 'August 2026'

/** Both globes side by side, which is the comparison worth having — they are
 *  byte-identical apart from their colour block. */
export const BothGlobes: Story = {
  args: {
    set,
    page: 'index.html',
    label: 'Globe — red and grey exports',
    captured,
  },
}

/** The hero globe: red, glow 1.4. */
export const Red: Story = {
  args: { set, page: 'globe-red/index.html', label: 'Globe — red (hero settings)', captured },
}

/** The background globe: neutral, glow 0.6. The site runs this one at 0.15 opacity. */
export const Grey: Story = {
  args: {
    set,
    page: 'globe-grey/index.html',
    label: 'Globe — grey (background settings)',
    captured,
  },
}

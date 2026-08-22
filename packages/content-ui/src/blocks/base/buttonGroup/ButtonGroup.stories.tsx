import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ButtonGroup } from './ButtonGroup'

/**
 * A row of buttons an editor places in a `layoutSection` column — the group
 * that makes a quick-jump nav something authored rather than shipped (#149).
 *
 * What these stories carry, since the group has one design option and adds
 * nothing else:
 *
 * - **the quick-jump row, end to end.** Buttons on the `anchor` arm, pointing
 *   at names editors gave the bands further down the page. Each renders a link
 *   to `#…` — the whole feature, from the field to the href.
 * - **the one knob**, at each of its three values. Alignment is the only thing
 *   the group decides; everything else in the row comes from the buttons.
 * - **the row wraps.** Seven labels at 402 is the case the design has to
 *   survive, and a wrap is the answer rather than a scroll region (ADR 0006).
 * - **mixed destinations.** The group has no opinion about where its members
 *   go: an anchor, a route and an off-site URL sit in one row, and each button
 *   still picks its own element.
 */
const meta = {
  component: ButtonGroup,
  title: 'Content/Blocks/Base/ButtonGroup',
} satisfies Meta<typeof ButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The jump-link arm, spelled the way an editor authors it — no target, no URL.
 *
 * No fill either: how a button is drawn is the button's own declaration, read
 * at every placement, and `Button.stories.tsx` already covers every value of
 * it. A group that set one here would be documenting a decision it does not
 * make.
 */
const jump = (key: string, label: string, anchor: string) => ({
  _key: key,
  _type: 'button' as const,
  label,
  anchor,
  target: null,
})

const QUICK_JUMP = [
  jump('a', 'How we work', 'how-we-work'),
  jump('b', 'The team', 'the-team'),
  jump('c', 'Our thinking', 'our-thinking'),
]

/**
 * The row this component exists for. Every button is on the `anchor` arm, so
 * each renders as a link to `#…` and moves the reader down the page they are
 * already on.
 */
export const QuickJumpRow: Story = {
  args: { buttons: QUICK_JUMP, alignment: 'start' },
}

export const Centred: Story = {
  args: { buttons: QUICK_JUMP, alignment: 'center' },
}

export const Right: Story = {
  args: { buttons: QUICK_JUMP, alignment: 'end' },
}

/**
 * Seven labels. The row wraps onto a second line rather than opening a scroll
 * region — a jump row that scrolls hides the links it was built to show.
 */
export const Wraps: Story = {
  args: {
    alignment: 'start',
    buttons: [
      ...QUICK_JUMP,
      jump('d', 'What we build', 'what-we-build'),
      jump('e', 'Where we start', 'where-we-start'),
      jump('f', 'Who we do it with', 'who-we-do-it-with'),
      jump('g', 'What it costs', 'what-it-costs'),
    ],
  },
}

/**
 * The group arranges and decides nothing about its members: an anchor, a route
 * on this site and an off-site URL sit in one row, each button reading its own
 * destination and its own fill.
 */
export const MixedDestinations: Story = {
  args: {
    alignment: 'start',
    buttons: [
      jump('a', 'How we work', 'how-we-work'),
      { _key: 'b', _type: 'button' as const, label: 'Read the case', href: '/work', target: null },
      {
        _key: 'c',
        _type: 'button' as const,
        label: 'Visit O3XO',
        href: 'https://www.o3xo.ai/',
        target: null,
      },
    ],
  },
}

/** An empty group renders nothing rather than an empty row taking up a gap. */
export const NoButtons: Story = {
  args: { buttons: [], alignment: 'start' },
}

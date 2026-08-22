import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { NavPanel } from './NavPanel'
import { caseStudiesGroup, industriesGroup } from './SiteNav.stories'

/**
 * What a dropdown shows when it is open.
 *
 * It is its own component for exactly this: the panel only exists after a
 * pointer enters a trigger, and a story cannot move a pointer. Splitting the
 * open state (`NavRow`) from the contents (here) is what puts the panel's
 * pixels and its axe scan under the host at all.
 *
 * No Figma link, because there is no frame: the kit's `Navigation` is an HTML
 * import of the collapsed bar. Everything drawn here is read off o3xo.ai
 * (ADR 0028, second addendum), and the read is recorded on `NavPanelCard`.
 */
const meta = {
  title: 'Chrome/NavPanel',
  component: NavPanel,
  globals: { brand: 'o3xo', backgrounds: { value: 'ink' } },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof NavPanel>

export default meta
type Story = StoryObj<typeof meta>

/** Cards with no kicker — the section names itself. */
export const Industries: Story = {
  args: { group: industriesGroup },
}

/** Cards with one — a case study is kickered with its industry. */
export const WithEyebrows: Story = {
  args: { group: caseStudiesGroup },
}

/** A group nobody has filled in yet is its closing row and nothing else. */
export const Empty: Story = {
  args: { group: { ...industriesGroup, items: [] } },
}

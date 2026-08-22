import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '../../../testing/seedContent'

import { RoleListSection } from './RoleListSection'

/**
 * The About frame's Careers band (`1925:6061`).
 *
 * #46 asked whether Careers is a section of About or its own route. **The
 * frame answers section**, and this block is that answer — the rows live on
 * the About document, not behind `/careers`.
 *
 * The first row carries no top padding: the header's 65px gap already sets it
 * off, so the hairline is drawn under every row and the top pad is skipped on
 * the first. That is the detail to check in `SingleRole`, where there is
 * nothing else to compare it against.
 */
const meta = {
  title: 'Content/Blocks/Section/RoleListSection',
  component: RoleListSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1925:6061'),
  },
} satisfies Meta<typeof RoleListSection>

export default meta
type Story = StoryObj<typeof meta>

export const AsSeeded: Story = {
  args: seededSectionArgs('about', 'roleListSection'),
}

export const Mobile: Story = {
  args: seededSectionArgs('about', 'roleListSection'),
  globals: { viewport: { value: 'mobile' } },
}

/** One row — the "no top pad on the first" rule, with nothing to hide behind. */
export const SingleRole: Story = {
  args: {
    ...seededSectionArgs('about', 'roleListSection'),
    roles: (seededSectionArgs('about', 'roleListSection').roles ?? []).slice(0, 1),
  },
}

/**
 * No roles at all — hiring freeze. A header over an empty rule stack is the
 * failure mode; the band should either close up or say nothing.
 */
export const NoRoles: Story = {
  args: { ...seededSectionArgs('about', 'roleListSection'), roles: [] },
}

/** A role with no Apply button: the right-hand column must not reserve space. */
export const NoApplyLink: Story = {
  args: {
    ...seededSectionArgs('about', 'roleListSection'),
    roles: (seededSectionArgs('about', 'roleListSection').roles ?? []).map((role, i) =>
      i === 0 ? { ...role, button: null } : role,
    ),
  },
}

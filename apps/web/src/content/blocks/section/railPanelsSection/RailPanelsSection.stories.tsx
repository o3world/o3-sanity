import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '@/stories/seedContent'

import { RailPanelsSection } from './RailPanelsSection'

/**
 * Rail + panels — the Home frame's two matching bands, "The platforms we go
 * deep on" (`1762:2149`) and "Three ways in" (`1762:2168`).
 *
 * The two bands **differ in exactly one thing**: what the rail counts off.
 * That is the `rail` field (`label` | `number`), not a second block type, and
 * the pair of stories below is the argument for that decision — flip between
 * them and everything but the rail is identical.
 *
 * `layout` is the other axis: `rail` is the Home composition, `cards` is the
 * Solutions one (`1925:6113`–`6115`, #47), which composes the non-canonical
 * `Case study cards` set locally rather than adopting it.
 *
 * 82 + 238 + 500 + 33 + 395 = 1248 — the whole band is the standard content
 * column, right-aligned inside it. If it ever stops adding up, that sum is
 * where to start.
 */
const meta = {
  title: 'Content/Blocks/Section/RailPanelsSection',
  component: RailPanelsSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1762:2149'),
  },
} satisfies Meta<typeof RailPanelsSection>

export default meta
type Story = StoryObj<typeof meta>

/** "The platforms we go deep on" — `layout: rail`, rail counts **labels**. */
export const RailByLabel: Story = {
  args: seededSectionArgs('index', 'railPanelsSection', 0),
}

/** "Three ways in" — the same band, rail counting **numbers** off array order. */
export const RailByNumber: Story = {
  args: seededSectionArgs('index', 'railPanelsSection', 1),
  parameters: { design: figmaDesign('1762:2168') },
}

/** The Solutions composition: `layout: cards`, three engagement cards. */
export const Cards: Story = {
  args: seededSectionArgs('solutions', 'railPanelsSection'),
  parameters: { design: figmaDesign('1925:6138') },
}

/**
 * At 402 the mobile frames compose this band differently enough that it is a
 * composition switch rather than a reflow — both layouts, on a phone.
 */
export const RailMobile: Story = {
  args: seededSectionArgs('index', 'railPanelsSection', 0),
  globals: { viewport: { value: 'mobile' } },
}

export const CardsMobile: Story = {
  args: seededSectionArgs('solutions', 'railPanelsSection'),
  globals: { viewport: { value: 'mobile' } },
}

/** Header dropped: the 128px gap between header and body has nothing to space. */
export const NoHeader: Story = {
  args: {
    ...seededSectionArgs('index', 'railPanelsSection', 0),
    heading: undefined,
    intro: undefined,
  },
}

/** A single panel — the rail has one stop, and must still read as a rail. */
export const SinglePanel: Story = {
  args: {
    ...seededSectionArgs('index', 'railPanelsSection', 0),
    panels: (seededSectionArgs('index', 'railPanelsSection', 0).panels ?? []).slice(0, 1),
  },
}

/**
 * `layout: rows` — the partner page's "Three Core Services" (`2334:2170`),
 * #92. The numeral moves out of the sticky rail into an ink circle on the row,
 * and each panel's `details` draw under its body: the breakdowns in ink, the
 * last one — the promise — in brand red.
 */
export const Rows: Story = {
  args: seededSectionArgs('partners-sanity', 'railPanelsSection'),
  parameters: { design: figmaDesign('2334:2170') },
}

/** The rows layout below `lg`: the 394 and 608 columns stack under the numeral. */
export const RowsMobile: Story = {
  args: seededSectionArgs('partners-sanity', 'railPanelsSection'),
  globals: { viewport: { value: 'mobile' } },
}

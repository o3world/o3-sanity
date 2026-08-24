import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seedImage, seededSectionArgs } from '../../../testing/seedContent'

import { RailPanelsSection } from './RailPanelsSection'

/**
 * Rail + panels — an ordered set of parallel things, in five arrangements.
 *
 * `layout` is the axis: `rail` is Home's platforms band (`1762:2149`); `cards`
 * is the Solutions engagement band (`1925:6113`–`6115`, #47); `rows` is the
 * partner page's services (`2749:6863`); `grid` is the software-engineering
 * service page's grid (`2358:2788`, #93); `track` is Home's "How we work"
 * (`2846:5480`, #309).
 *
 * `rail` is the second axis and applies to the rail layout alone — what the
 * rail counts off, each panel's label or its position.
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

/**
 * The same rail counting **numbers** off array order (`1744:1786`) — a reversed
 * ink chip on the active stop, and the numeral inlined into the row at 402.
 *
 * The knob is set here rather than seeded: no page picks this value since Home
 * moved its ways-to-work band to the track (#309), and an option an editor can
 * still turn needs somewhere to be looked at.
 */
export const RailByNumber: Story = {
  args: { ...seededSectionArgs('index', 'railPanelsSection', 0), rail: 'number' },
}

/**
 * `layout: track` — Home's "How we work" (`2846:5480`): the engagements as
 * hairline-separated columns on a rule that scrolls sideways, the ink third of
 * the rule tracking which column is in view.
 */
export const Track: Story = {
  args: seededSectionArgs('index', 'railPanelsSection', 1),
  parameters: { design: figmaDesign('2846:5480') },
}

/** The track at 402 (`2975:8355`) — one column per view, no hairline in sight. */
export const TrackMobile: Story = {
  args: seededSectionArgs('index', 'railPanelsSection', 1),
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('2975:8355') },
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
 * `layout: rows` — the partner page's "Three Core Services" (`2749:6863`).
 * The numeral moves out of the sticky rail into a 75px ink circle on the row,
 * and each panel's `details` draw under its body: the breakdowns in ink, the
 * last one — the promise — in brand red.
 */
export const Rows: Story = {
  args: seededSectionArgs('partners-sanity', 'railPanelsSection'),
  parameters: { design: figmaDesign('2749:6863') },
}

/**
 * The rows layout below `lg` (`2975:9343`): the circle takes its own line and
 * the 394 and 608 columns stack under it.
 */
export const RowsMobile: Story = {
  args: seededSectionArgs('partners-sanity', 'railPanelsSection'),
  globals: { viewport: { value: 'mobile' } },
}

/**
 * `layout: grid` — the redesigned Solutions frame's service grid
 * (`2358:2788`, #93): the panels side by side as columns, each one's details
 * stacked plain under its 37px mark and heading — no rail, no numerals, no
 * promise-in-red.
 */
export const Grid: Story = {
  args: seededSectionArgs('solutions-software-engineering', 'railPanelsSection'),
  parameters: { design: figmaDesign('2358:2788') },
}

/** The grid below `lg` — three columns become one stack. */
export const GridMobile: Story = {
  args: seededSectionArgs('solutions-software-engineering', 'railPanelsSection'),
  globals: { viewport: { value: 'mobile' } },
}

/**
 * `backgroundMedia` — the band sits on a picture (#239). This is the band the
 * o3xo homepage migrates onto its own photograph (kit `4406:6755`, "AI
 * Expertise"); the seeded picture here is O3's, because the stories layer
 * reads O3's committed tree.
 *
 * The surface is still `ink`: it paints under the picture, it decides the
 * copy's colour, and it is what the tint is made of.
 */
export const OnPhotograph: Story = {
  args: {
    ...seededSectionArgs('index', 'railPanelsSection', 0),
    surface: 'ink',
    backgroundMedia: {
      _type: 'backgroundMedia',
      image: seedImage('tools/migration/data/seed/assets/work-city.png'),
    },
  },
}

/** `tint: 'none'` — the picture as it is, which is what the kit draws. */
export const OnPhotographUntinted: Story = {
  args: {
    ...OnPhotograph.args,
    backgroundMedia: {
      _type: 'backgroundMedia',
      image: seedImage('tools/migration/data/seed/assets/work-city.png'),
      tint: 'none',
    },
  },
}

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
 * `layout` is the other axis: `rail` is the Home composition; `cards` is
 * three ink cards (`1925:6113`–`6115`), drawn by no seed — the fixture below
 * carries it; `rows` is the partner page's services (`2334:2170`); `grid` is
 * the Solutions service grid (`2358:2788`).
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

/**
 * `layout: cards` — three engagement cards side by side (`1925:6108`). No
 * seed draws this arm, so the story carries its own band.
 */
const CARDS_FIXTURE: Parameters<typeof RailPanelsSection>[0] = {
  surface: 'white',
  layout: 'cards',
  heading: 'Three ways in. You decide how much of the problem to hand us.',
  intro:
    'From senior hands inside your team to owning the whole outcome — the right engagement depends on how much of the problem is yours to keep.',
  panels: [
    {
      _type: 'panel',
      _key: 'eng-embedded',
      railLabel: 'Embedded',
      heading: 'Embedded Team Member',
      body: 'Senior hands, inside your team.',
      note: 'Best when you trust the direction and need the horsepower.',
      mark: { _type: 'mark', kind: 'orb', state: 'connecting', size: 64, speed: 1, paused: false },
      button: null,
    },
    {
      _type: 'panel',
      _key: 'eng-squad',
      railLabel: 'Product Squad',
      heading: 'Product Squad',
      body: 'A cross-functional pod that takes a problem and runs.',
      note: 'Best when you need momentum and a team that owns delivery.',
      mark: { _type: 'mark', kind: 'orb', state: 'weaving', size: 64, speed: 1, paused: false },
      button: null,
    },
    {
      _type: 'panel',
      _key: 'eng-full',
      railLabel: 'Full Ownership',
      heading: 'Full Ownership',
      body: 'Hand us the outcome, not the tasks.',
      note: 'Best when a single point of accountability is worth more than a seat at every standup.',
      mark: { _type: 'mark', kind: 'orb', state: 'solving', size: 64, speed: 1, paused: false },
      button: null,
    },
  ],
}

/** Three engagement cards side by side — no rail, no media square. */
export const Cards: Story = {
  args: CARDS_FIXTURE,
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
  args: CARDS_FIXTURE,
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

/**
 * `layout: grid` — the redesigned Solutions frame's service grid
 * (`2358:2788`, #93): the panels side by side as columns, each one's details
 * stacked plain under its 37px mark and heading — no rail, no numerals, no
 * promise-in-red.
 */
export const Grid: Story = {
  args: seededSectionArgs('solutions', 'railPanelsSection'),
  parameters: { design: figmaDesign('2358:2788') },
}

/** The grid below `lg` — three columns become one stack. */
export const GridMobile: Story = {
  args: seededSectionArgs('solutions', 'railPanelsSection'),
  globals: { viewport: { value: 'mobile' } },
}

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'
import { Reveal } from '@o3/ui'

import { seedImage, seededSectionArgs } from '../../../testing/seedContent'

import { RailPanelsSection } from './RailPanelsSection'

/**
 * Rail + panels — an ordered set of parallel things, in five arrangements.
 *
 * `layout` is the axis: `rail` is Home's platforms band (`2747:4486`); `cards`
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
    design: figmaDesign('2747:4486'),
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
 * The one arrangement that still switches composition at `lg`.
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

/**
 * The track's entrance, under the band's own — scroll down to it.
 *
 * The page wraps every band in `SectionReveal`, so this story does too: what
 * has to be judged is the composed motion, not the columns on their own. The
 * band rises 24px on `ease-out`; the columns rise 24px inside it on
 * `ease-spring`, 120ms in and 100ms apart, and a spring leaves the start line
 * at rest — so through the band's rise they travel with it and only lift as it
 * settles. Two rises on the same curve would read as the same motion twice.
 *
 * Columns past the horizontal fold play on the same timer as the ones in
 * sight; scrolling the row sideways afterwards finds them already settled.
 */
export const TrackEntrance: Story = {
  args: seededSectionArgs('index', 'railPanelsSection', 1),
  parameters: { design: figmaDesign('2846:5480') },
  render: (args) => (
    <>
      <div className="bg-bone flex h-screen items-center justify-center">
        <p className="text-fg-muted">Scroll down ↓</p>
      </div>
      <Reveal>
        <RailPanelsSection {...args} />
      </Reveal>
    </>
  ),
}

/**
 * The track's advance — scroll the page slowly and the columns walk sideways.
 *
 * The spacer above and below is what makes it visible: the band's transit
 * across the viewport is the whole travel, so the story needs room on both
 * sides of it to be scrolled through. The rule under the columns is reading
 * `scrollLeft` and knows nothing about who moved it, so it tracks the advance
 * for free.
 *
 * Grab the columns — pointer, a sideways wheel, tab into the row and use the
 * arrow keys — and the page stops steering them for as long as the band is on
 * screen, snapping back on as it hands over. Scroll the band clear of the
 * viewport and back and it takes the wheel again.
 *
 * Neither this nor the entrance runs on a coarse pointer or under reduced
 * motion, and Storybook cannot fake either media query — check them in the
 * browser's emulation panel.
 */
export const TrackAdvance: Story = {
  args: seededSectionArgs('index', 'railPanelsSection', 1),
  parameters: { design: figmaDesign('2846:5480') },
  render: (args) => (
    <>
      <div className="bg-bone flex h-screen items-center justify-center">
        <p className="text-fg-muted">Scroll down ↓</p>
      </div>
      <Reveal>
        <RailPanelsSection {...args} />
      </Reveal>
      <div className="bg-bone flex h-screen items-center justify-center">
        <p className="text-fg-muted">↑ Scroll back up</p>
      </div>
    </>
  ),
}

/** The track at 402 (`2975:8355`) — one column per view, no hairline in sight. */
export const TrackMobile: Story = {
  args: seededSectionArgs('index', 'railPanelsSection', 1),
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('2975:8355') },
}

/** The Solutions composition (`1925:6108`): `layout: cards`, three engagement cards. */
export const Cards: Story = {
  args: seededSectionArgs('solutions', 'railPanelsSection'),
  parameters: { design: figmaDesign('1925:6108') },
}

/**
 * The rail at 402 (`2975:8188`): the rail is a tab row over the panels, each
 * panel stacks its plate under its copy, and the underline replaces the 3 × 20
 * indicator on the active stop.
 */
export const RailMobile: Story = {
  args: seededSectionArgs('index', 'railPanelsSection', 0),
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('2975:8188') },
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

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'
import { expect, within } from 'storybook/test'

import { seededSectionArgs } from '../../../testing/seedContent'

import { LogoWallSection } from './LogoWallSection'

const meta = {
  title: 'Content/Blocks/Section/LogoWallSection',
  component: LogoWallSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('3720:60483'),
  },
} satisfies Meta<typeof LogoWallSection>

export default meta
type Story = StoryObj<typeof meta>

export const AsSeeded: Story = {
  args: seededSectionArgs('index', 'logoWallSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    await assertStrip(canvasElement)
    const body = canvasElement.querySelector('section > div p.text-lead')!
    await expect(body.getBoundingClientRect().width).toBe(900)
  },
}

export const Mobile: Story = {
  args: seededSectionArgs('index', 'logoWallSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('3726:62792') },
  play: async ({ canvasElement }) => {
    await assertStrip(canvasElement)
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    await expect(getComputedStyle(heading).fontFamily).toContain('Newsreader')
    await expect(getComputedStyle(heading).fontWeight).toBe('400')
    await expect(getComputedStyle(heading).fontSize).toBe('38px')
    await expect(getComputedStyle(heading).lineHeight).toBe('42px')
  },
}

export const NoButton: Story = {
  args: { ...seededSectionArgs('index', 'logoWallSection'), button: null },
  globals: { backgrounds: { value: 'bone' } },
}

export const NoBody: Story = {
  args: { ...seededSectionArgs('index', 'logoWallSection'), body: undefined },
  globals: { backgrounds: { value: 'bone' } },
}

export const ThreeClients: Story = {
  args: {
    ...seededSectionArgs('index', 'logoWallSection'),
    clients: (seededSectionArgs('index', 'logoWallSection').clients ?? []).slice(0, 3),
  },
  globals: { backgrounds: { value: 'bone' } },
}

export const MissingLogo: Story = {
  args: {
    ...seededSectionArgs('index', 'logoWallSection'),
    clients: (seededSectionArgs('index', 'logoWallSection').clients ?? []).map((client, i) =>
      i === 2 ? { ...client, logo: null } : client,
    ),
  },
  globals: { backgrounds: { value: 'bone' } },
}

export const Bar: Story = {
  args: seededSectionArgs('partners-sanity', 'logoWallSection'),
  parameters: { design: figmaDesign('2332:1708') },
  globals: { backgrounds: { value: 'bone' } },
}

export const BarMobile: Story = {
  args: seededSectionArgs('partners-sanity', 'logoWallSection'),
  globals: { viewport: { value: 'mobile' }, backgrounds: { value: 'bone' } },
}

async function assertStrip(canvasElement: HTMLElement) {
  const section = canvasElement.querySelector('section')!
  const track = section.querySelector('ul')!
  const marks = Array.from(track.querySelectorAll('li'))
  await expect(getComputedStyle(section).paddingTop).toBe('128px')
  await expect(getComputedStyle(section).paddingBottom).toBe('64px')
  await expect(track.getBoundingClientRect().height).toBe(43)
  await expect(getComputedStyle(marks[0]!).borderWidth).toBe('0px')
  await expect(getComputedStyle(marks[0]!).paddingRight).toBe('64px')
  await expect(marks[0]!.clientWidth - 64).toBe(175)
  const firstCopy = marks.filter((mark) => !mark.hasAttribute('aria-hidden'))
  const copies = marks.length / firstCopy.length
  const copyWidth = firstCopy.reduce((width, mark) => width + mark.getBoundingClientRect().width, 0)
  await expect(track.getBoundingClientRect().width / copies).toBeCloseTo(copyWidth, 1)
  await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth)
}

/** Saved surface metadata cannot invert copy on the Home composition's light wash. */
export const SavedInkSurface: Story = {
  ...AsSeeded,
  args: { ...AsSeeded.args, surface: 'ink' },
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector('section')!
    const body = section.querySelector('p.text-lead')!
    await expect(section).toHaveAttribute('data-surface', 'bone')
    await expect(getComputedStyle(body).color).toBe('rgb(85, 82, 78)')
  },
}

export const BarOnInk: Story = {
  ...Bar,
  args: { ...Bar.args, surface: 'ink' },
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector('section')!
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    await expect(section).toHaveAttribute('data-surface', 'ink')
    await expect(getComputedStyle(section).backgroundImage).toBe('none')
    await expect(getComputedStyle(heading).color).toBe('rgba(255, 255, 255, 0.92)')
  },
}

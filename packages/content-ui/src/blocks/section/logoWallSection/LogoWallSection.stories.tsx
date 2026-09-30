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
  args: { ...seededSectionArgs('index', 'logoWallSection'), surface: 'ink' },
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    await assertStrip(canvasElement)
    const body = canvasElement.querySelector('section > div p.text-lead')!
    await expect(body.getBoundingClientRect().width).toBe(900)
    // `text-lead` is 24/34 at 1440; its fluid clamp lands a hair under 24.
    await expect(parseFloat(getComputedStyle(body).fontSize)).toBeCloseTo(24, 0)
    const section = canvasElement.querySelector('section')!
    await expect(section).toHaveAttribute('data-surface', 'ink')
    await expect(getComputedStyle(section).backgroundImage).toBe('none')
    await expect(getComputedStyle(body).color).toBe('rgb(170, 166, 158)')
  },
}

export const Mobile: Story = {
  args: { ...seededSectionArgs('index', 'logoWallSection'), surface: 'ink' },
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
  args: { ...seededSectionArgs('partners-sanity', 'logoWallSection'), surface: 'ink' },
  parameters: { design: figmaDesign('3895:17711') },
  play: async ({ canvasElement }) => {
    await assertStrip(canvasElement)
    const section = canvasElement.querySelector('section')!
    await expect(section).toHaveAttribute('data-surface', 'ink')
    await expect(getComputedStyle(section).backgroundImage).toContain('partner-texture')
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    await expect(getComputedStyle(heading).fontSize).toBe('48px')
    await expect(getComputedStyle(heading).color).toBe('rgb(255, 255, 255)')
  },
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'desktop' } },
}

export const BarMobile: Story = {
  args: { ...seededSectionArgs('partners-sanity', 'logoWallSection'), surface: 'ink' },
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

export const AuthoredLightSurface: Story = {
  ...AsSeeded,
  args: { ...AsSeeded.args, surface: 'white' },
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector('section')!
    await expect(section).toHaveAttribute('data-surface', 'white')
    await expect(getComputedStyle(section).backgroundColor).toBe('rgb(255, 255, 255)')
    await expect(getComputedStyle(section.querySelector('h2')!).color).toBe('rgb(10, 10, 11)')
  },
}

/** Uploaded white-matte logos share the strip with transparent and older references. */
export const OpaqueAndAlphaMarks: Story = {
  ...AsSeeded,
  args: {
    ...AsSeeded.args,
    clients: (
      [
        ['American Family', 'b42b1199a726124f20ffefeb144fc906ebab46ef-921x570-webp', false],
        ['Essity', 'b0b44ade94dd026f1dcc435e8b93dbd674ac8993-921x570-webp', false],
        ['Cencora', '55d9985b53b1e04ca118fa2b8854d20a329f32d7-921x570-webp', false],
        ['Ironman', '79d44c241bc1bab4c6dd9dcde12ae2f4917986da-1200x297-png', true],
        ['Vertex', 'c4e6317ffd073039904d3e1c833aec3a504c8a11-1200x221-png', undefined],
      ] as const
    ).map(([name, asset, hasAlpha]) => ({
      _id: String(name),
      name: String(name),
      logo: {
        _type: 'image' as const,
        asset: {
          _type: 'reference' as const,
          _ref: `image-${asset}`,
          _id: `image-${asset}`,
          metadata: { hasAlpha: hasAlpha ?? null },
        },
      },
    })),
  },
  play: async ({ canvasElement }) => {
    const track = canvasElement.querySelector('ul')!
    await expect(getComputedStyle(track).mixBlendMode).toBe('screen')
    const marks = Array.from(track.querySelectorAll('li:not([aria-hidden]) img'))
    await expect(marks).toHaveLength(5)
    for (const mark of marks.slice(0, 3)) {
      await expect(getComputedStyle(mark).filter).toContain('invert(1)')
      await expect(getComputedStyle(mark).filter).not.toContain('brightness(0)')
    }
    for (const mark of marks.slice(3)) {
      await expect(getComputedStyle(mark).filter).toContain('brightness(0)')
    }
  },
}

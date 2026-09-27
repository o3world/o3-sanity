import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { seededSectionArgs } from '@o3/content-ui/testing/seed'
import { BlockRenderer } from './BlockRenderer'

const blocks = [
  {
    ...seededSectionArgs('ventures-urvin', 'mediaSection'),
    _key: 'feature',
    _type: 'mediaSection',
    variant: 'feature',
    heading: 'Philly made.',
    subheading: 'A lot of grit. A little edge.',
  },
  {
    _key: 'values',
    _type: 'railPanelsSection',
    layout: 'track',
    heading: 'What we optimize for.',
    surface: 'bone',
    panels: [{ _key: 'one', heading: 'Quality', body: 'Built to last.' }],
  },
]

const meta = {
  title: 'Content/Composition/OverlappingFeature',
  component: BlockRenderer,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BlockRenderer>
export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop' } },
  args: {
    blocks,
  },
  play: async ({ canvasElement }) => {
    const sections = canvasElement.querySelectorAll('section')
    const photo = sections[0]!.querySelector('figure > div')!.getBoundingClientRect()
    const heading = sections[1]!.querySelector('h2')!.getBoundingClientRect()
    await expect(sections[0]!.getBoundingClientRect().height).toBeCloseTo(photo.height - 64, 0)
    await expect(getComputedStyle(sections[1]!).paddingTop).toBe('192px')
    await expect(heading.top - photo.bottom).toBeCloseTo(128, 0)
  },
}
export const Mobile: Story = {
  ...Desktop,
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const sections = canvasElement.querySelectorAll('section')
    const photo = sections[0]!.querySelector('figure > div')!.getBoundingClientRect()
    const heading = sections[1]!.querySelector('h2')!.getBoundingClientRect()
    await expect(sections[0]!.getBoundingClientRect().height).toBeCloseTo(photo.height - 64, 0)
    await expect(getComputedStyle(sections[1]!).paddingTop).toBe('128px')
    await expect(heading.top - photo.bottom).toBeCloseTo(64, 0)
  },
}

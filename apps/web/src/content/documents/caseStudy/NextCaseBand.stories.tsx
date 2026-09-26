import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '@o3/content-ui/testing/seed'

import { NextCaseBand } from './NextCaseBand'

const meta = {
  title: 'Content/Documents/CaseStudy/NextCaseBand',
  component: NextCaseBand,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('3267:9463'),
  },
} satisfies Meta<typeof NextCaseBand>

export default meta
type Story = StoryObj<typeof meta>

const [firstCase] = seededSectionArgs('index', 'caseShowcaseSection').caseStudies ?? []

export const Desktop: Story = {
  args: { next: firstCase! },
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const title = canvas.getByRole('heading', { name: 'There’s more where that came from.' })
    await expect(title.getBoundingClientRect().left).toBeCloseTo(96, 1)
    await expect(getComputedStyle(title).fontSize).toBe('48px')
    await expect(canvasElement.querySelector('a[aria-hidden="true"]')).toBeNull()
    await expect(canvas.getByRole('link')).toBeVisible()
  },
}

export const Mobile: Story = {
  args: { next: firstCase! },
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link')).toHaveAccessibleName(
      ['Next project', firstCase!.client?.name].filter(Boolean).join(' — ') +
        ': ' +
        firstCase!.title,
    )
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)
  },
}

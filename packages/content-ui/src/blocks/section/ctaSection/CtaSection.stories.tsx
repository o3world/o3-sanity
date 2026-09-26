import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'
import { expect, within } from 'storybook/test'

import { seedImage, seededSectionArgs } from '../../../testing/seedContent'

import { CtaSection } from './CtaSection'

const meta = {
  title: 'Content/Blocks/Section/CtaSection',
  component: CtaSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('3720:62476'),
  },
  globals: { backgrounds: { value: 'ink' } },
} satisfies Meta<typeof CtaSection>

export default meta
type Story = StoryObj<typeof meta>

export const AsSeeded: Story = {
  args: seededSectionArgs('about', 'ctaSection'),
}

export const Orbs: Story = {
  args: seededSectionArgs('index', 'ctaSection'),
  parameters: { design: figmaDesign('3720:62172') },
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    await expect(getComputedStyle(heading.parentElement!).gap).toBe('32px')
    await expect(getComputedStyle(heading.parentElement!.parentElement!).gap).toBe('48px')
    const band = heading.closest('section')!
    const copy = heading.parentElement!.parentElement!
    await expect(getComputedStyle(copy).paddingTop).toBe('128px')
    await expect(getComputedStyle(copy).paddingBottom).toBe('192px')
    await expect(getComputedStyle(band).paddingLeft).toBe('96px')
  },
}

export const Mobile: Story = {
  parameters: { design: figmaDesign('3726:68508') },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    const body = getComputedStyle(heading.nextElementSibling!)
    await expect(getComputedStyle(heading.parentElement!).gap).toBe('32px')
    await expect(getComputedStyle(heading.parentElement!.parentElement!).gap).toBe('48px')
    const band = heading.closest('section')!
    const copy = heading.parentElement!.parentElement!
    await expect(getComputedStyle(copy).paddingTop).toBe('128px')
    await expect(getComputedStyle(copy).paddingBottom).toBe('64px')
    await expect(getComputedStyle(band).paddingLeft).toBe('16px')
    await expect(body.fontSize).toBe('20px')
    await expect(body.lineHeight).toBe('26px')
    await expect(body.letterSpacing).toBe('normal')
  },
  args: seededSectionArgs('index', 'ctaSection'),
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'mobile' } },
}

export const HeadingOnly: Story = {
  args: { ...seededSectionArgs('about', 'ctaSection'), body: undefined, button: null },
}

export const NoDecoration: Story = {
  args: { ...seededSectionArgs('about', 'ctaSection'), decoration: 'none' },
}

export const MoleculeMobile: Story = {
  args: seededSectionArgs('about', 'ctaSection'),
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'mobile' } },
}

export const OnPhotograph: Story = {
  args: {
    ...seededSectionArgs('about', 'ctaSection'),
    backgroundMedia: {
      _type: 'backgroundMedia',
      image: seedImage('tools/migration/data/seed/assets/work-city.png'),
    },
  },
}

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'
import { expect, within } from 'storybook/test'

import { CollectionHero } from './collection-hero'
import { Eyebrow } from './eyebrow'
import { OrbitalSphere } from './orbital-sphere'
import { SectionBackground } from './section-shell'

const meta = {
  title: 'UI/CollectionHero',
  component: CollectionHero,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('2107:1051'),
  },
  globals: { backgrounds: { value: 'ink' } },
} satisfies Meta<typeof CollectionHero>

export default meta
type Story = StoryObj<typeof meta>

export const Interior: Story = {
  args: {
    eyebrow: 'Insights',
    heading: 'Learn about what drives our experiences.',
    subheading:
      'Looking for some firsthand knowledge from our world? Check out our in-depth thoughts about the industry today, our culture at O3, the future of AI and digital experiences, and other relevant topics.',
  },
  globals: { viewport: { value: 'desktop' } },
  parameters: { design: figmaDesign('2107:1051') },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 1 })
    const section = heading.closest('section')!
    await expect(getComputedStyle(section).paddingTop).toBe('240px')
    await expect(getComputedStyle(section).paddingLeft).toBe('96px')
    await expect(getComputedStyle(section).paddingBottom).toBe('64px')
    await expect(getComputedStyle(heading).fontFamily).toContain('Newsreader')
    await expect(getComputedStyle(heading).fontWeight).toBe('400')
    await expect(heading.nextElementSibling!.getBoundingClientRect().width).toBe(608)
    await expect(getComputedStyle(heading.previousElementSibling!).color).toBe('rgb(255, 255, 255)')
    await expect(getComputedStyle(heading.nextElementSibling!).color).toBe('rgb(170, 166, 158)')
  },
}

export const InteriorWithRail: Story = {
  args: {
    eyebrow: 'Technology partners',
    heading: 'Sanity Development Partner',
    subheading:
      "Structure, flexibility, and scale. That's what Sanity does. That's what we build on it.",
    aside: (
      <div className="flex flex-col gap-3">
        <Eyebrow size="lg" tone="inverse">
          o3 expertise:
        </Eyebrow>
        <ul className="text-lead flex list-disc flex-col gap-1 pl-5">
          <li>20+ Sanity implementations</li>
          <li>Certified Sanity developers</li>
          <li>Partners in production</li>
        </ul>
      </div>
    ),
  },
  parameters: { design: figmaDesign('2401:3185') },
}

export const InteriorWhite: Story = {
  args: {
    surface: 'white',
    eyebrow: 'About O3',
    heading: 'The model is the story.',
    subheading: 'Senior people, on your problem, from the first conversation.',
  },
  parameters: { design: figmaDesign('3754:78274') },
  globals: { backgrounds: { value: 'white' } },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 1 })
    await expect(getComputedStyle(heading.previousElementSibling!).color).toBe('rgb(201, 14, 0)')
    await expect(getComputedStyle(heading.nextElementSibling!).color).toBe('rgb(85, 82, 78)')
  },
}

export const InteriorWithGlobe: Story = {
  args: {
    eyebrow: 'Work',
    heading: 'The problems behind the problems.',
    decoration: (
      <OrbitalSphere className="-z-10 hidden lg:bottom-[-40%] lg:right-[-10%] lg:block lg:w-[760px]" />
    ),
  },
}

export const InteriorOverPicture: Story = {
  args: {
    eyebrow: 'Solutions',
    heading: 'Strategy, design, engineering and AI under one roof.',
    background: (
      <SectionBackground surface="ink">
        <div className="bg-brand" />
      </SectionBackground>
    ),
  },
}

export const Centred: Story = {
  args: {
    eyebrow: 'Solutions',
    heading: 'Strategy, design, engineering and AI under one roof.',
    align: 'center',
  },
}

export const CentredWithSubheading: Story = {
  args: {
    eyebrow: 'About O3',
    heading:
      'A digital product consultancy that has spent over 20 years prioritizing quality over scale',
    subheading: 'Senior people, on your problem, from the first conversation.',
    align: 'center',
    surface: 'paper',
  },
  globals: { viewport: { value: 'desktop' } },
  parameters: { design: figmaDesign('3754:78488') },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 1 })
    await expect(getComputedStyle(heading).textAlign).toBe('center')
    await expect(heading.parentElement!.getBoundingClientRect().width).toBe(982)
    await expect(
      within(canvasElement).getByText(
        'Senior people, on your problem, from the first conversation.',
      ),
    ).toBeVisible()
  },
}

export const CentredMobile: Story = {
  ...CentredWithSubheading,
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('3883:16496') },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 1 })
    await expect(getComputedStyle(heading).textAlign).toBe('center')
    await expect(heading.parentElement!.getBoundingClientRect().width).toBe(
      document.documentElement.clientWidth - 32,
    )
    await expect(getComputedStyle(heading.closest('section')!).paddingTop).toBe('192px')
    await expect(getComputedStyle(heading.closest('section')!).paddingBottom).toBe('64px')
  },
}

export const HeadingOnly: Story = {
  args: { heading: 'Just the headline.' },
}

export const WorkStatic: Story = {
  args: { ...Interior.args, eyebrow: 'Work' },
  play: async ({ canvasElement }) => {
    const { expect } = await import('storybook/test')
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('h1, p')]
    expect(parts).toHaveLength(3)
    for (const part of parts) {
      expect(getComputedStyle(part).animationName).toBe('none')
      expect(getComputedStyle(part).opacity).toBe('1')
    }
  },
}

export const WorkStaticWithoutEyebrow: Story = {
  args: { ...Interior.args, eyebrow: undefined },
  play: async ({ canvasElement }) => {
    const { expect } = await import('storybook/test')
    const parts = [...canvasElement.querySelectorAll<HTMLElement>('h1, p')]
    expect(parts).toHaveLength(2)
    for (const part of parts) {
      expect(getComputedStyle(part).animationName).toBe('none')
      expect(getComputedStyle(part).opacity).toBe('1')
    }
  },
}

export const InteriorMobile: Story = {
  ...Interior,
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 1 })
    await expect(getComputedStyle(heading.closest('section')!).paddingTop).toBe('208px')
    await expect(getComputedStyle(heading.closest('section')!).paddingBottom).toBe('64px')
    await expect(getComputedStyle(heading.closest('section')!).paddingLeft).toBe('16px')
    await expect(getComputedStyle(heading).fontSize).toBe('40px')
    await expect(getComputedStyle(heading).lineHeight).toBe('44px')
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth)
  },
}

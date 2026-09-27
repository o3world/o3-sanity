import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'
import { expect, waitFor, within } from 'storybook/test'

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

export const Gradient: Story = {
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

export const OnPhotograph: Story = {
  args: {
    ...seededSectionArgs('about', 'ctaSection'),
    backgroundMedia: {
      _type: 'backgroundMedia',
      image: seedImage('tools/migration/data/seed/assets/work-city.png'),
    },
  },
}

/** The footer and authored CTA can both differ from the source frame's height. */
export const ReflowingFooter: Story = {
  args: seededSectionArgs('about', 'ctaSection'),
  render: (args) => (
    <>
      <div data-testid="entrance" style={{ transform: 'translateY(24px)', opacity: 0 }}>
        <CtaSection {...args} />
      </div>
      <footer id="footer" className="site-footer" style={{ height: 137 }}>
        Footer content
      </footer>
    </>
  ),
  play: async ({ canvasElement }) => {
    const cta = canvasElement.querySelector('section')!
    const footer = canvasElement.querySelector('footer')!
    const check = async () =>
      waitFor(() => {
        const total = `${cta.offsetHeight + footer.offsetHeight}px`
        expect(cta.style.getPropertyValue('--cta-combined-height')).toBe(total)
        expect(footer.style.getPropertyValue('--cta-combined-height')).toBe(total)
        expect(getComputedStyle(cta).backgroundSize).toBe(getComputedStyle(footer).backgroundSize)
      })
    await check()
    const entrance = canvasElement.querySelector<HTMLElement>('[data-testid="entrance"]')!
    entrance.style.transform = 'none'
    entrance.style.opacity = '1'
    await check()
    footer.style.height = '311px'
    await check()
    cta.style.paddingBottom = '101px'
    await check()
    cta.style.marginBottom = '20px'
    footer.style.height = '312px'
    await waitFor(() => {
      expect(cta.style.getPropertyValue('--cta-combined-height')).toBe('')
      expect(footer.style.getPropertyValue('--cta-combined-height')).toBe('')
    })
  },
}

export const DesignedBreaks: Story = {
  args: {
    ...seededSectionArgs('index', 'ctaSection'),
    heading: 'But enough about us.\u2028Tell us about you.',
  },
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    await expect(heading.textContent).toBe('But enough about us.\nTell us about you.')
    await expect(getComputedStyle(heading).whiteSpace).toBe('pre-line')
  },
}

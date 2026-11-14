import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, within } from 'storybook/test'

import { aSeededServiceOffer } from '../seedFixture'
import { Faq } from './Faq'
import { FinalCta } from './FinalCta'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { OurPromise } from './OurPromise'
import { Packages } from './Packages'
import { TheShift } from './TheShift'
import { WhatWeReview } from './WhatWeReview'
import styles from './aiVisibilityReview.module.css'

const offer = aSeededServiceOffer()
const bookingHref = '#contact'

/** Each band of the AI Visibility Review page alone, from the committed seed. */
const meta = {
  title: 'Landing/AI Visibility Review/Sections',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className={styles.page}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const HeroBand: Story = {
  name: 'Hero',
  render: () => <Hero bookingHref={bookingHref} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      'When customers ask AI about you, what does it say?',
    )
    // The marquee draws its list twice; only the first is exposed.
    await expect(canvas.getAllByRole('list')).toHaveLength(1)
  },
}

export const Shift: Story = {
  name: 'The shift',
  render: () => <TheShift />,
}

export const Review: Story = {
  name: 'What we review',
  render: () => <WhatWeReview />,
}

export const PackagesBand: Story = {
  name: 'Packages',
  render: () => (
    <Packages
      packages={offer.packages ?? []}
      addOns={offer.addOns ?? []}
      bookingHref={bookingHref}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Most popular')).toBeVisible()
    await expect(canvas.getByRole('link', { name: /Start with a Check/ })).toHaveAttribute(
      'data-event',
      'start_check_click',
    )
  },
}

export const PackagesOnPhone: Story = {
  name: 'Packages (phone)',
  render: PackagesBand.render,
  globals: { viewport: { value: 'mobile' } },
  tags: ['!test'],
}

export const How: Story = {
  name: 'How it works',
  render: () => <HowItWorks />,
}

export const PromiseBand: Story = {
  name: 'Our promise',
  render: () => <OurPromise />,
  tags: ['!test'],
}

export const FaqBand: Story = {
  name: 'FAQ',
  render: () => <Faq faqs={offer.faqs ?? []} bookingHref={bookingHref} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const hub = canvas.getByText('What are OpenAI’s Business Hub and Business Agents?')
    await expect(hub.closest('details')).not.toHaveAttribute('open')
    await userEvent.click(hub)
    await expect(hub.closest('details')).toHaveAttribute('open')
    await expect(canvas.getByText('Business Hub:').tagName).toBe('STRONG')
  },
}

export const Cta: Story = {
  name: 'Final CTA',
  render: () => <FinalCta bookingHref={bookingHref} />,
}

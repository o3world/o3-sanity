import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, within } from 'storybook/test'

import { LandingFooter } from '@/components/landing/LandingFooter'

import { aSeededServiceOffer } from '../seedFixture'
import { AiVisibilityReviewView } from './AiVisibilityReviewView'

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] }

/** The whole landing page from the committed seed, inside its landing footer. */
const meta = {
  title: 'Pages/AI Visibility Review',
  component: AiVisibilityReviewView,
  parameters: { layout: 'fullscreen' },
  args: { offer: aSeededServiceOffer() },
  render: (args) => (
    <>
      <AiVisibilityReviewView {...args} />
      <LandingFooter year={2026} />
    </>
  ),
} satisfies Meta<typeof AiVisibilityReviewView>

export default meta
type Story = StoryObj<typeof meta>

/** Two columns: the AI answer card beside the copy, and the section anchors in the nav. */
export const Desktop: Story = {
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Laid out, though still mid-entrance: the card fades in after the copy.
    const card = canvas.getByRole('img', { name: /AI assistant answering/ })
    await expect(getComputedStyle(card.parentElement!).display).not.toBe('none')
    await expect(canvas.getByRole('link', { name: 'Packages' })).toBeVisible()
    await expect(
      canvas.getByText('What is an AI Visibility Review?').closest('details'),
    ).toHaveAttribute('open')
  },
}

/** One column: the card and the section anchors are gone, "Let’s talk" stays. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('img', { name: /AI assistant answering/, hidden: true }),
    ).not.toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Packages', hidden: true })).not.toBeVisible()
    await expect(canvas.getByRole('link', { name: /Let’s talk/ })).toBeVisible()
  },
}

/** A booking click reaches GTM's dataLayer under the event and placement GA4 counts. */
export const BookingClick: Story = {
  globals: { viewport: { value: 'desktop' } },
  tags: ['vr:skip'],
  play: async ({ canvasElement }) => {
    const page = window as DataLayerWindow
    delete page.dataLayer
    const canvas = within(canvasElement)
    const [hero] = canvas.getAllByRole('link', { name: /Book a free 20-minute call/ })
    hero!.addEventListener('click', (event) => event.preventDefault(), { once: true })
    await userEvent.click(hero!)
    await expect(page.dataLayer).toEqual([{ event: 'book_call_click', location: 'hero' }])
    delete page.dataLayer
  },
}

/** A booking URL on the offer sends every booking button there. */
export const WithBookingUrl: Story = {
  args: {
    offer: aSeededServiceOffer({ bookingUrl: 'https://calendly.com/o3world/ai-visibility' }),
  },
  globals: { viewport: { value: 'desktop' } },
  tags: ['!test'],
}

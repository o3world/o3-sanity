import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'

import { LandingFooter } from './LandingFooter'
import { LandingNav } from './LandingNav'

const links = [
  { label: 'What we review', href: '#review' },
  { label: 'Packages', href: '#packages' },
  { label: 'How it works', href: '#how' },
  { label: 'FAQ', href: '#faq' },
]

/** The nav and footer a landing page wears in place of the site's. */
const meta = {
  title: 'Chrome/Landing',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Nav: Story = {
  render: () => (
    <div className="bg-ink min-h-[240px] pt-4">
      <LandingNav links={links} bookingHref="#contact" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'O3 World home' })).toHaveAttribute('href', '/')
    await expect(canvas.getByRole('link', { name: /Let’s talk/ })).toHaveAttribute(
      'data-event',
      'book_call_click',
    )
  },
}

/** Phones keep the mark and "Let’s talk"; the section anchors go. */
export const NavOnPhone: Story = {
  render: Nav.render,
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'FAQ', hidden: true })).not.toBeVisible()
  },
}

export const Footer: Story = {
  render: () => <LandingFooter year={2026} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute(
      'href',
      '/privacy-policy',
    )
  },
}

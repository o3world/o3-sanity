import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { figmaDesign } from '@o3/story-kit'
import { expect, userEvent, within } from 'storybook/test'

import { seededSectionArgs } from '../../../testing/seedContent'

import { FormSection } from './FormSection'

/** Contact's current split introduction and form; existing secondary content follows below. */
const meta = {
  title: 'Content/Blocks/Section/FormSection',
  component: FormSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FormSection>

export default meta
type Story = StoryObj<typeof meta>

/** `/contact` as seeded. */
export const AsSeeded: Story = {
  args: seededSectionArgs('contact', 'formSection'),
  globals: { viewport: { value: 'desktop' } },
  parameters: { design: figmaDesign('2960:7792') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvasElement.querySelector('canvas')).toBeNull()
    const heading = canvas.getByRole('heading', { level: 1 })
    const name = canvas.getByLabelText(/Your name/)
    const email = canvas.getByLabelText(/Email/)
    const form = name.closest('form')!
    const section = heading.closest('section')!
    await expect(getComputedStyle(section).paddingTop).toBe('256px')
    await expect(getComputedStyle(section).paddingLeft).toBe('96px')
    await expect(form.parentElement!.getBoundingClientRect().width).toBe(608)
    await expect(getComputedStyle(form.parentElement!).paddingLeft).toBe('32px')
    await expect(name.getBoundingClientRect().y).toBe(email.getBoundingClientRect().y)
    await expect(name.getBoundingClientRect().height).toBe(44)
    await expect(
      form.parentElement!.getBoundingClientRect().left - heading.getBoundingClientRect().right,
    ).toBe(32)
  },
}

/** Every field gets the full mobile card width. */
export const Mobile: Story = {
  args: seededSectionArgs('contact', 'formSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('3754:78225') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvasElement.querySelector('canvas')).toBeNull()
    const name = canvas.getByLabelText(/Your name/)
    const email = canvas.getByLabelText(/Email/)
    const form = name.closest('form')!
    const section = name.closest('section')!
    await expect(getComputedStyle(section).paddingTop).toBe('128px')
    await expect(getComputedStyle(section).paddingLeft).toBe('16px')
    await expect(form.parentElement!.getBoundingClientRect().width).toBe(window.innerWidth - 32)
    await expect(name.getBoundingClientRect().width).toBe(window.innerWidth - 96)
    await expect(email.getBoundingClientRect().top).toBeGreaterThan(
      name.getBoundingClientRect().bottom,
    )
    await expect(document.documentElement.scrollWidth).toBe(window.innerWidth)
  },
}

/**
 * Blur an empty field to see the validation. The name, email, reason, and message are required, and the
 * email check is deliberately loose — it catches the typo it can prove (no
 * `@`, no dot after it) and leaves the rest to the reply bouncing.
 */
export const Interaction: Story = {
  args: seededSectionArgs('contact', 'formSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const name = canvas.getByLabelText(/Your name/)
    const email = canvas.getByLabelText(/Email/)
    const form = name.closest('form')!
    const heading = canvas.getByRole('heading', { level: 1 })
    const geometry = () =>
      [form, form.parentElement!, heading].map((element) => {
        const rect = element.getBoundingClientRect()
        return { top: rect.top + window.scrollY, height: rect.height }
      })
    // Each field's error sits in the 24px gap below it, so it must stay one line.
    const errorsFitTheirGap = () => {
      const shown = canvas.getAllByRole('alert').filter((alert) => alert.textContent)
      for (const alert of shown) {
        expect(alert.getBoundingClientRect().height).toBeLessThanOrEqual(
          parseFloat(getComputedStyle(alert).lineHeight),
        )
      }
      return shown.length
    }
    const before = geometry()
    // Figma 2960:7794 (desktop) and 3754:78228 (mobile): the idle card height.
    const figmaCardHeight = window.innerWidth >= 1024 ? 546 : 738
    await expect(Math.abs(before[1]!.height - figmaCardHeight)).toBeLessThanOrEqual(1)

    await userEvent.click(canvas.getByRole('button', { name: /Send message/i }))
    await expect(name).toHaveFocus()
    await expect(name).toHaveAccessibleDescription('Add your name.')
    await expect(geometry()).toEqual(before)
    await expect(errorsFitTheirGap()).toBeGreaterThan(0)

    await userEvent.type(email, 'invalid')
    await expect(email).toHaveAccessibleDescription('That email address doesn’t look right.')
    await expect(geometry()).toEqual(before)
    errorsFitTheirGap()

    await userEvent.clear(email)
    await userEvent.type(email, 'preview@example.com')
    await expect(email).toHaveAttribute('aria-invalid', 'false')
    await expect(geometry()).toEqual(before)
  },
}

export const MobileInteraction: Story = {
  ...Interaction,
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
}

export const SplitLayoutBoundary: Story = {
  ...Interaction,
  globals: { ...Interaction.globals, viewport: { value: 'splitBoundary' } },
  parameters: {
    viewport: {
      options: {
        splitBoundary: {
          name: 'Split layout boundary',
          styles: { width: '1280px', height: '1000px' },
        },
      },
    },
  },
  play: async (context) => {
    await Interaction.play!(context)
    const canvas = within(context.canvasElement)
    const reason = canvas.getByLabelText(/Reason/)
    const referral = canvas.getByLabelText<HTMLInputElement>(/How’d you hear about us/)
    const label = referral.labels![0]!
    await expect(label.getBoundingClientRect().height).toBe(
      parseFloat(getComputedStyle(label).lineHeight),
    )
    await expect(referral.getBoundingClientRect().top).toBe(reason.getBoundingClientRect().top)
    await expect(referral).not.toBeRequired()
  },
}

/** Stack the introduction and fields before the desktop columns become cramped. */
export const NarrowDesktopInteraction: Story = {
  args: seededSectionArgs('contact', 'formSection'),
  globals: { viewport: { value: 'narrowDesktop' } },
  parameters: {
    viewport: {
      options: {
        narrowDesktop: { name: 'Narrow desktop', styles: { width: '1024px', height: '1000px' } },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const email = canvas.getByLabelText(/Email/)
    const name = canvas.getByLabelText(/Your name/)
    const reasonLabel = canvas.getByLabelText<HTMLSelectElement>(/Reason/).labels![0]!
    const form = email.closest('form')!
    const heading = canvas.getByRole('heading', { level: 1 })
    await expect(form.getBoundingClientRect().top).toBeGreaterThan(
      heading.closest('header')!.getBoundingClientRect().bottom,
    )
    await expect(email.getBoundingClientRect().top).toBeGreaterThan(
      name.getBoundingClientRect().bottom,
    )
    await expect(email.getBoundingClientRect().width).toBe(form.getBoundingClientRect().width)
    const geometry = () =>
      [form, form.parentElement!, heading].map((element) => {
        const rect = element.getBoundingClientRect()
        return { top: rect.top + window.scrollY, height: rect.height }
      })
    const before = geometry()

    await userEvent.type(email, 'invalid')
    await userEvent.click(name)
    await expect(email).toHaveAccessibleDescription('That email address doesn’t look right.')
    const error = canvas.getByText('That email address doesn’t look right.')
    await expect(error.getBoundingClientRect().bottom).toBeLessThan(
      reasonLabel.getBoundingClientRect().top,
    )
    await expect(geometry()).toEqual(before)

    await userEvent.clear(email)
    await userEvent.type(email, 'preview@example.com')
    await expect(email).toHaveAttribute('aria-invalid', 'false')
    await expect(geometry()).toEqual(before)
  },
}

/** The answer a person gets once the submission is HubSpot's. */
export const Sent: Story = {
  args: { ...seededSectionArgs('contact', 'formSection'), initialStatus: 'sent' },
  globals: { backgrounds: { value: 'bone' } },
}

/** The send failed. The values stay in the fields, so the button is a retry. */
export const Failed: Story = {
  args: { ...seededSectionArgs('contact', 'formSection'), initialStatus: 'error' },
  globals: { backgrounds: { value: 'bone' } },
}

/** No consent checkbox — the field is optional and its absence must close up. */
export const WithoutConsent: Story = {
  args: { ...seededSectionArgs('contact', 'formSection'), consentLabel: undefined },
  globals: { backgrounds: { value: 'bone' } },
}

/** The rail dropped: the card alone, on the full measure. */
export const FormOnly: Story = {
  args: {
    ...seededSectionArgs('contact', 'formSection'),
    variant: 'band',
    eyebrow: undefined,
    heading: undefined,
    note: undefined,
    media: null,
    quote: undefined,
    attribution: undefined,
    details: undefined,
  },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * The introduction fields remain authorable on the form.
 */
export const WithHeader: Story = {
  args: {
    ...seededSectionArgs('contact', 'formSection'),
    eyebrow: 'Start here',
    heading: 'Tell us what’s in the way.',
    note: 'The more specific you are about the problem, the more useful our first reply will be.',
  },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * On ink. The card declares `white` and the rail does not, so this is where
 * the split shows: the fields keep their light roles inside the card while the
 * quote and the address take the band's on-ink alphas (tokens/color.css).
 */
export const OnInk: Story = {
  args: { ...seededSectionArgs('contact', 'formSection'), surface: 'ink' },
  globals: { backgrounds: { value: 'ink' } },
}

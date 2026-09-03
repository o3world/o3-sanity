import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '../../../testing/seedContent'

import { FormSection } from './FormSection'

/**
 * The inquiry form band — `/contact`'s conversion path (#58).
 *
 * A form card beside a rail: `2960:7792` at 1440, `2975:10195` at 402. The
 * rail carries the portrait, the quote, the attribution and the studio's
 * address — the two bands that used to follow this one.
 *
 * The submit posts to the app's `/api/contact` route, which forwards to
 * HubSpot (#412). No story reaches that route — Storybook has no app behind it
 * — so `Sent` and `Failed` below open the card on each answer directly.
 *
 * The fields are **code**, not content (ADR 0014). The dropdown's options, the
 * submit's words and everything in the rail come from the document, which is
 * why the stories vary those and nothing else.
 */
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
  globals: { backgrounds: { value: 'bone' } },
  parameters: { design: figmaDesign('2960:7792') },
}

/** The columns stack, and the two name fields still share a row (`2975:10198`). */
export const Mobile: Story = {
  args: seededSectionArgs('contact', 'formSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('2975:10195') },
}

/**
 * Blur an empty field to see the validation. Every field is required, and the
 * email check is deliberately loose — it catches the typo it can prove (no
 * `@`, no dot after it) and leaves the rest to the reply bouncing.
 */
export const Interaction: Story = {
  args: seededSectionArgs('contact', 'formSection'),
  globals: { backgrounds: { value: 'bone' } },
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
    media: null,
    quote: undefined,
    attribution: undefined,
    details: undefined,
  },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * With a header. The frame draws none — the card opens at the first name field
 * — so this is the shape a page that introduces the form some other way gets.
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

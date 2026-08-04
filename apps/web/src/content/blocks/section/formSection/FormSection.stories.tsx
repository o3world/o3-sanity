import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { seededSectionArgs } from '@/stories/seedContent'

import { FormSection } from './FormSection'

/**
 * The inquiry form band — `/contact`'s conversion path (#58).
 *
 * ⚠️ **No canonical Figma frame** (`docs/content-sourcing.md`), so this file
 * carries no Design tab and nothing here is transcribed. The band is assembled
 * from parts other frames authored; when a contact frame is commissioned, this
 * is the band it replaces.
 *
 * ⚠️ **The submit path is stubbed.** `onSubmit` calls `preventDefault()`
 * unconditionally, the button is `aria-disabled` (focusable, so its notice is
 * announced) and a visible notice says why. `Interaction` below is where to
 * confirm all three still hold — a form that quietly discards what it collects
 * is worse than no form, and "tidy up that disabled button" is an easy thing
 * for a future pass to do by accident.
 *
 * The fields are **code**, not content (ADR 0014). Only the heading, the note,
 * the dropdown's options and the submit's words come from the document, which
 * is why the stories vary those and nothing else.
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
}

/** The two name fields share a row from `sm`, so they stack here. */
export const Mobile: Story = {
  args: seededSectionArgs('contact', 'formSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
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

/** No consent checkbox — the field is optional and its absence must close up. */
export const WithoutConsent: Story = {
  args: { ...seededSectionArgs('contact', 'formSection'), consentLabel: undefined },
  globals: { backgrounds: { value: 'bone' } },
}

/** Header dropped: the form alone, for a page that introduces it some other way. */
export const FormOnly: Story = {
  args: {
    ...seededSectionArgs('contact', 'formSection'),
    eyebrow: undefined,
    heading: undefined,
    note: undefined,
  },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * On ink. The submit's fill follows the band's surface rather than the
 * editor's choice — `Button`'s `dark` variant is ink-on-white and would
 * disappear here — so this is where that rule is visible.
 */
export const OnInk: Story = {
  args: { ...seededSectionArgs('contact', 'formSection'), surface: 'ink' },
  globals: { backgrounds: { value: 'ink' } },
}

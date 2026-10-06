import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'

import { FIELD_CONTROL_CLASS, FormField } from './form-field'

const meta = {
  title: 'UI/FormField',
  component: FormField,
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="max-w-100">
      <FormField {...args}>
        {(control) => <input {...control} type="text" className={FIELD_CONTROL_CLASS} />}
      </FormField>
    </div>
  ),
} satisfies Meta<typeof FormField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { name: 'firstName', label: 'First name', children: () => null },
}

/** The asterisk is for sighted readers; `(required)` is the off-screen half. */
export const Required: Story = {
  args: { name: 'firstName', label: 'First name', required: true, children: () => null },
}

/** The note is wired into the control's accessible description, not floated. */
export const WithNote: Story = {
  args: {
    name: 'email',
    label: 'Email',
    required: true,
    note: 'We reply to this address, so check it twice.',
    children: () => null,
  },
}

/** An error switches the control to `aria-invalid` and fills the alert node. */
export const Invalid: Story = {
  args: {
    name: 'email',
    label: 'Email',
    required: true,
    error: 'That email address doesn’t look right.',
    children: () => null,
  },
}

/**
 * A password manager's fill icon, in the shape LastPass injects: a zero-size
 * element after the input. The error still sits 4px under the control,
 * where it sits without one.
 */
export const InvalidWithInjectedSibling: Story = {
  args: {
    name: 'email',
    label: 'Email',
    required: true,
    error: 'That email address doesn’t look right.',
    children: () => null,
  },
  render: (args) => (
    <div className="max-w-100">
      <FormField {...args}>
        {(control) => (
          <>
            <input {...control} type="email" className={FIELD_CONTROL_CLASS} />
            <div
              data-lastpass-icon-root=""
              style={{ position: 'relative', height: 0, width: 0, float: 'left' }}
            />
          </>
        )}
      </FormField>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const control = canvasElement.querySelector('input')!.getBoundingClientRect()
    const error = canvasElement.querySelector('[role=alert]')!.getBoundingClientRect()
    await expect(error.top - control.bottom).toBe(4)
  },
}

/** `border-current` is why one skin works on all three surfaces. */
export const OnInk: Story = {
  args: { name: 'message', label: 'Message', required: true, children: () => null },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink max-w-100 p-8 text-white">
      <FormField {...args}>
        {(control) => <textarea {...control} rows={4} className={FIELD_CONTROL_CLASS} />}
      </FormField>
    </div>
  ),
}

'use client'

import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react'
// Never the `next-sanity` barrel — it drags in @portabletext/react, which
// cannot resolve under Storybook's Next preset. A lint rule enforces this.
import { stegaClean } from '@sanity/client/stega'

import { FIELD_CONTROL_CLASS, FormField, type Surface } from '@o3/ui'

import { ButtonLink } from '@/content/ButtonLink'
import type { ButtonLinkData } from '@/content/buttonDestination'

/**
 * The field set, fixed in code.
 *
 * Transcribed from **Gravity Form 1**, the form WordPress serves on
 * `/contact` today: first name and last name at half width, email, a Reason
 * dropdown, a message, and a newsletter opt-in. Recovered from the live
 * markup rather than the extract — the WP extract records the module as
 * `{ acf_fc_layout: "form", form_id: "1" }` and never captured the fields.
 *
 * Gravity's seventh input is a hidden `input_8` carrying the constant
 * `"O3 Website"` — a source tag for whatever reads the entries. It is not a
 * field a person fills in, so it is not reproduced here; whichever handler
 * #58 grows will have its own way of saying where a submission came from.
 */
type FieldName = 'firstName' | 'lastName' | 'email' | 'reason' | 'message'

/** Every one is `gfield_contains_required` on the live form. */
const REQUIRED_MESSAGE: Record<FieldName, string> = {
  firstName: 'Add your first name.',
  lastName: 'Add your last name.',
  email: 'Add your email address.',
  reason: 'Pick a reason.',
  message: 'Tell us what you need.',
}

/**
 * Deliberately loose. A browser's own `type="email"` check is looser still,
 * and every stricter pattern on the internet rejects a real address someone
 * owns. This catches the typo it can prove — no `@`, no dot after it — and
 * leaves the rest to the reply bouncing.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(field: FieldName, value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return REQUIRED_MESSAGE[field]
  if (field === 'email' && !EMAIL_PATTERN.test(trimmed)) {
    return 'That email address doesn’t look right.'
  }
  return undefined
}

const EMPTY_VALUES: Record<FieldName, string> = {
  firstName: '',
  lastName: '',
  email: '',
  reason: '',
  message: '',
}

export interface InquiryFormProps {
  /** The Reason dropdown's options, in the order the editor set. */
  reasons: readonly string[]
  /** The opt-in checkbox. Absent means no checkbox. */
  consentLabel?: string | null
  /**
   * The submit, as an ordinary button instance. An empty destination is what
   * keeps it a `<button>`; an editor who points it somewhere gets a link,
   * which is the same answer every other button gives.
   */
  button?: ButtonLinkData | null
  /**
   * The band's resolved surface — the submit's fill follows it. `Button`'s
   * `dark` variant is ink-on-white and disappears on an ink band, and a fill
   * is not something a schema enum should have to restate per placement.
   */
  surface: Surface
}

/** What the submit says when the document has not named it. */
const SUBMIT_LABEL = 'Send message'

/**
 * The inquiry form's controls and their client-side state.
 *
 * ⚠️ **THE SUBMIT PATH IS STUBBED — see #58.** This ticket built the fields
 * only; the mechanism (what receives a POST, and how spam is handled) and the
 * destination (inbox, CRM, storage) are both still open, and neither is
 * something a renderer gets to decide on the way past. So:
 *
 * - `onSubmit` calls `preventDefault()` unconditionally — that is the no-op,
 *   and it covers Enter in a text input as well as the button;
 * - the button is `aria-disabled` (focusable, so its notice is announced) and
 *   a visible notice above it says why. Both ride the control arm, so an
 *   editor who gives the submit a destination gets a link that goes there
 *   instead — which is a form with no submit, and visibly so;
 * - there is no success state, no optimistic message, and nothing that could
 *   be mistaken for "sent".
 *
 * A form that quietly discards what it collects is worse than no form. When
 * #58's other two halves land, this component gains a handler and loses the
 * notice — the fields, the labels and the validation stay as they are.
 */
export function InquiryForm({ reasons, consentLabel, button, surface }: InquiryFormProps) {
  const submit: ButtonLinkData = button?.label ? button : { ...(button ?? {}), label: SUBMIT_LABEL }

  const [values, setValues] = useState<Record<FieldName, string>>(EMPTY_VALUES)
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [consent, setConsent] = useState(false)

  const handleBlur =
    (field: FieldName) =>
    (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setErrors((previous) => ({ ...previous, [field]: validate(field, event.target.value) }))
    }

  const handleChange =
    (field: FieldName) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { value } = event.target
      setValues((previous) => ({ ...previous, [field]: value }))
      // Re-check only a field already showing an error. Validating as someone
      // types tells them their email is wrong at the third character, which
      // they knew.
      setErrors((previous) =>
        previous[field] ? { ...previous, [field]: validate(field, value) } : previous,
      )
    }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // #58: no handler, no destination. Nothing to send this to yet.
    event.preventDefault()
  }

  return (
    <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit}>
      {/* `gfield--width-half` on the live form: the two names share a row. */}
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField name="firstName" label="First name" required error={errors.firstName}>
          {(control) => (
            <input
              {...control}
              type="text"
              autoComplete="given-name"
              placeholder="Jane"
              className={FIELD_CONTROL_CLASS}
              value={values.firstName}
              onChange={handleChange('firstName')}
              onBlur={handleBlur('firstName')}
            />
          )}
        </FormField>

        <FormField name="lastName" label="Last name" required error={errors.lastName}>
          {(control) => (
            <input
              {...control}
              type="text"
              autoComplete="family-name"
              placeholder="Smith"
              className={FIELD_CONTROL_CLASS}
              value={values.lastName}
              onChange={handleChange('lastName')}
              onBlur={handleBlur('lastName')}
            />
          )}
        </FormField>
      </div>

      <FormField name="email" label="Email" required error={errors.email}>
        {(control) => (
          <input
            {...control}
            type="email"
            autoComplete="email"
            placeholder="jsmith@email.com"
            className={FIELD_CONTROL_CLASS}
            value={values.email}
            onChange={handleChange('email')}
            onBlur={handleBlur('email')}
          />
        )}
      </FormField>

      <FormField name="reason" label="Reason" required error={errors.reason}>
        {(control) => (
          // A native select, not a Radix one. ADR 0008 puts a component in
          // `ui/` only when shadcn supplies real behaviour, and here the
          // platform already does it better: a phone draws its own picker.
          <select
            {...control}
            className={FIELD_CONTROL_CLASS}
            value={values.reason}
            onChange={handleChange('reason')}
            onBlur={handleBlur('reason')}
          >
            <option value="">Please select…</option>
            {reasons.map((reason) => (
              // `value` is stega-cleaned, the visible child is not — and the
              // split is the point. In draft mode every string from Sanity
              // carries invisible stega characters so Presentation can map a
              // rendered word back to the field that wrote it; keeping them on
              // the child preserves click-to-edit. Keeping them on the VALUE
              // would mean the reason a submission carries silently differs
              // from the one an editor typed, on drafts only, invisibly —
              // which is the kind of thing found six months after the handler
              // in #58 lands rather than before it.
              <option key={stegaClean(reason)} value={stegaClean(reason)}>
                {reason}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField name="message" label="Message" required error={errors.message}>
        {(control) => (
          <textarea
            {...control}
            rows={6}
            className={FIELD_CONTROL_CLASS}
            value={values.message}
            onChange={handleChange('message')}
            onBlur={handleBlur('message')}
          />
        )}
      </FormField>

      {consentLabel ? (
        <div className="flex items-start gap-3">
          <input
            id="field-consent"
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="accent-brand mt-1 size-4 shrink-0"
          />
          <label htmlFor="field-consent" className="text-nav text-current/70">
            {consentLabel}
          </label>
        </div>
      ) : null}

      {/*
        The honest half of #58. Visible to everyone, and wired to the button as
        its description — `aria-disabled` rather than `disabled` so the button
        stays in the tab order and the description is actually announced when
        focus lands on it (a natively-disabled control is skipped, so its
        describedby is rarely read). The no-op is `onSubmit`'s unconditional
        `preventDefault`, not the attribute. Delete both when the handler lands.
      */}
      <div className="border-current/25 flex flex-col gap-4 border-t pt-6">
        <p id="form-not-connected" className="text-legal text-current/70">
          This form isn’t connected yet. Nothing you type here is sent anywhere — use the email or
          phone on this page and a person will answer.
        </p>
        <div>
          <ButtonLink
            button={submit}
            size="large"
            variant={surface === 'ink' ? 'light' : 'dark'}
            control={{
              type: 'submit',
              'aria-disabled': true,
              'aria-describedby': 'form-not-connected',
            }}
          />
        </div>
      </div>
    </form>
  )
}

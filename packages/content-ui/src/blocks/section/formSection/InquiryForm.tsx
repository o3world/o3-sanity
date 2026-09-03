'use client'

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from 'react'
// Never the `next-sanity` barrel — it drags in @portabletext/react, which
// cannot resolve under Storybook's Next preset. A lint rule enforces this.
import { stegaClean } from '@sanity/client/stega'

import { FIELD_CONTROL_CLASS, FormField } from '@o3/ui'
import { cn } from '@o3/ui/lib/utils'

import { ButtonLink } from '../../../ButtonLink'
import type { ButtonLinkData } from '../../../buttonDestination'

import {
  FAILED_MESSAGE,
  HONEYPOT_FIELD,
  INQUIRY_FIELDS,
  nativeSubmitFailed,
  SENT_MESSAGE,
  SENT_PARAM,
  validateField,
  validateInquiry,
  type InquiryField,
} from './inquiry'

const EMPTY_VALUES: Record<InquiryField, string> = {
  firstName: '',
  lastName: '',
  email: '',
  reason: '',
  message: '',
}

/** Where the card is in a submission: the fields, the wait, or the answer. */
export type FormStatus = 'idle' | 'submitting' | 'sent' | 'error'

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
   * Which state to open in. Stories only — a page always opens on `idle`, and
   * the schema has no field for this.
   */
  initialStatus?: FormStatus
}

/** What the submit says when the document has not named it. */
const SUBMIT_LABEL = 'Send message'

/** The app's own route, in both brands: a relative path resolves to its host. */
const ENDPOINT = '/api/contact'

/**
 * What an option posts: the editor's words, stega-cleaned and trimmed, which
 * is exactly what the route compares the submitted reason against.
 */
function optionValue(reason: string): string {
  return stegaClean(reason).trim()
}

/**
 * The inquiry form's controls, its validation and its submission (#412).
 *
 * The rules are `./inquiry`'s, which the app's `/api/contact` route reads too:
 * what this component shows beside a field is what the route enforces before
 * anything reaches HubSpot. Only the route's answer is authoritative — HubSpot
 * validates nothing.
 *
 * Two things a person never sees ride along with the values. An off-screen
 * text input a bot fills, and how long the form was open before it was sent:
 * a submission that trips either is dropped, and the answer is the same 200 a
 * real one gets.
 *
 * Only this component's own `fetch` delivers. The `method` and `action` below
 * catch a submit the browser resolves before the JavaScript arrives, and the
 * route refuses that shape and sends the person back here to try again.
 */
export function InquiryForm({
  reasons,
  consentLabel,
  button,
  initialStatus = 'idle',
}: InquiryFormProps) {
  const submit: ButtonLinkData = button?.label ? button : { ...(button ?? {}), label: SUBMIT_LABEL }

  const [values, setValues] = useState<Record<InquiryField, string>>(EMPTY_VALUES)
  const [errors, setErrors] = useState<Partial<Record<InquiryField, string>>>({})
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<FormStatus>(initialStatus)
  const mountedAt = useRef<number | null>(null)
  const honeypot = useRef<HTMLInputElement>(null)
  const form = useRef<HTMLFormElement>(null)

  // In an effect, not in state's initializer: the server render and the first
  // client render have to agree. What the submission carries is the difference
  // between this and the moment of the submit — both read here, so no clock is
  // compared with another.
  useEffect(() => {
    mountedAt.current = Date.now()

    // A submit that resolved before this component's JavaScript arrived is
    // refused by the route and sent back here carrying `sent=0`. The query
    // string is read from `window`, never from `useSearchParams`, because a
    // page that reads the search params renders per request and the contact
    // page is statically cached. The parameter is dropped again so a reload
    // does not re-show a failure that already happened.
    if (!nativeSubmitFailed(window.location.search)) return
    setStatus('error')
    const url = new URL(window.location.href)
    url.searchParams.delete(SENT_PARAM)
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  const handleBlur =
    (field: InquiryField) =>
    (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setErrors((previous) => ({ ...previous, [field]: validateField(field, event.target.value) }))
    }

  const handleChange =
    (field: InquiryField) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { value } = event.target
      setValues((previous) => ({ ...previous, [field]: value }))
      // Re-check only a field already showing an error. Validating as someone
      // types tells them their email is wrong at the third character, which
      // they knew.
      setErrors((previous) =>
        previous[field] ? { ...previous, [field]: validateField(field, value) } : previous,
      )
    }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'submitting') return

    const submission = {
      ...values,
      reasons: reasons.map(optionValue),
      ...(consentLabel ? { consent } : {}),
      honeypot: honeypot.current?.value ?? '',
      elapsedMs: mountedAt.current === null ? undefined : Date.now() - mountedAt.current,
    }

    const { ok, errors: found } = validateInquiry(submission)
    if (!ok) {
      setErrors(found)
      // The first invalid control in the order the card draws them, so focus
      // lands where reading would.
      const first = INQUIRY_FIELDS.find((field) => found[field])
      form.current?.querySelector<HTMLElement>(`#field-${first}`)?.focus()
      return
    }

    setStatus('submitting')
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(submission),
      })
      setStatus(response.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <p role="status" aria-live="polite" className="text-lead text-fg">
        {SENT_MESSAGE}
      </p>
    )
  }

  return (
    <form
      className="flex flex-col gap-5"
      // The submit the browser resolves on its own, before this component's
      // JavaScript arrives. Without them it GETs the page it is on and writes
      // every field into the address bar, the message included. The route
      // does not forward that post; it sends the person back here with the
      // failure notice and the values still in the fields.
      method="post"
      action={ENDPOINT}
      noValidate
      onSubmit={handleSubmit}
      ref={form}
    >
      {/* The two names share a row at BOTH frame widths — `2975:10198` is a
          horizontal row of two 131-wide fields inside a 282 card at 402, so
          this never stacks. */}
      <div className="grid grid-cols-2 gap-5">
        <FormField name="firstName" label="First name" required error={errors.firstName}>
          {(control) => (
            <input
              {...control}
              type="text"
              autoComplete="given-name"
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
            // 32px of right padding for the native chevron (`2960:7811`),
            // against the 20 every other control keeps.
            // 48 tall against the input's 46, and 32 of right pad for the
            // chevron (`2960:7811`).
            className={cn(FIELD_CONTROL_CLASS, 'h-12 pr-8')}
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
              // from the one an editor typed, on drafts only, invisibly — and
              // the route checks the reason against the list it was sent,
              // exactly, on trimmed values.
              <option key={optionValue(reason)} value={optionValue(reason)}>
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
            // 136px, not a row count — `textarea#c-msg` (`2960:7817`) is the
            // same height at both frame widths.
            className={cn(FIELD_CONTROL_CLASS, 'h-[136px] resize-y')}
            value={values.message}
            onChange={handleChange('message')}
            onBlur={handleBlur('message')}
          />
        )}
      </FormField>

      {/* The honeypot. Off-screen rather than `hidden`, because a bot reads
          the DOM and skips what is display:none; unlabelled, out of the tab
          order and hidden from the accessibility tree, so nobody who fills
          this form can reach it. A value here drops the submission. */}
      <input
        ref={honeypot}
        type="text"
        name={HONEYPOT_FIELD}
        defaultValue=""
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] size-px opacity-0"
      />

      {consentLabel ? (
        // `2960:7818`: a 16px box with a 2.5 radius, 13px from its label.
        <div className="flex items-start gap-[13px]">
          <input
            id="field-consent"
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="accent-brand border-fg-muted mt-0.5 size-4 shrink-0 rounded-[2.5px] border"
          />
          <label htmlFor="field-consent" className="text-fg-body text-[14px]/[16.8px]">
            {consentLabel}
          </label>
        </div>
      ) : null}

      <div className="border-current/25 flex flex-col border-t pt-6">
        {/*
          Always in the DOM, empty until there is something to say — the same
          rule `FormField`'s message follows. A live region that appears only
          when it has words was not live when the browser started watching it,
          so the first failure of a session goes unannounced. The values are
          still in the fields behind it, so the next press of the button is a
          retry rather than a re-typing.
        */}
        <p role="alert" className="text-legal text-current/70 [&:not(:empty)]:mb-4">
          {status === 'error' ? FAILED_MESSAGE : ''}
        </p>
        <div>
          <ButtonLink
            button={submit}
            size="large"
            control={{
              type: 'submit',
              // Busy, not gone: the button keeps its words and its place in
              // the tab order while the request is in flight, and a second
              // press is refused by `handleSubmit` rather than by the DOM.
              'aria-disabled': status === 'submitting',
            }}
          />
        </div>
      </div>
    </form>
  )
}

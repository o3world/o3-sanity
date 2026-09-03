/**
 * The inquiry form's field set, its validation and its submission, as pure
 * functions.
 *
 * Both the browser and the app's `/api/contact` route read this module, so a
 * rule lives once: the client shows the error, the route enforces it.
 * **The route's enforcement is the only one there is** — a probe submission
 * carrying an invalid address and a field name HubSpot had never heard of came
 * back `Thanks for submitting the form.` (#412). The forms endpoint validates
 * nothing.
 *
 * Nothing here reads `process.env`, `fetch` or a brand: the environment, the
 * fetch and the page's name all arrive as parameters, which is what lets a
 * unit test drive the whole submission without a network.
 */

/**
 * The field set, fixed in code.
 *
 * Transcribed from **Gravity Form 1**, the form WordPress served on
 * `/contact`: first name and last name at half width, email, a Reason
 * dropdown, a message, and a newsletter opt-in. Recovered from the live
 * markup rather than the extract — the WP extract records the module as
 * `{ acf_fc_layout: "form", form_id: "1" }` and never captured the fields.
 */
export type InquiryField = 'firstName' | 'lastName' | 'email' | 'reason' | 'message'

/** In the order the card draws them. */
export const INQUIRY_FIELDS: readonly InquiryField[] = [
  'firstName',
  'lastName',
  'email',
  'reason',
  'message',
]

/** Every one is `gfield_contains_required` on the live form. */
export const REQUIRED_MESSAGE: Record<InquiryField, string> = {
  firstName: 'Add your first name.',
  lastName: 'Add your last name.',
  email: 'Add your email address.',
  reason: 'Pick a reason.',
  message: 'Tell us what you need.',
}

export const EMAIL_MESSAGE = 'That email address doesn’t look right.'
export const REASON_MESSAGE = 'Pick one of the reasons listed.'

/**
 * Deliberately loose. A browser's own `type="email"` check is looser still,
 * and every stricter pattern on the internet rejects a real address someone
 * owns. This catches the typo it can prove — no `@`, no dot after it — and
 * leaves the rest to the reply bouncing.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** What the card says once the submission is HubSpot's. */
export const SENT_MESSAGE = 'Your message is with us. Someone on the team will read it and reply.'

/** What the card says when the send failed and the values are still there. */
export const FAILED_MESSAGE =
  'That didn’t send. Try again, or use the email on this page and a person will answer.'

/**
 * The off-screen input a person never sees. A bot that fills every input it
 * finds fills this one, and the submission is dropped.
 */
export const HONEYPOT_FIELD = 'website'

/**
 * How long a person takes to fill five fields, at the floor. Under this, the
 * form was filled by something that does not read.
 */
export const MINIMUM_FILL_MS = 3000

export interface InquiryInput {
  firstName?: string
  lastName?: string
  email?: string
  reason?: string
  message?: string
  /**
   * The opt-in. A boolean means the form drew the checkbox; absent means the
   * document set no `consentLabel`, so there was nothing to opt into.
   */
  consent?: boolean | null
  /** The options the form actually offered, so the reason can be checked. */
  reasons?: readonly string[] | null
  /** The honeypot's value, under whatever name the client posted it. */
  honeypot?: string | null
  /** When the form mounted, in ms since the epoch. */
  startedAt?: number | null
}

export interface InquiryValidation {
  ok: boolean
  errors: Partial<Record<InquiryField, string>>
}

/** A field's value as a trimmed string, whatever arrived over the wire. */
function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** One field's error, or `undefined` when it is fine. */
export function validateField(
  field: InquiryField,
  value: unknown,
  reasons?: readonly string[] | null,
): string | undefined {
  const trimmed = text(value)
  if (!trimmed) return REQUIRED_MESSAGE[field]
  if (field === 'email' && !EMAIL_PATTERN.test(trimmed)) return EMAIL_MESSAGE
  if (field === 'reason' && reasons?.length && !reasons.includes(trimmed)) return REASON_MESSAGE
  return undefined
}

/**
 * Every field at once — what the route runs, and what the client runs on
 * submit. An unknown reason is rejected against the list the form rendered,
 * which the client posts with the values; a caller that sends no list gets the
 * non-empty check alone.
 */
export function validateInquiry(input: InquiryInput): InquiryValidation {
  const errors: Partial<Record<InquiryField, string>> = {}
  for (const field of INQUIRY_FIELDS) {
    const error = validateField(field, input[field], input.reasons)
    if (error) errors[field] = error
  }
  return { ok: Object.keys(errors).length === 0, errors }
}

/**
 * The two checks a bot fails and a person does not: an off-screen input that
 * was filled, and five fields answered in under three seconds. Both are
 * silent — a caller that drops a submission answers as though it sent, so a
 * bot learns nothing from the reply.
 */
export function isSpam(input: InquiryInput, now: number): boolean {
  if (text(input.honeypot)) return true
  // No start time is a page restored from the back/forward cache or a tab
  // open since yesterday, not a bot. Only a time that is present and too
  // recent counts against a submission.
  if (typeof input.startedAt === 'number' && now - input.startedAt < MINIMUM_FILL_MS) return true
  return false
}

/** HubSpot's contact object. Every property this form writes is one. */
const CONTACT_OBJECT_TYPE = '0-1'

/** Our field name → the HubSpot property it writes. */
const HUBSPOT_PROPERTY: Record<InquiryField, string> = {
  firstName: 'firstname',
  lastName: 'lastname',
  email: 'email',
  reason: 'reason',
  message: 'message',
}

const CONSENT_PROPERTY = 'sign_up_for_mailing_list'

export interface HubSpotField {
  objectTypeId: string
  name: string
  value: string
}

export interface HubSpotSubmission {
  submittedAt: number
  fields: HubSpotField[]
  context: { pageUri?: string; pageName?: string; ipAddress?: string }
}

export interface SubmissionContext {
  /** The page the form was on. HubSpot's analytics read this, not the fields. */
  pageUri?: string
  pageName?: string
  /**
   * The visitor's address, for HubSpot's form analytics. It is a forwarded
   * header, so it is reported and never trusted — nothing here decides
   * anything by it.
   */
  ipAddress?: string
  now: number
}

/**
 * The forms API's payload. `pageUri` and `pageName` belong in `context`; sent
 * as fields they would be written to the contact as properties of those names.
 */
export function toHubSpotSubmission(
  input: InquiryInput,
  { pageUri, pageName, ipAddress, now }: SubmissionContext,
): HubSpotSubmission {
  const fields: HubSpotField[] = INQUIRY_FIELDS.map((field) => ({
    objectTypeId: CONTACT_OBJECT_TYPE,
    name: HUBSPOT_PROPERTY[field],
    value: text(input[field]),
  }))

  // Only when the document gave the checkbox a label: an opt-in nobody was
  // shown is not a "no" to record.
  if (typeof input.consent === 'boolean') {
    fields.push({
      objectTypeId: CONTACT_OBJECT_TYPE,
      name: CONSENT_PROPERTY,
      // The property is a checkbox, and the endpoint takes its value as a
      // string like every other.
      value: input.consent ? 'true' : 'false',
    })
  }

  const context: HubSpotSubmission['context'] = {}
  if (pageUri) context.pageUri = pageUri
  if (pageName) context.pageName = pageName
  if (ipAddress) context.ipAddress = ipAddress

  return { submittedAt: now, fields, context }
}

export interface InquiryEnv {
  HUBSPOT_PORTAL_ID?: string
  HUBSPOT_FORM_GUID?: string
}

export type InquiryStatus = 'sent' | 'invalid' | 'dropped' | 'unconfigured' | 'failed'

export interface InquiryResult {
  status: InquiryStatus
  errors?: Partial<Record<InquiryField, string>>
}

export interface SubmitInquiryOptions {
  input: InquiryInput
  env: InquiryEnv
  /** Injected, so a unit test drives the whole path with no network. */
  fetch: typeof globalThis.fetch
  now: number
  pageUri?: string
  pageName?: string
  ipAddress?: string
}

function endpoint(portalId: string, formGuid: string): string {
  return `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`
}

/**
 * One submission, from a parsed body to a status a route can answer with.
 *
 * The order is the point. Validation runs before anything is sent because
 * HubSpot accepts whatever it is given; the spam checks run before the
 * network so a bot costs nothing; and a failure never carries HubSpot's own
 * error body back out — that body names properties and portals, and the
 * person who filled the form can do nothing with it.
 */
export async function submitInquiry({
  input,
  env,
  fetch,
  now,
  pageUri,
  pageName,
  ipAddress,
}: SubmitInquiryOptions): Promise<InquiryResult> {
  const { ok, errors } = validateInquiry(input)
  if (!ok) return { status: 'invalid', errors }

  if (isSpam(input, now)) return { status: 'dropped' }

  const { HUBSPOT_PORTAL_ID: portalId, HUBSPOT_FORM_GUID: formGuid } = env
  if (!portalId || !formGuid) return { status: 'unconfigured' }

  try {
    const response = await fetch(endpoint(portalId, formGuid), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(toHubSpotSubmission(input, { pageUri, pageName, ipAddress, now })),
    })
    if (!response.ok) return { status: 'failed' }
    return { status: 'sent' }
  } catch {
    return { status: 'failed' }
  }
}

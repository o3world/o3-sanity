/**
 * The inquiry form's field set, its validation, its submission, and the whole
 * of what `/api/contact` answers.
 *
 * Both the browser and the app's `/api/contact` route read this module, so a
 * rule lives once: the client shows the error, the route enforces it. An app
 * route is `handleInquiryRequest` plus the one brand fact it owns, the page's
 * name.
 * **The route's enforcement is the only one there is** — a probe submission
 * carrying an invalid address and a field name HubSpot had never heard of came
 * back `Thanks for submitting the form.` (#412). The forms endpoint validates
 * nothing.
 *
 * Nothing here reads `process.env`, `fetch`, a clock or a brand: the
 * environment, the fetch, the time and the page's name all arrive as
 * parameters, and the types are web-standard `Request` and `Response`. That is
 * what lets a unit test drive a whole request without a network or a Next
 * import.
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
  /**
   * How long the form was open before it was submitted, in ms. The client
   * measures it against its own clock and sends the difference, so nothing
   * here compares a browser's time of day with a server's.
   */
  elapsedMs?: number | null
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
  if (field === 'reason') {
    // An exact match against the trimmed options, and only ever against an
    // array: `includes` on a string is a substring test, so a `reasons` that
    // arrived as one would let `Ventures` pass for `Ventures request`.
    const offered = Array.isArray(reasons) ? reasons.map(text) : []
    if (offered.length && !offered.includes(trimmed)) return REASON_MESSAGE
  }
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
 * A link, loosely and case-insensitively: either scheme, or the bare `www.`
 * host a spam message writes when it is avoiding one. Nothing here parses a
 * URL — the checks below only count how many there are and where.
 */
const URL_PATTERN = /https?:\/\/|www\./gi

/** How many links the message carries before it stops being a message. */
const MESSAGE_URL_LIMIT = 3

function urlCount(value: string): number {
  return value.match(URL_PATTERN)?.length ?? 0
}

function hasUrl(value: string): boolean {
  return urlCount(value) > 0
}

/**
 * What a bot's submission looks like and a person's does not.
 *
 * Five checks, all silent: a caller that drops a submission answers as though
 * it sent, so a bot learns nothing about which one it tripped.
 *
 * - the off-screen input was filled;
 * - the form was answered in under three seconds, or carries no elapsed time
 *   at all — the form always sends one, so its absence is a post nothing
 *   measured;
 * - a name carries a link;
 * - the message is a link and nothing else;
 * - the message carries three links or more.
 *
 * The last one has a floor rather than a ban because one or two links in a
 * sentence is how a person shows you their site.
 */
export function isSpam(input: InquiryInput): boolean {
  if (text(input.honeypot)) return true
  if (typeof input.elapsedMs !== 'number' || !Number.isFinite(input.elapsedMs)) return true
  if (input.elapsedMs < MINIMUM_FILL_MS) return true

  if (hasUrl(text(input.firstName)) || hasUrl(text(input.lastName))) return true

  const message = text(input.message)
  const words = message.split(/\s+/).filter(Boolean)
  if (words.length === 1 && hasUrl(words[0]!)) return true
  return urlCount(message) >= MESSAGE_URL_LIMIT
}

/**
 * A posted body as an `InquiryInput`, or `null` when it is not one.
 *
 * Nothing downstream may assume a shape a client chose, so this is the only
 * place a body becomes typed and it never casts: anything but a plain object
 * is refused, every text key is coerced to a trimmed string, and a `reasons`
 * that is not an array becomes no list rather than something `includes` can be
 * called on.
 */
export function parseInquiryInput(body: unknown): InquiryInput | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const source = body as Record<string, unknown>

  const input: InquiryInput = {
    firstName: text(source.firstName),
    lastName: text(source.lastName),
    email: text(source.email),
    reason: text(source.reason),
    message: text(source.message),
    honeypot: text(source.honeypot),
    reasons: Array.isArray(source.reasons) ? source.reasons.map(text) : [],
  }

  const elapsed = source.elapsedMs
  if (typeof elapsed === 'number' && Number.isFinite(elapsed)) input.elapsedMs = elapsed

  // Only when the key is there: a form that drew no checkbox posts none, and
  // an opt-in nobody was shown is not a "no" to record.
  if ('consent' in source) input.consent = Boolean(source.consent)

  return input
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
  /** BotID's verdict on the session that posted this. */
  bot?: boolean
}

/**
 * How long HubSpot gets to answer. Past this the submission is `failed`, which
 * the card offers as a retry — a request left hanging holds a serverless
 * invocation open for as long as the platform allows.
 */
const HUBSPOT_TIMEOUT_MS = 10_000

function endpoint(portalId: string, formGuid: string): string {
  return `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`
}

/**
 * One submission, from a parsed body to a status a route can answer with.
 *
 * The order is the point. BotID's verdict comes first, so a classified bot
 * gets no field-by-field reply to learn the rules from; validation runs before
 * anything is sent because HubSpot accepts whatever it is given; the content
 * checks run before the network so a bot costs nothing; and a failure never
 * carries HubSpot's own error body back out — that body names properties and
 * portals, and the person who filled the form can do nothing with it.
 */
export async function submitInquiry({
  input,
  env,
  fetch,
  now,
  pageUri,
  pageName,
  ipAddress,
  bot = false,
}: SubmitInquiryOptions): Promise<InquiryResult> {
  if (bot) return { status: 'dropped' }

  const { ok, errors } = validateInquiry(input)
  if (!ok) return { status: 'invalid', errors }

  if (isSpam(input)) return { status: 'dropped' }

  const { HUBSPOT_PORTAL_ID: portalId, HUBSPOT_FORM_GUID: formGuid } = env
  if (!portalId || !formGuid) return { status: 'unconfigured' }

  try {
    const response = await fetch(endpoint(portalId, formGuid), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(toHubSpotSubmission(input, { pageUri, pageName, ipAddress, now })),
      signal: AbortSignal.timeout(HUBSPOT_TIMEOUT_MS),
    })
    if (!response.ok) return { status: 'failed' }
    return { status: 'sent' }
  } catch {
    return { status: 'failed' }
  }
}

/**
 * Where a native, JavaScript-free submit is sent back to when the browser
 * named no referer.
 */
const FALLBACK_RETURN_PATH = '/contact'

export interface InquiryRequestOptions {
  env: InquiryEnv
  /** The brand fact: how this app's contact page names itself in HubSpot. */
  pageName?: string
  /** Injected, so a unit test drives a whole request with no network. */
  fetch?: typeof globalThis.fetch
  /** Injected for the same reason. */
  now?: () => number
  /**
   * Whether the referer is reported to HubSpot as the page the visitor was
   * on. HubSpot files a submission from a page on a domain its analytics
   * does not know as spam, and it never creates the contact, so only a host
   * HubSpot knows should say where it is. A preview or staging deployment
   * sends nothing and is filed like any other submission.
   */
  attributePage?: boolean
  /**
   * BotID's verdict, which the app route asks for because `checkBotId` reads
   * Vercel's own request context and this module reads no platform. The
   * classified session is dropped and answered as though it sent.
   *
   * Two things to know before testing it. Local development always reports
   * not-a-bot, so nothing here fires against `localhost`. And a deployed route
   * classifies `curl` as a bot, because the verdict rests on a challenge the
   * page's script runs — a real check means a `fetch` from the page itself.
   *
   * Basic only. Deep Analysis is a paid toggle in the Firewall dashboard and
   * is off.
   */
  bot?: boolean
}

/**
 * The visitor's address for HubSpot's form analytics. It is a header a client
 * can set, so it is reported and never trusted: nothing here decides anything
 * by it.
 */
function ipAddress(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded
  return request.headers.get('x-real-ip')?.trim() || undefined
}

/** The query a refused native post comes back on. */
export const SENT_PARAM = 'sent'
const NOT_SENT = '0'

/**
 * A native submit's answer: back to the page it came from, carrying the
 * failure and nothing else. The values never enter the URL.
 */
function returnToPage(request: Request): Response {
  const referer = request.headers.get('referer')
  let location: string
  try {
    const url = new URL(referer ?? '')
    url.searchParams.set(SENT_PARAM, NOT_SENT)
    location = url.toString()
  } catch {
    location = `${FALLBACK_RETURN_PATH}?${SENT_PARAM}=${NOT_SENT}`
  }
  return new Response(null, { status: 303, headers: { location } })
}

/**
 * Whether a page was loaded after a native post was refused, read from
 * `window.location.search` — a query string, so the card learns this without a
 * hook that would make the contact page render per request.
 */
export function nativeSubmitFailed(search: string): boolean {
  return new URLSearchParams(search).get(SENT_PARAM) === NOT_SENT
}

/**
 * One request, from either app's `/api/contact`, to the response it answers
 * with. Web-standard `Request` and `Response` throughout: an app route is a
 * line that names its brand and hands the request over.
 *
 * **Only JSON is delivered.** The card posts JSON and reads the status back.
 * A form-encoded body is what the browser sends when someone submits before
 * the page's JavaScript arrives — and it is the one shape a bot can post
 * directly, having run no script and measured nothing, so it is never
 * forwarded. It is answered with a redirect back to the page carrying
 * `sent=0`, which the hydrated card reads as the failure notice: the values
 * are still in the fields, and the next press is a retry over the path that
 * does deliver.
 *
 * A dropped submission answers exactly as a sent one does. The spam checks
 * are only worth having while a bot cannot tell which one it tripped.
 */
export async function handleInquiryRequest(
  request: Request,
  {
    env,
    pageName,
    fetch = globalThis.fetch,
    now = Date.now,
    attributePage = true,
    bot = false,
  }: InquiryRequestOptions,
): Promise<Response> {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return returnToPage(request)
  }

  let input: InquiryInput | null = null
  try {
    input = parseInquiryInput(await request.json())
  } catch {
    input = null
  }

  if (!input) return Response.json({ status: 'invalid' }, { status: 400 })

  const result = await submitInquiry({
    input,
    env,
    fetch,
    now: now(),
    pageUri: attributePage ? (request.headers.get('referer') ?? undefined) : undefined,
    pageName,
    ipAddress: ipAddress(request),
    bot,
  })

  switch (result.status) {
    case 'sent':
    case 'dropped':
      return Response.json({ status: 'sent' })
    case 'invalid':
      return Response.json({ status: 'invalid', errors: result.errors }, { status: 400 })
    case 'unconfigured':
      return Response.json({ status: 'unconfigured' }, { status: 503 })
    default:
      // HubSpot's own error body names properties and portals, and the person
      // who filled the form can do nothing with it. It stays here.
      return Response.json({ status: 'failed' }, { status: 502 })
  }
}

import { describe, expect, it } from 'vitest'

import {
  EMAIL_MESSAGE,
  handleInquiryRequest,
  HONEYPOT_FIELD,
  isSpam,
  MINIMUM_FILL_MS,
  parseInquiryInput,
  REASON_MESSAGE,
  submitInquiry,
  toHubSpotSubmission,
  validateInquiry,
} from './inquiry'

const REASONS = ['New business inquiry', 'Ventures request', 'Tech consultation']

/** Everything a person filled in correctly, so a test can spoil one field. */
function filled() {
  return {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    reason: 'Ventures request',
    message: 'We need a front door for the portal.',
    reasons: REASONS,
  }
}

describe('validateInquiry', () => {
  it('passes a filled-in inquiry', () => {
    expect(validateInquiry(filled())).toEqual({ ok: true, errors: {} })
  })

  it.each(['firstName', 'lastName', 'email', 'reason', 'message'] as const)(
    'names %s when it is blank',
    (field) => {
      const result = validateInquiry({ ...filled(), [field]: '   ' })
      expect(result.ok).toBe(false)
      expect(result.errors[field]).toBeTruthy()
    },
  )

  it('reports every blank field at once', () => {
    const result = validateInquiry({ reasons: REASONS })
    expect(Object.keys(result.errors).sort()).toEqual([
      'email',
      'firstName',
      'lastName',
      'message',
      'reason',
    ])
  })

  it('rejects an address with no @ and no dot after it', () => {
    expect(validateInquiry({ ...filled(), email: 'ada.example.com' }).errors.email).toBe(
      'That email address doesn’t look right.',
    )
  })

  it('rejects a reason the form never offered', () => {
    const result = validateInquiry({ ...filled(), reason: 'Free money' })
    expect(result.ok).toBe(false)
    expect(result.errors.reason).toBeTruthy()
  })

  it('rejects a reason that is only a prefix of one the form offered', () => {
    const result = validateInquiry({ ...filled(), reason: 'Ventures' })
    expect(result.errors.reason).toBe(REASON_MESSAGE)
  })

  it('accepts a reason whose option the editor typed with spaces round it', () => {
    expect(
      validateInquiry({ ...filled(), reason: 'Labs request', reasons: [' Labs request '] }).ok,
    ).toBe(true)
  })

  // `includes` on a string is a substring test, so a list that arrived as one
  // would let `Ventures` pass for `Ventures request` while claiming it matched.
  it('reads a reason list that is not an array as no list at all', () => {
    const result = validateInquiry({
      ...filled(),
      reason: 'Ventures',
      reasons: 'Ventures request' as unknown as string[],
    })
    expect(result.ok).toBe(true)
  })

  it('accepts any non-empty reason when the caller sends no options', () => {
    expect(validateInquiry({ ...filled(), reasons: undefined, reason: 'Anything' }).ok).toBe(true)
  })

  it('treats a non-string field as blank rather than throwing', () => {
    expect(validateInquiry({ ...filled(), email: 42 as unknown as string }).ok).toBe(false)
  })
})

describe('the spam checks', () => {
  it('names the honeypot and the fill time it enforces', () => {
    expect(HONEYPOT_FIELD).toBe('website')
    expect(MINIMUM_FILL_MS).toBe(3000)
  })
})

describe('isSpam', () => {
  it('drops a submission whose honeypot was filled', () => {
    expect(isSpam({ ...filled(), honeypot: 'http://x.example', elapsedMs: 60_000 })).toBe(true)
  })

  it('drops a submission filled in under the fill time', () => {
    expect(isSpam({ ...filled(), elapsedMs: 2_999 })).toBe(true)
  })

  it('keeps one filled in after it', () => {
    expect(isSpam({ ...filled(), elapsedMs: 3_000 })).toBe(false)
  })

  it('drops a submission with no elapsed time — the form always sends one', () => {
    expect(isSpam({ ...filled() })).toBe(true)
  })

  it('drops a submission whose elapsed time is not a finite number', () => {
    expect(isSpam({ ...filled(), elapsedMs: Number.NaN })).toBe(true)
    expect(isSpam({ ...filled(), elapsedMs: '9999' as unknown as number })).toBe(true)
  })
})

describe('parseInquiryInput', () => {
  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'x'],
    ['a number', 7],
  ])('refuses %s', (_label, body) => {
    expect(parseInquiryInput(body)).toBeNull()
  })

  it('reads a filled body, trimming every value', () => {
    expect(
      parseInquiryInput({
        firstName: '  Ada ',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        reason: ' Ventures request ',
        message: 'Hello.',
        reasons: [' Ventures request ', 'Tech consultation'],
        honeypot: '  ',
        elapsedMs: 9_000,
        consent: 1,
      }),
    ).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      reason: 'Ventures request',
      message: 'Hello.',
      reasons: ['Ventures request', 'Tech consultation'],
      honeypot: '',
      elapsedMs: 9_000,
      consent: true,
    })
  })

  it('reads a non-string field as blank rather than carrying it through', () => {
    const parsed = parseInquiryInput({ firstName: 42, message: { length: 1 } })
    expect(parsed?.firstName).toBe('')
    expect(parsed?.message).toBe('')
  })

  it('reads a reason list that is not an array as no list at all', () => {
    expect(parseInquiryInput({ reasons: { length: 1 } })?.reasons).toEqual([])
    expect(parseInquiryInput({ reasons: 'Ventures request' })?.reasons).toEqual([])
  })

  it('reads an elapsed time that is not a finite number as absent', () => {
    expect(parseInquiryInput({ elapsedMs: '9000' })?.elapsedMs).toBeUndefined()
    expect(parseInquiryInput({ elapsedMs: Number.POSITIVE_INFINITY })?.elapsedMs).toBeUndefined()
  })

  it('leaves the opt-in absent when the body carries no such key', () => {
    expect(parseInquiryInput({ firstName: 'Ada' })).not.toHaveProperty('consent')
  })
})

describe('toHubSpotSubmission', () => {
  const now = 1_770_000_000_000
  const context = { pageUri: 'https://o3world.com/contact', pageName: 'Contact — o3world.com', now }

  it('sends HubSpot’s field names, each as a contact property', () => {
    const payload = toHubSpotSubmission(filled(), context)
    expect(payload.submittedAt).toBe(now)
    expect(payload.fields).toEqual([
      { objectTypeId: '0-1', name: 'firstname', value: 'Ada' },
      { objectTypeId: '0-1', name: 'lastname', value: 'Lovelace' },
      { objectTypeId: '0-1', name: 'email', value: 'ada@example.com' },
      { objectTypeId: '0-1', name: 'reason', value: 'Ventures request' },
      { objectTypeId: '0-1', name: 'message', value: 'We need a front door for the portal.' },
    ])
  })

  it('puts the page in context, never in the fields', () => {
    const payload = toHubSpotSubmission(filled(), context)
    expect(payload.context).toEqual({
      pageUri: 'https://o3world.com/contact',
      pageName: 'Contact — o3world.com',
    })
    expect(payload.fields.map((field) => field.name)).not.toContain('pageUri')
  })

  it('carries the visitor’s address when the route found one', () => {
    const payload = toHubSpotSubmission(filled(), { ...context, ipAddress: '203.0.113.7' })
    expect(payload.context.ipAddress).toBe('203.0.113.7')
  })

  it('sends the opt-in as a string, both ways', () => {
    expect(toHubSpotSubmission({ ...filled(), consent: true }, context).fields.at(-1)).toEqual({
      objectTypeId: '0-1',
      name: 'sign_up_for_mailing_list',
      value: 'true',
    })
    expect(toHubSpotSubmission({ ...filled(), consent: false }, context).fields.at(-1)).toEqual({
      objectTypeId: '0-1',
      name: 'sign_up_for_mailing_list',
      value: 'false',
    })
  })

  it('omits the opt-in when the form drew no checkbox', () => {
    const names = toHubSpotSubmission(filled(), context).fields.map((field) => field.name)
    expect(names).not.toContain('sign_up_for_mailing_list')
  })
})

describe('submitInquiry', () => {
  const now = 1_770_000_000_000
  const env = {
    HUBSPOT_PORTAL_ID: '5879127',
    HUBSPOT_FORM_GUID: 'ca360116-0f4a-4e2b-bf12-888aec62dde9',
  }
  const ok = () => new Response('{}', { status: 200 })

  function call(overrides: Partial<Parameters<typeof submitInquiry>[0]> = {}) {
    return submitInquiry({
      input: { ...filled(), elapsedMs: 10_000 },
      env,
      fetch: async () => ok(),
      now,
      pageName: 'Contact — o3world.com',
      ...overrides,
    })
  }

  it('posts to the portal’s form and reports it sent', async () => {
    let seen: { url: string; init: RequestInit } | undefined
    const result = await call({
      fetch: async (url, init) => {
        seen = { url: String(url), init: init as RequestInit }
        return ok()
      },
    })

    expect(result).toEqual({ status: 'sent' })
    expect(seen?.url).toBe(
      'https://api.hsforms.com/submissions/v3/integration/submit/5879127/ca360116-0f4a-4e2b-bf12-888aec62dde9',
    )
    expect(seen?.init.method).toBe('POST')
    expect(JSON.parse(String(seen?.init.body)).fields[0].value).toBe('Ada')
  })

  it('refuses an invalid inquiry without calling HubSpot', async () => {
    let called = false
    const result = await call({
      input: { ...filled(), email: 'nope', elapsedMs: 10_000 },
      fetch: async () => {
        called = true
        return ok()
      },
    })

    expect(result.status).toBe('invalid')
    expect(result.errors?.email).toBe(EMAIL_MESSAGE)
    expect(called).toBe(false)
  })

  it('drops a spam submission without calling HubSpot', async () => {
    let called = false
    const result = await call({
      input: { ...filled(), elapsedMs: 100 },
      fetch: async () => {
        called = true
        return ok()
      },
    })

    expect(result).toEqual({ status: 'dropped' })
    expect(called).toBe(false)
  })

  it('says so when the portal is not configured', async () => {
    let called = false
    const result = await call({
      env: {},
      fetch: async () => {
        called = true
        return ok()
      },
    })

    expect(result).toEqual({ status: 'unconfigured' })
    expect(called).toBe(false)
  })

  it('fails on a non-2xx, and keeps HubSpot’s body to itself', async () => {
    const result = await call({
      fetch: async () => new Response('{"errors":[{"message":"secret"}]}', { status: 400 }),
    })
    expect(result).toEqual({ status: 'failed' })
  })

  it('fails when the request itself throws', async () => {
    const result = await call({
      fetch: async () => {
        throw new Error('ECONNRESET')
      },
    })
    expect(result).toEqual({ status: 'failed' })
  })
})

describe('handleInquiryRequest', () => {
  const now = 1_770_000_000_000
  const env = {
    HUBSPOT_PORTAL_ID: '5879127',
    HUBSPOT_FORM_GUID: 'ca360116-0f4a-4e2b-bf12-888aec62dde9',
  }
  const sent = async () => new Response('{}', { status: 200 })

  function post(body: unknown, headers: Record<string, string> = {}) {
    return new Request('https://o3world.com/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  }

  function form(fields: Record<string, string>, headers: Record<string, string> = {}) {
    const body = new FormData()
    for (const [name, value] of Object.entries(fields)) body.append(name, value)
    return new Request('https://o3world.com/api/contact', { method: 'POST', headers, body })
  }

  function handle(request: Request, overrides: Record<string, unknown> = {}) {
    return handleInquiryRequest(request, {
      env,
      pageName: 'Contact — o3world.com',
      fetch: sent,
      now: () => now,
      ...overrides,
    })
  }

  const good = { ...filled(), elapsedMs: 10_000 }

  it('answers 200 once the submission is HubSpot’s', async () => {
    const response = await handle(post(good))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'sent' })
  })

  it('carries the page and the visitor’s address into the payload', async () => {
    let body: string | undefined
    await handle(
      post(good, {
        referer: 'https://o3world.com/contact',
        'x-forwarded-for': '203.0.113.7, 10.0.0.1',
      }),
      {
        fetch: async (_url: string, init: RequestInit) => {
          body = String(init.body)
          return new Response('{}', { status: 200 })
        },
      },
    )
    expect(JSON.parse(String(body)).context).toEqual({
      pageUri: 'https://o3world.com/contact',
      pageName: 'Contact — o3world.com',
      ipAddress: '203.0.113.7',
    })
  })

  it.each([
    ['a body that is not JSON', '{'],
    ['null', null],
    ['an array', []],
    ['a bare string', '"x"'],
    ['a reason list that is not an array', { reasons: { length: 1 } }],
  ])('answers 400 to %s rather than throwing', async (_label, body) => {
    const response = await handle(post(body))
    expect(response.status).toBe(400)
    expect((await response.json()).status).toBe('invalid')
  })

  it('answers a dropped submission exactly as a sent one', async () => {
    const response = await handle(post({ ...good, elapsedMs: 100 }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'sent' })
  })

  it('answers 503 when the portal is not configured', async () => {
    const response = await handle(post(good), { env: {} })
    expect(response.status).toBe(503)
  })

  it('answers 502 when HubSpot refuses, keeping its body to itself', async () => {
    const response = await handle(post(good), {
      fetch: async () => new Response('{"errors":[{"message":"secret"}]}', { status: 400 }),
    })
    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain('secret')
  })

  describe('a form-encoded post — the browser’s own submit, before hydration', () => {
    const fields = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      reason: 'Ventures request',
      message: 'We need a front door for the portal.',
      elapsedMs: '10000',
    }

    it('sends the person back where they came from, with the answer in the query', async () => {
      const response = await handle(form(fields, { referer: 'https://o3world.com/contact' }))
      expect(response.status).toBe(303)
      expect(response.headers.get('location')).toBe('https://o3world.com/contact?sent=1')
    })

    it('falls back to /contact when the browser sent no referer', async () => {
      const response = await handle(form(fields))
      expect(response.headers.get('location')).toBe('/contact?sent=1')
    })

    it('reports a failed send in the same query, so nothing is silently lost', async () => {
      const response = await handle(form(fields, { referer: 'https://o3world.com/contact' }), {
        fetch: async () => new Response('', { status: 500 }),
      })
      expect(response.headers.get('location')).toBe('https://o3world.com/contact?sent=0')
    })

    // The whole reason the form names a method and an action: a submit the
    // browser resolves on its own would otherwise GET the page it is on and
    // write every field, the message included, into the address bar.
    it('sends an invalid post back with the answer alone, never the values', async () => {
      const response = await handle(form({ ...fields, email: 'nope' }))
      expect(response.status).toBe(303)
      expect(response.headers.get('location')).toBe('/contact?sent=0')
    })

    it('reads a checked opt-in as the opt-in', async () => {
      let body: string | undefined
      await handle(form({ ...fields, consent: 'on' }), {
        fetch: async (_url: string, init: RequestInit) => {
          body = String(init.body)
          return new Response('{}', { status: 200 })
        },
      })
      const names = JSON.parse(String(body)).fields.map((field: { name: string }) => field.name)
      expect(names).toContain('sign_up_for_mailing_list')
    })

    // No list rides along with a native post, so the reason is checked for
    // being there and not against options the request never carried.
    it('asks only that the reason is answered', async () => {
      const response = await handle(form({ ...fields, reason: 'Something the page offered' }))
      expect(response.headers.get('location')).toBe('/contact?sent=1')
    })

    // A submit before hydration has no script to count with, so a native post
    // is not timed. The honeypot still applies to it.
    it('sends a post with no elapsed time', async () => {
      let called = false
      const response = await handle(form({ ...fields, elapsedMs: '' }), {
        fetch: async () => {
          called = true
          return new Response('{}', { status: 200 })
        },
      })
      expect(response.headers.get('location')).toBe('/contact?sent=1')
      expect(called).toBe(true)
    })

    it('still drops a post that filled the honeypot', async () => {
      let called = false
      const response = await handle(form({ ...fields, [HONEYPOT_FIELD]: 'http://x.example' }), {
        fetch: async () => {
          called = true
          return new Response('{}', { status: 200 })
        },
      })
      expect(response.headers.get('location')).toBe('/contact?sent=1')
      expect(called).toBe(false)
    })
  })
})

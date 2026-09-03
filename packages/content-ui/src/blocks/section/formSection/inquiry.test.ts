import { describe, expect, it } from 'vitest'

import {
  EMAIL_MESSAGE,
  HONEYPOT_FIELD,
  isSpam,
  MINIMUM_FILL_MS,
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
  const now = 1_770_000_000_000

  it('drops a submission whose honeypot was filled', () => {
    expect(
      isSpam({ ...filled(), honeypot: 'http://x.example', startedAt: now - 60_000 }, now),
    ).toBe(true)
  })

  it('drops a submission sent under the fill time', () => {
    expect(isSpam({ ...filled(), startedAt: now - 2_999 }, now)).toBe(true)
  })

  it('keeps one sent after it', () => {
    expect(isSpam({ ...filled(), startedAt: now - 3_000 }, now)).toBe(false)
  })

  it('keeps a submission with no start time — an old tab, not a bot', () => {
    expect(isSpam({ ...filled() }, now)).toBe(false)
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
      input: { ...filled(), startedAt: now - 10_000 },
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
      input: { ...filled(), email: 'nope', startedAt: now - 10_000 },
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
      input: { ...filled(), startedAt: now - 100 },
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

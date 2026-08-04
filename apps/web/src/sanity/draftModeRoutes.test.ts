import { describe, expect, it, vi } from 'vitest'

import {
  disableDraftModeAndReturn,
  enableDraftModeForStudioSession,
  studioUsersMeUrl,
  verifyStudioToken,
  type DraftModeHandle,
} from './draftModeRoutes'

const PROJECT = 'naorcr6k'

/** A stand-in for Next's draft mode that records whether it was ever enabled. */
function draftModeSpy() {
  const handle: DraftModeHandle & { enabled: boolean; disabled: boolean } = {
    enabled: false,
    disabled: false,
    enable() {
      this.enabled = true
    },
    disable() {
      this.disabled = true
    },
  }
  return { handle, draftMode: () => Promise.resolve(handle) }
}

/** The Sanity `users/me` endpoint, answering with whatever the test says. */
function usersMe(status: number, body: unknown): typeof fetch {
  return vi.fn(async (input: Parameters<typeof fetch>[0]) => {
    expect(String(input)).toBe(studioUsersMeUrl(PROJECT))
    return new Response(JSON.stringify(body), { status })
  }) as unknown as typeof fetch
}

function enableRequest(body: unknown): Request {
  return new Request('https://o3world.com/api/draft-mode/enable', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('verifyStudioToken', () => {
  it('accepts a token the project-scoped API answers for, with roles', () => {
    const fetchImpl = usersMe(200, { id: 'p-abc', roles: [{ name: 'administrator' }] })
    return expect(verifyStudioToken('skREAL', { projectId: PROJECT, fetchImpl })).resolves.toBe(
      true,
    )
  })

  it('sends the token as a bearer credential', async () => {
    const fetchImpl = usersMe(200, { id: 'p-abc', roles: ['viewer'] })
    await verifyStudioToken('skREAL', { projectId: PROJECT, fetchImpl })
    const init = vi.mocked(fetchImpl).mock.calls[0]?.[1]
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer skREAL')
  })

  it('asks the PROJECT host, which is what makes this a membership check', () => {
    // The global api.sanity.io answers for any valid Sanity user; only
    // <projectId>.api.sanity.io rejects a session from another project.
    expect(studioUsersMeUrl(PROJECT)).toBe(`https://${PROJECT}.api.sanity.io/v2021-06-07/users/me`)
  })

  it('rejects a forged token (401 from Sanity)', () => {
    const fetchImpl = usersMe(401, { statusCode: 401, errorCode: 'SIO-401-ANF' })
    return expect(verifyStudioToken('skFORGED', { projectId: PROJECT, fetchImpl })).resolves.toBe(
      false,
    )
  })

  it('rejects the anonymous 200 — the endpoint answers `{}` with no auth', () => {
    // The trap this test exists for: `response.ok` alone fails OPEN here.
    const fetchImpl = usersMe(200, {})
    return expect(verifyStudioToken('skWHATEVER', { projectId: PROJECT, fetchImpl })).resolves.toBe(
      false,
    )
  })

  it('rejects an identity with no role in this project', () => {
    const fetchImpl = usersMe(200, { id: 'p-abc', roles: [] })
    return expect(verifyStudioToken('skOUTSIDER', { projectId: PROJECT, fetchImpl })).resolves.toBe(
      false,
    )
  })

  it('rejects an empty token without going near the network', async () => {
    const fetchImpl = usersMe(200, { id: 'p-abc', roles: ['viewer'] })
    expect(await verifyStudioToken('', { projectId: PROJECT, fetchImpl })).toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('fails closed when Sanity is unreachable', () => {
    const fetchImpl = vi.fn(() =>
      Promise.reject(new Error('ECONNREFUSED')),
    ) as unknown as typeof fetch
    return expect(verifyStudioToken('skREAL', { projectId: PROJECT, fetchImpl })).resolves.toBe(
      false,
    )
  })
})

describe('POST /api/draft-mode/enable', () => {
  it('enables draft mode for a verified Studio session', async () => {
    const { handle, draftMode } = draftModeSpy()
    const response = await enableDraftModeForStudioSession(enableRequest({ token: 'skREAL' }), {
      draftMode,
      verifyToken: () => Promise.resolve(true),
    })

    expect(response.status).toBe(200)
    expect(handle.enabled).toBe(true)
  })

  it('401s and does NOT enable draft mode for an unverifiable token', async () => {
    const { handle, draftMode } = draftModeSpy()
    const response = await enableDraftModeForStudioSession(enableRequest({ token: 'skFORGED' }), {
      draftMode,
      verifyToken: () => Promise.resolve(false),
    })

    expect(response.status).toBe(401)
    expect(handle.enabled).toBe(false)
  })

  it('401s and does NOT enable draft mode when no token is sent', async () => {
    const { handle, draftMode } = draftModeSpy()
    const verifyToken = vi.fn(() => Promise.resolve(true))

    for (const body of [{}, { token: '' }, { token: 42 }]) {
      const response = await enableDraftModeForStudioSession(enableRequest(body), {
        draftMode,
        verifyToken,
      })
      expect(response.status, `body ${JSON.stringify(body)} should be rejected`).toBe(401)
    }

    expect(handle.enabled).toBe(false)
    expect(verifyToken).not.toHaveBeenCalled()
  })

  it('401s on a body that is not JSON at all', async () => {
    const { handle, draftMode } = draftModeSpy()
    const request = new Request('https://o3world.com/api/draft-mode/enable', {
      method: 'POST',
      body: 'token=skREAL',
    })

    const response = await enableDraftModeForStudioSession(request, {
      draftMode,
      verifyToken: () => Promise.resolve(true),
    })

    expect(response.status).toBe(401)
    expect(handle.enabled).toBe(false)
  })
})

describe('GET /api/draft-mode/disable', () => {
  it('disables draft mode and returns to the page you were on', async () => {
    const { handle, draftMode } = draftModeSpy()
    const request = new Request(
      'https://o3world.com/api/draft-mode/disable?to=%2Finsights%3Fpage%3D3',
    )

    const response = await disableDraftModeAndReturn(request, { draftMode })

    expect(handle.disabled).toBe(true)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://o3world.com/insights?page=3')
  })

  it('is not an open redirect', async () => {
    const { draftMode } = draftModeSpy()
    const request = new Request('https://o3world.com/api/draft-mode/disable?to=%2F%2Fevil.example')

    const response = await disableDraftModeAndReturn(request, { draftMode })

    expect(response.headers.get('location')).toBe('https://o3world.com/')
  })

  it('falls back to the homepage with no ?to= at all', async () => {
    const { handle, draftMode } = draftModeSpy()
    const response = await disableDraftModeAndReturn(
      new Request('https://o3world.com/api/draft-mode/disable'),
      { draftMode },
    )

    expect(handle.disabled).toBe(true)
    expect(response.headers.get('location')).toBe('https://o3world.com/')
  })
})

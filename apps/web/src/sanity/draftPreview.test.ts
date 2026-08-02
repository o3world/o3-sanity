import { describe, expect, it } from 'vitest'

import {
  disableDraftModeHref,
  readStudioToken,
  safeReturnPath,
  shouldShowPreviewSwitcher,
  studioTokenStorageKey,
  type TokenStorage,
} from './draftPreview'

const PROJECT = 'naorcr6k'

function storage(entries: Record<string, string>): TokenStorage {
  return { getItem: (key) => entries[key] ?? null }
}

describe('readStudioToken', () => {
  it('reads the token Sanity Studio parks in localStorage', () => {
    const token = 'skTHISLOOKSLIKEATOKEN'
    expect(
      readStudioToken(
        storage({ [studioTokenStorageKey(PROJECT)]: JSON.stringify({ token }) }),
        PROJECT,
      ),
    ).toBe(token)
  })

  it('is scoped to the project — another project’s Studio is not this one', () => {
    const entries = { [studioTokenStorageKey('other000')]: JSON.stringify({ token: 'sk1' }) }
    expect(readStudioToken(storage(entries), PROJECT)).toBeNull()
  })

  it('returns null for every shape that is not a session', () => {
    const key = studioTokenStorageKey(PROJECT)
    // A cookie-authenticated Studio leaves the entry behind with no token.
    expect(readStudioToken(storage({ [key]: '{}' }), PROJECT)).toBeNull()
    expect(readStudioToken(storage({ [key]: JSON.stringify({ token: '' }) }), PROJECT)).toBeNull()
    expect(readStudioToken(storage({ [key]: 'not json' }), PROJECT)).toBeNull()
    expect(readStudioToken(storage({}), PROJECT)).toBeNull()
  })

  it('survives storage being unavailable rather than taking the page down', () => {
    // Safari private mode and blocked storage partitions both throw here.
    const hostile: TokenStorage = {
      getItem() {
        throw new Error('The operation is insecure.')
      },
    }
    expect(readStudioToken(hostile, PROJECT)).toBeNull()
    expect(readStudioToken(null, PROJECT)).toBeNull()
  })
})

describe('shouldShowPreviewSwitcher', () => {
  it('shows nothing to an anonymous visitor', () => {
    expect(
      shouldShowPreviewSwitcher({
        isDraft: false,
        hasStudioToken: false,
        isPresentationTool: null,
      }),
    ).toBe(false)
  })

  it('offers drafts to a Studio user reading published content', () => {
    expect(
      shouldShowPreviewSwitcher({ isDraft: false, hasStudioToken: true, isPresentationTool: null }),
    ).toBe(true)
  })

  it('offers the way out once draft mode is on, session token or not', () => {
    expect(
      shouldShowPreviewSwitcher({
        isDraft: true,
        hasStudioToken: false,
        isPresentationTool: false,
      }),
    ).toBe(true)
  })

  it('stays out of Presentation, which owns draft mode in its own frame', () => {
    expect(
      shouldShowPreviewSwitcher({ isDraft: true, hasStudioToken: true, isPresentationTool: true }),
    ).toBe(false)
  })

  it('waits for the presentation verdict rather than flashing inside it', () => {
    // `null` is the pre-handshake state; showing then hiding would be visible.
    expect(
      shouldShowPreviewSwitcher({ isDraft: true, hasStudioToken: true, isPresentationTool: null }),
    ).toBe(false)
  })
})

describe('safeReturnPath', () => {
  it('keeps a same-origin path, query and all', () => {
    expect(safeReturnPath('/perspectives?page=3')).toBe('/perspectives?page=3')
    expect(safeReturnPath('/')).toBe('/')
  })

  it('refuses anything a browser would resolve off-origin', () => {
    expect(safeReturnPath('//evil.example')).toBe('/')
    expect(safeReturnPath('/\\evil.example')).toBe('/')
    expect(safeReturnPath('https://evil.example')).toBe('/')
    expect(safeReturnPath('javascript:alert(1)')).toBe('/')
    expect(safeReturnPath('perspectives')).toBe('/')
  })

  it('refuses header smuggling and missing input', () => {
    expect(safeReturnPath('/ok\r\nSet-Cookie: a=b')).toBe('/')
    expect(safeReturnPath(null)).toBe('/')
    expect(safeReturnPath(undefined)).toBe('/')
  })
})

describe('disableDraftModeHref', () => {
  it('encodes the destination into the disable route', () => {
    expect(disableDraftModeHref('/work/acme?x=1')).toBe(
      '/api/draft-mode/disable?to=%2Fwork%2Facme%3Fx%3D1',
    )
  })

  it('sanitises before encoding, so a bad ?to= never reaches the server', () => {
    expect(disableDraftModeHref('//evil.example')).toBe('/api/draft-mode/disable?to=%2F')
  })
})

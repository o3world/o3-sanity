import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  browserTokenStorage,
  disableDraftModeHref,
  readStudioToken,
  shouldShowEditorToolbar,
  studioTokenStorageKey,
  type TokenStorage,
} from './draftPreview'

const PROJECT = 'naorcr6k'
const DISABLE_PATH = '/api/draft-mode/disable'

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

describe('browserTokenStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null where reading the property throws, rather than throwing', () => {
    // Chrome with cookies and site data blocked, and any sandboxed iframe
    // without `allow-same-origin`, throw on the *property access* — before
    // `readStudioToken` is entered and outside every guard inside it. Passing
    // `window.localStorage` as an argument expression is what took the whole
    // client tree down for an ordinary anonymous visitor.
    vi.stubGlobal('window', {
      get localStorage(): TokenStorage {
        throw new Error('Failed to read the localStorage property from Window: Access is denied.')
      },
    })
    expect(() => browserTokenStorage()).not.toThrow()
    expect(browserTokenStorage()).toBeNull()
    expect(readStudioToken(browserTokenStorage(), PROJECT)).toBeNull()
  })

  it('returns null on the server, where there is no window at all', () => {
    vi.stubGlobal('window', undefined)
    expect(browserTokenStorage()).toBeNull()
  })

  it('hands back the real storage when the browser allows it', () => {
    const entries = { [studioTokenStorageKey(PROJECT)]: JSON.stringify({ token: 'sk1' }) }
    vi.stubGlobal('window', { localStorage: storage(entries) })
    expect(readStudioToken(browserTokenStorage(), PROJECT)).toBe('sk1')
  })
})

describe('shouldShowEditorToolbar', () => {
  it('shows nothing to an anonymous visitor', () => {
    expect(
      shouldShowEditorToolbar({
        isDraft: false,
        hasStudioToken: false,
        isPresentationTool: null,
      }),
    ).toBe(false)
  })

  it('offers drafts to a Studio user reading published content', () => {
    expect(
      shouldShowEditorToolbar({ isDraft: false, hasStudioToken: true, isPresentationTool: null }),
    ).toBe(true)
  })

  it('offers the way out once draft mode is on, session token or not', () => {
    expect(
      shouldShowEditorToolbar({
        isDraft: true,
        hasStudioToken: false,
        isPresentationTool: false,
      }),
    ).toBe(true)
  })

  it('stays out of Presentation, which owns draft mode in its own frame', () => {
    expect(
      shouldShowEditorToolbar({ isDraft: true, hasStudioToken: true, isPresentationTool: true }),
    ).toBe(false)
  })

  it('waits for the presentation verdict rather than flashing inside it', () => {
    // `null` is the pre-handshake state; showing then hiding would be visible.
    expect(
      shouldShowEditorToolbar({ isDraft: true, hasStudioToken: true, isPresentationTool: null }),
    ).toBe(false)
  })
})

describe('disableDraftModeHref', () => {
  it('encodes the destination into the disable route', () => {
    expect(disableDraftModeHref(DISABLE_PATH, '/work/acme?x=1')).toBe(
      '/api/draft-mode/disable?to=%2Fwork%2Facme%3Fx%3D1',
    )
  })

  it('sanitises before encoding, so a bad ?to= never reaches the server', () => {
    expect(disableDraftModeHref(DISABLE_PATH, '//evil.example')).toBe(
      '/api/draft-mode/disable?to=%2F',
    )
  })

  it('takes the route from config — the path is the host app’s to name', () => {
    expect(disableDraftModeHref('/preview/off', '/')).toBe('/preview/off?to=%2F')
  })
})

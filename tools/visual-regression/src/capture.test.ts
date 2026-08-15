import { describe, expect, it } from 'vitest'

import { captureKey, shotFile, type Viewport } from './capture'

const MOBILE: Viewport = { name: 'mobile', width: 390, height: 844 }
const TALLER: Viewport = { name: 'mobile', width: 414, height: 896 }
const DESKTOP: Viewport = { name: 'desktop', width: 1440, height: 900 }

describe('captureKey', () => {
  it('separates two viewports that share a name but not a size', () => {
    // The bug it exists for: `shotFile` names both PNGs `<id>--mobile.png`, so
    // without this the second run reuses the first run's 390px screenshots and
    // calls every story changed.
    expect(shotFile('/shots', 'ui-button--primary', MOBILE.name)).toBe(
      shotFile('/shots', 'ui-button--primary', TALLER.name),
    )
    expect(captureKey([MOBILE], 200)).not.toBe(captureKey([TALLER], 200))
  })

  it('separates two runs that settled for different lengths of time', () => {
    expect(captureKey([MOBILE], 200)).not.toBe(captureKey([MOBILE], 800))
  })

  it('is stable for the same settings, so a baseline is reused', () => {
    expect(captureKey([MOBILE, DESKTOP], 200)).toBe(captureKey([MOBILE, DESKTOP], 200))
  })

  it('reads the set as ordered, because the captures are', () => {
    expect(captureKey([MOBILE, DESKTOP], 200)).not.toBe(captureKey([DESKTOP, MOBILE], 200))
  })

  it('is short enough and safe enough to be a directory name', () => {
    expect(captureKey([MOBILE, DESKTOP], 200)).toMatch(/^[0-9a-f]{8}$/)
  })
})

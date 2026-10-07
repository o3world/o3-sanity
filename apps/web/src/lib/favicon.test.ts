import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * `public/favicon.ico` is served for clients that request the path without
 * reading the `<link rel="icon">` tag. It is a static file, not an App Router
 * metadata file, so Next adds no second icon tag for it.
 */
const ico = readFileSync(fileURLToPath(new URL('../../public/favicon.ico', import.meta.url)))

describe('favicon.ico', () => {
  it('is an icon file holding 16, 32 and 48 pixel images', () => {
    expect(ico.readUInt16LE(0)).toBe(0)
    expect(ico.readUInt16LE(2)).toBe(1)
    const count = ico.readUInt16LE(4)
    const sizes = Array.from({ length: count }, (_, i) => ico.readUInt8(6 + 16 * i))
    expect(sizes).toEqual([16, 32, 48])
  })
})

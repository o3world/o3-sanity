import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * WCAG 2.2 AA 1.4.3 for the neutral text roles on every light surface: 4.5:1,
 * since each of them sets body-size copy somewhere (captions, eyebrows, card
 * dates). Read from the token file itself, so a new value is checked the
 * moment it is declared.
 *
 * Brand red as text is not held here: no single red reaches 4.5:1 on both
 * bone and ink, and which way it moves is a design call (OWSW-80).
 */
const COLOR_CSS = readFileSync(
  fileURLToPath(new URL('../../tailwind-config/tokens/color.css', import.meta.url)),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '')

const SURFACES = ['white', 'paper', 'bone'] as const
const ROLES = ['fg', 'fg-body', 'fg-muted', 'fg-quiet', 'fg-subtle'] as const

type Rgba = [number, number, number, number]

/** The value the first declaration of `--color-<name>` in the file gives — the `@theme` one. */
function token(name: string): string {
  const match = COLOR_CSS.match(new RegExp(`--color-${name}\\s*:\\s*([^;]+);`))
  if (!match) throw new Error(`--color-${name} is not declared`)
  return match[1]!.trim()
}

/** The light-surface override block's value for a role. */
function lightSurfaceValue(name: string): string {
  const block = COLOR_CSS.match(/\[data-surface='white'\][^{]*\{([^}]*)\}/)
  const match = block?.[1]?.match(new RegExp(`--color-${name}\\s*:\\s*([^;]+);`))
  if (!match) throw new Error(`the light-surface block does not re-declare --color-${name}`)
  return match[1]!.trim()
}

function parse(value: string): Rgba {
  const hex = value.match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    const n = parseInt(hex[1]!, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
  }
  const rgba = value.match(/^rgba?\(([^)]+)\)$/)
  if (rgba) {
    const [r, g, b, a = 1] = rgba[1]!.split(',').map(Number)
    return [r!, g!, b!, a]
  }
  throw new Error(`cannot read colour ${value}`)
}

function over([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1]
}

function luminance([r, g, b]: Rgba): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(text: string, ground: string): number {
  const bg = parse(ground)
  const [hi, lo] = [luminance(over(parse(text), bg)), luminance(bg)].sort((a, b) => b - a)
  return (hi! + 0.05) / (lo! + 0.05)
}

describe('neutral text roles on light surfaces', () => {
  for (const role of ROLES) {
    for (const surface of SURFACES) {
      it(`${role} reaches 4.5:1 on ${surface}`, () => {
        expect(contrast(token(role), token(surface))).toBeGreaterThanOrEqual(4.5)
      })
    }

    it(`${role} is re-declared at its own value on a light surface`, () => {
      expect(lightSurfaceValue(role)).toBe(token(role))
    })
  }
})

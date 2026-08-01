import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * The shadcn seam (ADR 0008).
 *
 * We take shadcn's ANATOMY — a Radix primitive, `cva`, `asChild`, `cn` — and
 * reject its PALETTE. shadcn assumes one background/foreground pair per theme;
 * this site puts three surfaces on one page at once and picks per section
 * block, so a single `--foreground` cannot mean "white on ink" and "#232323 on
 * bone" in the same document.
 *
 * That makes every component the CLI generates a DRAFT: it arrives referencing
 * `bg-background` / `text-muted-foreground` / `border-input`, none of which
 * exist in `@o3/tailwind-config`. Tailwind emits nothing for them, so an
 * untranslated component doesn't error — it renders unstyled, which reads as a
 * CSS bug rather than a skipped step. This test is what makes the translation
 * non-optional.
 */

const UI_DIR = fileURLToPath(new URL('.', import.meta.url))

/**
 * shadcn's default theme variables. Deliberately the token names, not a
 * general "unknown class" check — an unknown utility is usually a typo, while
 * one of these specifically means a generated component was never translated.
 */
const SHADCN_TOKENS = [
  'background',
  'foreground',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
]

/** `bg-primary`, `text-muted-foreground`, `hover:bg-accent/50`, `ring-ring/20`… */
const LEAK = new RegExp(
  `(?:^|["'\\s:])(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|shadow|accent|caret|decoration|placeholder)-(?:${SHADCN_TOKENS.join('|')})(?:/\\d+)?(?:$|["'\\s])`,
)

/**
 * The other escape route. `components.json` sets `cssVariables: true` on
 * purpose so untranslated output trips the check above — with it off the CLI
 * emits `bg-neutral-900` instead, which renders a plausible dark grey nobody
 * queries. The O3 palette is semantic (`ink`, `bone`, `on-ink-muted`), so a
 * numbered Tailwind palette class in the design system is always either
 * untranslated shadcn output or a colour picked by eye.
 */
const PALETTE = new RegExp(
  `(?:^|["'\\s:])(?:bg|text|border|ring|fill|stroke|from|via|to|divide|placeholder)-` +
    `(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-` +
    `(?:50|100|200|300|400|500|600|700|800|900|950)(?:/\\d+)?(?:$|["'\\s])`,
)

function sourceFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
    .filter((f) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'))
    .map((f) => join(dir, f))
}

describe('the shadcn seam', () => {
  const files = sourceFiles(UI_DIR)

  it('has components to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  /** Prose in a comment may legitimately name these — this file does. */
  function offendersFor(pattern: RegExp): string[] {
    const found: string[] = []
    for (const file of files) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
          if (pattern.test(code)) found.push(`${file.split('/ui/')[1]}:${i + 1} — ${line.trim()}`)
        })
    }
    return found
  }

  it('never lets a shadcn theme token reach a component', () => {
    const offenders = offendersFor(LEAK)
    expect(
      offenders,
      `shadcn theme tokens do not exist in @o3/tailwind-config and render as nothing.\nTranslate the generated component to O3 tokens (ADR 0008):\n  ${offenders.join('\n  ')}`,
    ).toEqual([])
  })

  it('never lets a raw Tailwind palette colour reach a component', () => {
    const offenders = offendersFor(PALETTE)
    expect(
      offenders,
      `The O3 palette is semantic — use ink / bone / on-ink-* rather than a numbered Tailwind colour (ADR 0008):\n  ${offenders.join('\n  ')}`,
    ).toEqual([])
  })
})

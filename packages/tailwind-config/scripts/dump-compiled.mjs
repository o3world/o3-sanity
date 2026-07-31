/*
 * Compile the theme exactly as an app does and dump the emitted CSS.
 *
 * This exists so a refactor of the theme's FILE LAYOUT can be proven not to
 * change what ships: capture the output before, capture it after, diff. A
 * split that reorders `@utility` blocks or drops an `@import` shows up as a
 * diff instead of as a visual regression three weeks later.
 *
 * Usage: node scripts/dump-compiled.mjs <entry.css> > out.css
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { compile } from 'tailwindcss'

const entry = resolve(process.argv[2] ?? 'theme.css')
const base = dirname(entry)

/** Every `@utility` name declared anywhere under the theme's directory, so the
 *  build emits the whole surface rather than whatever we remembered to list. */
function declaredUtilities(dir) {
  const names = new Set()
  for (const file of walk(dir)) {
    if (!file.endsWith('.css')) continue
    for (const m of readFileSync(file, 'utf8').matchAll(/@utility\s+([a-zA-Z0-9_-]+)/g)) {
      names.add(m[1])
    }
  }
  return [...names]
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

/* Utilities that only exist because `@theme` mapped a token into a Tailwind
 * namespace. They are the ones a broken `@theme` block would silently stop
 * emitting, so they belong in the comparison. One representative per token. */
const THEME_DERIVED = [
  'bg-brand',
  'bg-brand-tint',
  'bg-ink',
  'bg-ink-soft',
  'bg-bone',
  'bg-white',
  'text-fg',
  'text-fg-muted',
  'text-fg-subtle',
  'text-fg-inverse-muted',
  'text-brand',
  'text-brand-tint',
  'border-line',
  'border-line-soft',
  'font-sans',
  'font-display',
  'text-display-xl',
  'text-display-lg',
  'text-display-md',
  'text-hero',
  'text-eyebrow',
  'py-section-y',
  'mt-section-y',
  'max-w-content',
  'max-w-section',
  'rounded-btn',
  'rounded-card',
  'ease-out',
  'ease-mask',
  'hover:bg-brand',
  'hover:text-brand',
]

const candidates = [...new Set([...declaredUtilities(base), ...THEME_DERIVED])].sort()

const compiler = await compile(`@tailwind utilities;\n${readFileSync(entry, 'utf8')}`, {
  base,
  loadStylesheet: async (id, basedir) => {
    const path = resolve(basedir, id)
    return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
  },
})

process.stdout.write(compiler.build(candidates))

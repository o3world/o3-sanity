import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Project font-size utilities tailwind-merge cannot discover on its own.
 *
 * tailwind-merge ships a FIXED table of Tailwind's built-in scales. Under
 * Tailwind v4 our type scale lives in CSS — the theme-derived
 * `--text-display-*` / `--text-hero` / `--text-eyebrow` sizes — none of which
 * that table knows. An unknown `text-…` class falls into the same conflict
 * group as `text-<color>`, so `cn('text-display-xl', 'text-brand')` would
 * silently DROP the size and keep only the color. Registering them as
 * `font-size` restores the intended semantics: a size and a color are
 * ORTHOGONAL and must coexist, while two sizes still collapse to the last one.
 *
 * This list is hand-maintained because `cn` runs in the browser and cannot
 * read the CSS — so `utils.test.ts` derives the truth from typography.css and
 * fails on drift. It has to: the comment here used to say "keep in sync", #37
 * added seven steps, and the list kept the original five until the test
 * caught it.
 */
export const FONT_SIZE_UTILITIES = [
  'text-hero',
  'text-quote',
  'text-cta',
  'text-display-xl',
  'text-display-lg',
  'text-display-md',
  'text-display-sm',
  'text-lead',
  'text-body',
  'text-body-heading',
  'text-button',
  'text-eyebrow',
  'text-eyebrow-lg',
  'text-meta',
  'text-nav',
  'text-legal',
] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [...FONT_SIZE_UTILITIES],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

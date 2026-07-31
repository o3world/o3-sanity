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
 * Keep this list in sync with `packages/tailwind-config/tokens/typography.css`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-display-xl',
        'text-display-lg',
        'text-display-md',
        'text-hero',
        'text-eyebrow',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

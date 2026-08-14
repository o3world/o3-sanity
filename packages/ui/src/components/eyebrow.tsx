import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../lib/utils'

const eyebrowVariants = cva('block', {
  variants: {
    /**
     * The two steps the frames read at. `eyebrow` / `eyebrow-lg` are the
     * tailwind-config utilities bundling size, weight, tracking and the
     * uppercase transform (tokens/typography.css).
     */
    size: {
      /** 16px — the card-level kicker ("HEALTHCARE", `1883:3561`). */
      base: 'eyebrow',
      /** 18px — the section-level kicker ("OUR PARTNERS", `1864:2392`). */
      lg: 'eyebrow-lg',
    },
    tone: {
      // muted — #636363 (Figma `text/tertiary`). THE CANONICAL TREATMENT:
      // every section eyebrow on the canonical frames is this grey.
      muted: 'text-fg-muted',
      // inverse — plain white, for an eyebrow on an ink band or over a card
      // scrim (`1883:3561`, `1634:1183`). THE dark-surface treatment: no
      // canonical frame places a red accent on ink.
      inverse: 'text-white',
      // brand — the red kicker. Brand red is a flat fill exactly ONCE on the
      // canonical Home frame (the footer link-group headers), so this is the
      // exception rather than the default it used to be.
      brand: 'text-brand',
    },
  },
  // Flipped from `brand` in #42, the page layer that rebuilt the sections
  // these appear in. `docs/figma-components.md` recorded the old default as
  // contradicting every canonical frame; it turned out to have five call
  // sites, not the 52 the token pass estimated.
  defaultVariants: { size: 'base', tone: 'muted' },
})

export interface EyebrowProps
  extends HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof eyebrowVariants> {}

/**
 * The uppercase kicker above headings and inside cards — "OUR PARTNERS",
 * "HEALTHCARE · PEDIATRIC SYSTEMS". Margins are the call site's job.
 */
export function Eyebrow({ className, size, tone, ...props }: EyebrowProps) {
  return <p className={cn(eyebrowVariants({ size, tone }), className)} {...props} />
}

export { eyebrowVariants }

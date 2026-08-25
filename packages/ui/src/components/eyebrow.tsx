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
      /** 16 → 18px — the section-level kicker ("OUR PARTNERS", `1864:2392`). */
      lg: 'eyebrow-lg',
    },
    tone: {
      // muted — #636363 (Figma `text/tertiary`). THE CANONICAL TREATMENT:
      // every section eyebrow on the canonical frames is this grey.
      muted: 'text-fg-muted',
      // inverse — plain white, for an eyebrow on an ink band or over a card
      // scrim (`1883:3561`, `1634:1183`). One of two dark-surface treatments,
      // not the only one — see `brand`. The Case Study Card set (`2089:3963`)
      // is a third, in the deeper red, which that card names as a class rather
      // than a tone here: `--color-brand-deep` is O3's token alone and this
      // component is shared.
      inverse: 'text-white',
      // brand — the red kicker, #EB1000 (`2457:1854`). The 2026-08 hero sets
      // draw it on ink as well as on light: `Interior Hero`
      // (`I2101:861;2101:791`) and the case-study hero (`1710:2304`) both.
      // Still not the default — the section eyebrows on the canonical frames
      // are neutral grey.
      brand: 'text-brand',
      // ink — the near-black kicker (`2975:9554`). The rail's breakdown label
      // takes it where the same row's promise label takes `brand`, so the two
      // labels read as a pair rather than as text and heading.
      ink: 'text-ink',
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

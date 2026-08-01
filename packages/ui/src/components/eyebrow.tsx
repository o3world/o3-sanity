import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../lib/utils'

const eyebrowVariants = cva(
  // `eyebrow` is the tailwind-config @utility bundling the full kicker style:
  // 12px / 700 / 0.14em tracking / uppercase (tokens/typography.css).
  'eyebrow block',
  {
    variants: {
      tone: {
        // brand — the red kicker on light surfaces (insight-card categories,
        // footer column headers use the same red on ink for 11px labels).
        brand: 'text-brand',
        // tint — the lifted red for kickers ON dark surfaces (work-case
        // "Healthcare · Pediatric Systems").
        tint: 'text-brand-tint',
        // muted — the neutral kicker ("OUR PARTNERS", #636363 / Figma
        // `text/tertiary`, node 1864:2392). This is the CANONICAL treatment:
        // the frames set section eyebrows in grey, and use the red exactly
        // once on the whole Home page (the footer link headers).
        muted: 'text-fg-muted',
      },
    },
    // ⚠️ Still `brand`, which the canonical frames contradict — flipping the
    // default is a component-contract change across 52 call sites, so it
    // belongs to #38 rather than the token pass that corrected the colors.
    defaultVariants: { tone: 'brand' },
  },
)

export interface EyebrowProps
  extends HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof eyebrowVariants> {}

/**
 * The uppercase kicker above headings and inside cards — "OUR PARTNERS",
 * "HEALTHCARE · PEDIATRIC SYSTEMS". Margins are the call site's job.
 */
export function Eyebrow({ className, tone, ...props }: EyebrowProps) {
  return <p className={cn(eyebrowVariants({ tone }), className)} {...props} />
}

export { eyebrowVariants }

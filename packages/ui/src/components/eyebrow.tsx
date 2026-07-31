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
        // muted — the neutral kicker ("OUR PARTNERS", #838383 in the
        // prototype; fg-subtle is the closest token).
        muted: 'text-fg-subtle',
      },
    },
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

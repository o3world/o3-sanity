import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../lib/utils'

const statLabelVariants = cva('text-sm', {
  variants: {
    tone: {
      // default — muted label on light surfaces.
      default: 'text-fg-muted',
      // inverse — the work-case metric caption on ink ("fewer missed
      // appointments", #A4A4A4).
      inverse: 'text-fg-inverse-muted',
    },
  },
  defaultVariants: { tone: 'default' },
})

export interface StatProps
  extends HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof statLabelVariants> {
  /** The headline figure — a string so "89% → 114%" and "2.3×" both work. */
  value: string
  label: string
}

/**
 * Big light number + muted label, baseline-aligned with a 14px gap — the
 * work-case metric line ("41% fewer missed appointments").
 */
export function Stat({ value, label, tone, className, ...rest }: StatProps) {
  return (
    <p className={cn('flex items-baseline gap-3.5', className)} {...rest}>
      <span className="text-[clamp(34px,3.6vw,52px)] font-light tracking-[-0.02em]">{value}</span>
      <span className={statLabelVariants({ tone })}>{label}</span>
    </p>
  )
}

export { statLabelVariants }

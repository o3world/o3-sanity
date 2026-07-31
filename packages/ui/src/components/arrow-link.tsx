import type { AnchorHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../lib/utils'
import { ArrowIcon } from './arrow-icon'

const arrowLinkVariants = cva(
  // Anatomy from every prototype text CTA ("See all partners", "Read the
  // case"): inline-flex, 8px gap, 15px/600 label + the arrow.
  'inline-flex items-center gap-2 text-[15px] font-semibold transition-colors duration-(--duration-hover) ease-out',
  {
    variants: {
      tone: {
        // default — light-surface links: fg ink, brand red on hover
        // (prototype `a{color:#030303}` / `a:hover{color:#EB1000}`; the CTA
        // rows use #232323 = fg).
        default: 'text-fg hover:text-brand',
        // tint — links ON dark surfaces ("Read the case" in the work cards).
        tint: 'text-brand-tint hover:text-white',
        // inverse — plain white links on ink (footer nav).
        inverse: 'text-white hover:text-brand-tint',
      },
    },
    defaultVariants: { tone: 'default' },
  },
)

export interface ArrowLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>, VariantProps<typeof arrowLinkVariants> {}

/** Text link + inline O3 arrow — the prototype's tertiary CTA. */
export function ArrowLink({ className, tone, children, ...props }: ArrowLinkProps) {
  return (
    <a className={cn(arrowLinkVariants({ tone }), className)} {...props}>
      {children}
      <ArrowIcon />
    </a>
  )
}

export { arrowLinkVariants }

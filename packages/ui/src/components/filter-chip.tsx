import type { AnchorHTMLAttributes } from 'react'
import { Slot as SlotPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../lib/utils'

/**
 * The filter bar's chip, from Figma's `Button` set (`2134:1785`) as the
 * Insights index instances it (`2337:4542` selected, `2337:4551` not) — #61.
 *
 * ```
 * 12px 16px, gap 12, radius 5 (`--radius-btn`), label 18/24 Figtree Medium
 *   selected   #0A0A0B fill, white label          Theme=Black
 *   default    white fill, 1px #76746F, #55524E   Theme=White
 * ```
 *
 * ## Why this is not `Button`
 *
 * Not geometry: `Button` is built to this same set and draws the same
 * `--radius-btn` at the same 12px 16px. What separates them is behaviour.
 *
 * A chip is a **link** with a selected state — it navigates, and the selected
 * one is the page you are on — so it takes `aria-current` rather than a
 * `disabled`, and its selected state is a fact about the URL rather than a
 * variant an author picks. Its states follow from that: the chip hovers to ink,
 * where the set's buttons hover to brand red, because a filter that has to be
 * read as a row of options cannot flare red under the pointer.
 *
 * `Theme=Black | White` is the Figma axis and `selected` is the cva key: one
 * axis, one key. The name follows the job, because both themes appear here as
 * the same control in its two states rather than as two controls.
 *
 * ```tsx
 * <FilterChip asChild selected={active}>
 *   <Link href="/insights?category=design">Design</Link>
 * </FilterChip>
 * ```
 */
const filterChipVariants = cva(
  'inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-btn text-button transition-colors duration-(--duration-hover) ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 px-4 py-3',
  {
    variants: {
      selected: {
        // Theme=Black (2337:4542) — the chip for the category being shown.
        true: 'bg-ink text-white',
        /*
         * Theme=White (2337:4551). Both of the chip's own colours are on the
         * ramp: the label is `fg-body` — the warm dark grey the 2026-08 frames
         * set body copy in — and the stroke is the `fg-muted` the card meta
         * uses.
         */
        false:
          'bg-white text-fg-body border border-fg-muted hover:bg-ink hover:text-white hover:border-ink',
      },
    },
    defaultVariants: { selected: false },
  },
)

export interface FilterChipProps
  extends
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color'>,
    VariantProps<typeof filterChipVariants> {
  /**
   * Render the caller's child instead of an `<a>` — the way a `next/link`
   * gets the chip's appearance without this package importing Next.
   */
  asChild?: boolean
}

export function FilterChip({ className, selected, asChild = false, ...props }: FilterChipProps) {
  const Comp = asChild ? SlotPrimitive.Slot : 'a'
  return (
    <Comp
      className={cn(filterChipVariants({ selected }), className)}
      aria-current={selected ? 'page' : undefined}
      {...props}
    />
  )
}

export { filterChipVariants }

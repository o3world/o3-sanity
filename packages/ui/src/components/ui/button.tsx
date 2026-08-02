import * as React from 'react'
import { Slot as SlotPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@o3/ui/lib/utils'
import { ArrowIcon } from '../arrow-icon'

/**
 * Realigned to Figma's `Button / Solid` (`136:754`) and `Button / Ghost`
 * (`264:260`) — the divergence `docs/figma-components.md` recorded and handed
 * to #42, because the variant vocabulary is also the `cta.variant` schema enum.
 *
 * | Axis    | Figma                                | Here                          |
 * | ------- | ------------------------------------ | ----------------------------- |
 * | Size    | `Base` \| `Large`                    | `size: base \| large`         |
 * | Fill    | Solid `#0A0A0A` / `#FFFFFF`, Ghost   | `variant: dark \| light \| ghost` |
 * | State   | `Default` \| `Hover`                 | a `hover:` utility, never a variant |
 *
 * Fill is not a Figma *axis* — `Solid` ships one fill per band and `Ghost` is
 * its own set. The frames pick between them by what the button sits on, so
 * they collapse into one cva key here (ADR 0008: shadcn's anatomy, O3's
 * tokens). **There is no red button on the canonical Home frame**; the old
 * `brand` fill is gone rather than kept on a hunch, and brand red now reaches
 * the page only as a gradient.
 */
const buttonVariants = cva(
  // `1868:3262`: inline-flex, 8px gap to the arrow, radius 0 (rounded-btn
  // resolves to 0), label 18/24 Figtree Medium (`--text-button`).
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn text-button transition-colors duration-(--duration-hover) ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Solid on a light band — `#0A0A0A` with a white label (1864:2405).
        dark: 'bg-ink text-white hover:bg-ink/85',
        // Solid on ink, over a card scrim, or in the nav pill — `#FFFFFF`
        // with an ink label (1868:3262, 1680:2090, 1710:2250).
        light: 'bg-white text-ink hover:bg-surface-muted',
        // `Button / Ghost` (264:260) — no fill, label follows the band.
        ghost: 'bg-transparent text-current hover:opacity-70',
      },
      size: {
        // Base — 8px 20px. Hero, CTA band, in-card.
        base: 'px-5 py-2',
        // Large — 12px 20px. Section headers, platform panels.
        large: 'px-5 py-3',
      },
    },
    defaultVariants: {
      variant: 'dark',
      size: 'base',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /**
   * Append the O3 arrow after the label. A **prop, not a variant**: Figma's
   * `Show right icon` toggles the presence of a child rather than the button's
   * appearance (#38). Ignored with `asChild` — put an `<ArrowIcon />` inside
   * your child instead (Radix Slot accepts exactly one child element).
   */
  arrow?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  arrow = false,
  children,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? SlotPrimitive.Slot : 'button'
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
      {asChild ? (
        children
      ) : (
        <>
          {children}
          {arrow ? <ArrowIcon /> : null}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }

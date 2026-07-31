import * as React from 'react'
import { Slot as SlotPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@o3/ui/lib/utils'
import { ArrowIcon } from '../arrow-icon'

const buttonVariants = cva(
  // Anatomy from the prototype CTAs (`.o3btn`): inline-flex, 8px gap to the
  // arrow, 6px radius (rounded-btn token), 15px/600 label.
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-btn text-[15px] font-semibold transition-colors duration-(--duration-hover) ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Prototype `.o3btn:hover{background:#D5D5D5}` — both filled buttons
        // settle to the same neutral gray on hover. The prototype leaves the
        // brand button's label white on that gray; we flip it to ink so the
        // label stays legible (deliberate a11y deviation).
        brand: 'bg-brand text-white hover:bg-[#D5D5D5] hover:text-ink',
        inverse: 'bg-white text-ink hover:bg-[#D5D5D5]',
        // No ghost button exists in the prototype; a transparent fill with a
        // currentColor wash keeps it legible on all three surfaces.
        ghost: 'bg-transparent text-current hover:bg-current/10',
      },
      size: {
        // sm — the "Our Work" header CTA (12px 18px padding, 14px label).
        sm: 'px-[18px] py-3 text-sm',
        // default — the nav "Let's talk" (11px 18px padding).
        default: 'px-[18px] py-[11px]',
        // lg — the hero "View our work" (13px 20px padding).
        lg: 'px-5 py-[13px]',
      },
    },
    defaultVariants: {
      variant: 'brand',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /**
   * Append the O3 arrow after the label (the prototype's default CTA shape).
   * Ignored with `asChild` — put an `<ArrowIcon />` inside your child instead
   * (Radix Slot accepts exactly one child element).
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

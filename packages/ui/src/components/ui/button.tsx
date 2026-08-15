import * as React from 'react'
import { Slot as SlotPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@o3/ui/lib/utils'

/**
 * Figma's `Button` set (`2134:1785`), which every redesigned frame instances.
 *
 * | Axis  | Figma                            | Here                                |
 * | ----- | -------------------------------- | ----------------------------------- |
 * | Theme | `Black` \| `White`               | `variant: dark \| light`            |
 * | State | `Default` … `Disabled`           | `hover:` / `disabled:` utilities    |
 * | Icon  | `Show Trailing Icon?`            | the `icon` slot, filled or empty    |
 *
 * `ghost` is the one fill that set does not draw — it is `Button / Ghost`
 * (`264:260`), unfilled, taking the band's ink. It carries the same geometry
 * so the three fills read as one button (ADR 0008: shadcn's anatomy, O3's
 * tokens).
 *
 * **Size is authored, not read.** The set draws a single geometry at both
 * frame widths, so `base` is that geometry and `large` is this repo's step
 * above it for a section-level CTA: 4px more vertical padding, nothing else.
 */
const buttonVariants = cva(
  // `2134:1785`: inline-flex, 12px gap to the icon, radius 2 (`--radius-btn`),
  // label 18/24 Figtree Medium (`--text-button`). Height is hug — 48px at
  // `base` falls out of the padding and the label's leading, so nothing sets
  // one.
  //
  // Tracking is the button's own, not the token's. `--text-button` is 18/24/500
  // with no tracking, which is what the nav `Link` set (`2225:2894`) draws and
  // what every other borrower of `text-button` renders; the `Button` label
  // (`2134:1789`) alone carries `0.01em`. One of the two has to be the literal,
  // and it is the smaller set.
  'inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-btn text-button tracking-[0.01em] transition-colors duration-(--duration-hover) ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Theme=Black (2134:1786) — `#0A0A0B` with a white label.
        dark: 'bg-ink text-white hover:bg-ink/85',
        // Theme=White (2205:1298) — `#FFFFFF` with an ink label. The CTA band
        // (2336:4351) and the nav pill (2225:2877) both instance it.
        light: 'bg-white text-ink hover:bg-surface-muted',
        // `Button / Ghost` (264:260) — no fill, label follows the band.
        ghost: 'bg-transparent text-current hover:opacity-70',
      },
      size: {
        // The set's own 12px 16px. Hero, CTA band, nav pill, in-card.
        base: 'px-4 py-3',
        // Section headers and platform panels.
        large: 'px-4 py-4',
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
   * **The icon slot** — a rendered area after the label that the parent fills
   * (CONTEXT.md → Component, instance, slot). The button decides where the
   * glyph sits and what colour it takes; what glyph it is, is the parent's to
   * say, and the content layer says it from an editor's choice.
   *
   * Trailing only. Figma's set carries `Show Leading Icon` too, and every
   * canonical instance sets it `false`, so there is no leading area to fill and
   * no prop for one.
   *
   * Ignored with `asChild` — the replaced element takes the whole of the
   * button's inside, and Radix Slot accepts exactly one child, so a filled slot
   * would have nowhere to go. Put the glyph inside your child instead.
   */
  icon?: React.ReactNode
  ref?: React.Ref<HTMLButtonElement>
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  icon,
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
          {icon}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }

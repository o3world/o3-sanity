import * as React from 'react'
import { Slot as SlotPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@o3/ui/lib/utils'

/**
 * The four states the set draws, and it draws each one the same on every theme:
 * hover fills `--color-brand` (variable `2050:1200`), focus `--color-btn-focus`
 * (`2134:1804`), press `--color-btn-press` (`2205:1310`), disabled
 * `--color-btn-disabled` under `--color-btn-disabled-fg` (`2134:1810`,
 * `2134:2038`, `2205:1322`). So they are a shared string rather than four lines
 * in each theme's variant.
 *
 * The label flips with the fill because three of the four fills are the
 * opposite lightness from the theme's own — a `light` button hovering to brand
 * red would otherwise keep its ink label. Every role named here is one whose
 * value is fixed: `fg-muted` carries the disabled label's #76746F too, but it
 * inverts to white at 65% inside a dark band while the plate under it does not,
 * which is why the pair is its own role.
 *
 * Tailwind orders these variants `hover` → `focus-visible` → `active` →
 * `disabled`, so a disabled button wins outright without being written `!`.
 * `focus-visible` landing after `active` is why keyboard activation shows the
 * focus fill rather than the press one; the press fill is the pointer's.
 *
 * `ghost` is not in the set and keeps its own — an unfilled button that grows a
 * grey plate when it is pressed is a different control, not this one.
 */
const SET_STATES =
  'hover:bg-brand hover:text-white focus-visible:bg-btn-focus focus-visible:text-white active:bg-btn-press active:text-ink disabled:bg-btn-disabled disabled:text-btn-disabled-fg aria-disabled:bg-btn-disabled aria-disabled:text-btn-disabled-fg'

/**
 * Figma's `Button` set (`2134:1785`), which every redesigned frame instances.
 *
 * | Axis  | Figma                            | Here                                |
 * | ----- | -------------------------------- | ----------------------------------- |
 * | Theme | `Black` \| `White`               | `variant: dark \| light`            |
 * | State | `Default` … `Disabled`           | `SET_STATES`, above                 |
 * | Icon  | `Show Trailing Icon?`            | the `icon` slot, filled or empty    |
 *
 * `Theme=Red` is the set's third fill and no frame instances it (#134), so it
 * has no variant here.
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
  // `2134:1785`: inline-flex, 12px gap to the icon, radius 5 (`--radius-btn`),
  // label 18/24 Figtree Medium (`--text-button`). Height is hug — 48px at
  // `base` falls out of the padding and the label's leading, so nothing sets
  // one.
  //
  // Tracking is the button's own, not the token's. `--text-button` is 18/24/500
  // with no tracking, which is what the nav `Link` set (`2225:2894`) draws and
  // what every other borrower of `text-button` renders; the `Button` label
  // (`2134:1789`) alone carries `0.01em`. One of the two has to be the literal,
  // and it is the smaller set.
  // `w-fit` because the set hugs its label at every instance, and this element
  // is now the styled one on both arms — as a grid or flex child its
  // `inline-flex` is blockified to `flex` and it would stretch to the track.
  //
  // `max-w-full` AND NO `whitespace-nowrap`, which is the pair (#181). The set
  // draws no label long enough to need a second line, so the frame answers
  // nothing here — but an authored one does: "Attend the 1682 conference on
  // October 8" is 13px wider than a 390px viewport, and a label that cannot
  // break took the band and the document sideways with it. `w-fit` still hugs
  // the label everywhere it fits, so the only button that wraps is one whose
  // label is wider than the space it was given. The icon stays a flex item
  // beside the whole label, centred on it.
  'inline-flex w-fit max-w-full items-center justify-center gap-3 rounded-btn text-button tracking-[0.01em] transition-colors duration-(--duration-hover) ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none aria-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Theme=Black (2134:1786) — `#0A0A0B` with a white label.
        dark: `bg-ink text-white ${SET_STATES}`,
        // Theme=White (2205:1298) — `#FFFFFF` with an ink label. The CTA band
        // (2336:4351) and the nav pill (2225:2877) both instance it.
        light: `bg-white text-ink ${SET_STATES}`,
        // `Button / Ghost` (264:260) — no fill, label follows the band.
        ghost:
          'bg-transparent text-current hover:opacity-70 disabled:opacity-50 aria-disabled:opacity-50',
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

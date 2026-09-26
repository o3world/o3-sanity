import * as React from 'react'
import { Slot as SlotPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@o3/ui/lib/utils'

/** Figma 2134:1785: Theme maps to variant; Style maps to appearance. */
const buttonVariants = cva(
  'inline-flex w-fit max-w-full items-center justify-center gap-3 rounded-btn text-button tracking-[0.01em] transition-colors duration-(--duration-hover) ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--button-focus) focus-visible:shadow-[0_0_4px_var(--button-focus)] disabled:pointer-events-none disabled:text-btn-disabled-fg aria-disabled:pointer-events-none aria-disabled:text-btn-disabled-fg [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        dark: '[--button-bg:var(--color-ink)] [--button-fg:var(--color-white)] [--button-hover:var(--color-btn-neutral-hover)] [--button-press:var(--color-utility)] [--button-focus:var(--color-line)] [--button-disabled:var(--color-btn-disabled-dark)] [--button-wash-hover:var(--color-bone-soft)] [--button-wash-press:var(--color-bone)]',
        light:
          '[--button-bg:var(--color-white)] [--button-fg:var(--color-ink)] [--button-hover:var(--color-bone-soft)] [--button-press:var(--color-bone)] [--button-focus:var(--color-on-utility)] [--button-disabled:var(--color-btn-disabled-light)] [--button-wash-hover:var(--color-btn-disabled-dark)] [--button-wash-press:var(--color-btn-inverse-press)]',
        brand:
          '[--button-bg:var(--color-brand)] [--button-fg:var(--color-white)] [--button-hover:var(--color-brand-deep)] [--button-press:var(--color-btn-brand-press)] [--button-focus:var(--color-btn-brand-focus)] [--button-disabled:var(--color-btn-disabled-dark)] [--button-wash-hover:var(--color-btn-brand-wash-hover)] [--button-wash-press:var(--color-btn-brand-wash-press)]',
        subtle:
          '[--button-bg:var(--color-btn-disabled-light)] [--button-fg:var(--color-ink)] [--button-hover:var(--color-line)] [--button-press:var(--color-on-utility)] [--button-focus:var(--color-on-utility)] [--button-disabled:var(--color-btn-disabled-light)]',
        ghost:
          'bg-transparent text-current hover:opacity-70 disabled:opacity-50 aria-disabled:opacity-50 [--button-focus:var(--color-brand)]',
      },
      appearance: {
        primary: '',
        secondary: '',
      },
      size: {
        base: 'px-4 py-3',
        large: 'px-4 py-4',
      },
    },
    compoundVariants: [
      {
        variant: 'subtle',
        className:
          'bg-(--button-bg) text-(--button-fg) hover:bg-(--button-hover) active:bg-(--button-press) disabled:bg-(--button-disabled) aria-disabled:bg-(--button-disabled)',
      },
      {
        variant: ['dark', 'light', 'brand'],
        appearance: 'primary',
        className:
          'bg-(--button-bg) text-(--button-fg) hover:bg-(--button-hover) active:bg-(--button-press) disabled:bg-(--button-disabled) aria-disabled:bg-(--button-disabled)',
      },
      {
        variant: ['dark', 'light', 'brand'],
        appearance: 'secondary',
        className:
          'bg-transparent text-(--button-bg) shadow-[inset_0_0_0_2px_currentColor] hover:bg-(--button-wash-hover) active:bg-(--button-wash-press) disabled:bg-transparent aria-disabled:bg-transparent',
      },
    ],
    defaultVariants: { variant: 'dark', appearance: 'primary', size: 'base' },
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
  appearance,
  size,
  asChild = false,
  icon,
  children,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? SlotPrimitive.Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, appearance, size, className }))}
      ref={ref}
      {...props}
    >
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

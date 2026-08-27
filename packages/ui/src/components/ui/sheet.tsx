'use client'

import * as React from 'react'
import { Dialog as SheetPrimitive } from 'radix-ui'

import { cn } from '@o3/ui/lib/utils'
import { CloseIcon } from '../close-icon'

/**
 * shadcn's `sheet`, translated to O3 tokens (ADR 0008).
 *
 * Adopted for the **402 nav** (ADR 0006): the mobile frame draws a closed
 * "Open menu" affordance (`1814:1636`) and nothing else, so the panel it opens
 * is the one piece of chrome with no frame behind it. What shadcn supplies is
 * the part that isn't a drawing anyway — focus trap, ESC-to-close, scroll lock,
 * `aria-modal` and the labelling wiring — which is exactly what earns a place
 * in `ui/` rather than being rebuilt by hand.
 *
 * Two deviations from the generated draft, both deliberate:
 *
 * - **`lucide-react` is gone.** The close affordance is `CloseIcon`, the
 *   inlined Material Symbols glyph the frames actually use (ADR 0009).
 * - **No `tailwindcss-animate`.** This repo does not install it, so both
 *   directions are `data-[state]` keyframe animations from `tokens/motion.css`.
 *   Neither can be a transition: Radix mounts the panel already carrying
 *   `data-state="open"`, so an entry transition has no starting value to leave,
 *   and it unmounts a closing panel without waiting for a transition, so an
 *   exit transition is never seen. Only the **right** side is declared, which
 *   is the side the sites open (`MobileNavMenu`); the other three take their
 *   resting translate and no motion until someone gives them a pair.
 *
 *   The `motion-reduce` cancels are keyed to the same `data-[state]` as the
 *   animation they cancel, and that is load-bearing: a bare
 *   `motion-reduce:animate-none` is one class selector against the animation's
 *   class-plus-attribute, so it loses on specificity and the gate does not
 *   bite. With the animation gone Radix sees a computed `animation-name` of
 *   `none` and unmounts on the spot, so a reduced-motion close is instant.
 *
 * Surfaces are left to the caller: `SheetContent` defaults to the light band,
 * and the nav passes `bg-ink-deep` to match the bar it opens from.
 */
function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        'bg-ink-deep/60 fixed inset-0 z-50 opacity-0 data-[state=open]:opacity-100',
        'data-[state=open]:animate-scrim-in data-[state=closed]:animate-scrim-out',
        'motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none',
        className,
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left'
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'text-fg fixed z-50 flex flex-col gap-4 bg-white',
          side === 'right' &&
            'inset-y-0 right-0 h-full w-3/4 translate-x-full data-[state=open]:translate-x-0 sm:max-w-sm',
          side === 'right' &&
            'data-[state=open]:animate-sheet-in-right data-[state=closed]:animate-sheet-out-right motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none',
          side === 'left' &&
            'inset-y-0 left-0 h-full w-3/4 -translate-x-full data-[state=open]:translate-x-0 sm:max-w-sm',
          side === 'top' &&
            'inset-x-0 top-0 h-auto -translate-y-full data-[state=open]:translate-y-0',
          side === 'bottom' &&
            'inset-x-0 bottom-0 h-auto translate-y-full data-[state=open]:translate-y-0',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close className="focus-visible:ring-brand duration-(--duration-hover) absolute right-4 top-4 opacity-70 transition-opacity ease-out hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none">
            <CloseIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('font-semibold', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-fg-muted text-sm', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

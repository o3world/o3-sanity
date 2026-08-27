import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@o3/ui/lib/utils'

const cardVariants = cva(
  // 16px radius + overflow clip: the insight cards and work-case cards both
  // round their media flush to the card edge.
  'overflow-hidden rounded-card',
  {
    variants: {
      surface: {
        // white — insight cards sitting on the bone band.
        white: 'bg-white text-fg',
        // ink — the work-case card fill (#0A0A0B) on the #030303 section.
        ink: 'bg-ink-soft text-white',
      },
      // interactive — the card is a link or a target, and says so under the
      // cursor: a 4px lift on a soft drop shadow, over the hover duration on
      // the house curve. Opt-in, because a card that only reads does not earn
      // the affordance.
      //
      // NO FIGMA ANCHOR (motion is the one thing the frames cannot supply —
      // CONTEXT.md). Both values come from the `section-shell-motion` template
      // in the O3 Component Library Claude Design project; the story below is
      // what settles them.
      interactive: {
        true: [
          // Tailwind v4 compiles `-translate-y-1` to the `translate` property,
          // not `transform`, so both the transition list and the reduced-motion
          // cancel have to name `translate`.
          'transition-[translate,box-shadow] duration-(--duration-hover) ease-out',
          'hover:-translate-y-1 hover:shadow-[0_12px_28px_-18px_rgb(0_0_0/0.35)]',
          'motion-reduce:transition-none motion-reduce:hover:translate-none',
        ].join(' '),
      },
    },
    defaultVariants: { surface: 'white' },
  },
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

function Card({ className, surface, interactive, ...props }: CardProps) {
  return <div className={cn(cardVariants({ surface, interactive }), className)} {...props} />
}

/** Edge-to-edge media strip (the insight card's 220px image area). */
function CardMedia({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-line h-[220px] overflow-hidden', className)} {...props} />
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-3 p-6 pb-0', className)} {...props} />
}

function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  // Insight-card h4: Figtree 300, 22/1.25, -0.01em.
  return (
    <h4
      className={cn('text-[22px] font-light leading-[1.25] tracking-[-0.01em]', className)}
      {...props}
    >
      {children}
    </h4>
  )
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-fg-muted text-[15px] leading-[1.5]', className)} {...props} />
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-1 flex-col p-6', className)} {...props} />
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // The insight card's meta row: hairline above, subtle 13px text.
  return (
    <div
      className={cn(
        'border-line-soft text-fg-subtle mt-auto flex items-center border-t px-6 pb-6 pt-4 text-[13px]',
        className,
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardMedia,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
}

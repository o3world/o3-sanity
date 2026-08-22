import type { HTMLAttributes } from 'react'

import { cn } from '@o3/ui'

/**
 * The kit's Header Pill (`4414:8100`, Quotes canvas of the _O3XO: UI kit_) —
 * the label a band wears above its opening line, in a rounded outline.
 *
 * ```
 * pill   radius 9999, padding 8 / 16, fill white 10%, hairline white 20%
 * text   16 / 24 Figtree Light, SENTENCE CASE
 * ```
 *
 * **Sentence case is the point.** The kit sets these words as body copy —
 * `--text-eyebrow-lg` is 16/1.5/300 under O3XO — where the shared `Eyebrow`
 * component pairs its step with the `eyebrow` utility's uppercase transform
 * (#238). So this draws the type step and not the component.
 *
 * The fill and the hairline are `fg` alphas rather than white ones, so they
 * flip with the band: the kit only ever draws the pill over a photograph, and
 * O3XO's quote band today is bone, where white on white is nothing. On ink
 * `--color-fg` is already white at 92%, which lands the kit's two values.
 *
 * App-local because it names no role `packages/ui` may name and answers to a
 * file O3 does not read (ADR 0028).
 */
export function HeaderPill({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-eyebrow-lg text-fg bg-fg/10 border-fg/20 inline-flex w-fit rounded-full border px-4 py-2 backdrop-blur-[2px]',
        className,
      )}
      {...props}
    />
  )
}

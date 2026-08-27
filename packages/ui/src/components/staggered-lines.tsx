import type { ReactNode } from 'react'

import { cn } from '../lib/utils'

export interface StaggeredLinesProps {
  /** One entry per visual line; each gets its own delay. */
  lines: readonly ReactNode[]
  /** ms before the first line starts arriving. */
  baseDelay?: number
  /** ms between successive lines. */
  stagger?: number
}

/**
 * The hero headline's editorial stagger: each line fades up 0.4em with a 4px
 * blur melting off it, on `--ease-spring` over `--duration-reveal`, one line
 * every `stagger` ms.
 *
 * Read off motion.dev's editorial-stagger reference, which has no Figma anchor
 * and cannot have one — the frames draw the band, not its entrance. Nothing
 * here clips: a line is drawn in full from the first frame and only its
 * opacity, offset and focus change, which is what separates an editorial
 * stagger from a wipe.
 *
 * **The entrance is a CSS animation, and this component renders on the
 * server.** The headline is the page's LCP element, so its reveal has to start
 * when the band first paints rather than when React hydrates — an animation
 * declared in the server HTML does; a mount-triggered transition cannot, and
 * held the opener empty for the whole hydration window.
 *
 * The text is in the server HTML and only its paint is animated, so a headline
 * is readable whether or not JavaScript ever runs. `motion-reduce` drops the
 * animation entirely, which leaves every line in place and legible: the rise
 * and the blur are geometry and paint, and neither is something to hand a
 * reader who asked for stillness.
 */
export function StaggeredLines({ lines, baseDelay = 0, stagger = 220 }: StaggeredLinesProps) {
  return (
    <>
      {lines.map((line, i) => (
        <span
          key={i}
          className={cn(
            'animate-line-rise block',
            // `translate`, not `transform`: Tailwind v4 compiles `translate-y-*`
            // to the independent `translate` property, which is what the
            // keyframe writes (see `../motion.ts`). `filter` is deliberately
            // absent from the hint — promoting it would leave behind the
            // containing block the blur's `backwards` fill exists to shed.
            '[will-change:opacity,translate]',
            'motion-reduce:animate-none',
          )}
          style={{ animationDelay: `${baseDelay + i * stagger}ms` }}
        >
          {line}
        </span>
      ))}
    </>
  )
}

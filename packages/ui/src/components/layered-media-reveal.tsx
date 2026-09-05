import type { ReactNode } from 'react'
import { RevealSequence } from './reveal-sequence'

/** A painted clipping stage with one moving foreground and an optional caption. */
export function LayeredMediaReveal({
  enabled = false,
  children,
  caption,
  className,
  foregroundClassName,
  captionClassName,
}: {
  enabled?: boolean
  children: ReactNode
  caption?: ReactNode
  className?: string
  foregroundClassName?: string
  captionClassName?: string
}) {
  const foreground = (
    <div data-reveal-step={enabled ? 'foreground' : undefined} className={foregroundClassName}>
      {children}
    </div>
  )
  return (
    <figure>
      {enabled ? (
        <RevealSequence cadence="foreground" className={className}>
          {foreground}
        </RevealSequence>
      ) : (
        <div className={className}>{foreground}</div>
      )}
      {caption ? <figcaption className={captionClassName}>{caption}</figcaption> : null}
    </figure>
  )
}

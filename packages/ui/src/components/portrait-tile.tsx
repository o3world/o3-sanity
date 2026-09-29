import type { HTMLAttributes } from 'react'

import { cn } from '../lib/utils'

export interface PortraitTileProps extends HTMLAttributes<HTMLDivElement> {
  /** The finished square portrait composition, including its authored background. */
  children?: React.ReactNode
}

/** Current About employee-card image (3771:80239): preserve authored color and clip at 16px. */
export function PortraitTile({ className, children, ...rest }: PortraitTileProps) {
  return (
    <div
      className={cn(
        'bg-ink relative isolate aspect-square w-full overflow-hidden rounded-2xl',
        className,
      )}
      {...rest}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  )
}

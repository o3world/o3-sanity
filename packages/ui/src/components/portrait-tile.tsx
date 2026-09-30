import type { HTMLAttributes } from 'react'

import { cn } from '../lib/utils'

export interface PortraitTileProps extends HTMLAttributes<HTMLDivElement> {
  /** The finished square portrait composition, including its authored background. */
  children?: React.ReactNode
}

/** Current About employee-card image (3771:80239): preserve authored color, clip at 16px, Big Shadow. */
export function PortraitTile({ className, children, ...rest }: PortraitTileProps) {
  return (
    <div
      className={cn(
        'bg-ink relative isolate aspect-square w-full overflow-hidden rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.2)]',
        className,
      )}
      {...rest}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  )
}

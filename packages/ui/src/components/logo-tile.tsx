import type { HTMLAttributes } from 'react'

import { cn } from '../lib/utils'

export interface LogoTileProps extends HTMLAttributes<HTMLDivElement> {
  /** Plain <img> shortcut. For next/image (or an SVG), pass children instead. */
  src?: string
  alt?: string
}

/**
 * One cell of the partner logo wall: a fixed 110px row that centers its logo
 * and caps it at 78% width / 76px height so mixed logo aspect ratios sit on a
 * common optical size (prototype "Our Partners" grid).
 */
export function LogoTile({ src, alt = '', className, children, ...rest }: LogoTileProps) {
  return (
    <div className={cn('flex h-[110px] items-center justify-center', className)} {...rest}>
      {children ??
        (src ? <img src={src} alt={alt} className="max-h-[76px] max-w-[78%] object-contain" /> : null)}
    </div>
  )
}

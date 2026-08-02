import type { HTMLAttributes } from 'react'

import { cn } from '../lib/utils'

export interface PortraitTileProps extends HTMLAttributes<HTMLDivElement> {
  /** The portrait. Pass a next/image wrapper from the app, or a plain `<img>`. */
  children?: React.ReactNode
}

/**
 * The square tile a team portrait sits on in the About frame's "Our team" band
 * (`1925:5864`) — black, with a brand-red arc rising from the bottom edge and
 * the portrait in greyscale over it.
 *
 * **The frame bakes all three layers into one raster.** Its card fill is a
 * single 2500×2500 export: a cut-out portrait already composited over the arc.
 * That asset does not exist for the 14 migrated `person` documents, whose
 * headshots are ordinary rectangular JPEGs off WordPress — so the treatment is
 * rebuilt in layers here instead of waiting for 14 hand-comped exports.
 *
 * ⚠️ **The arc is drawn but currently occluded.** A rectangular headshot fills
 * the tile and covers it; the arc shows only where the portrait is absent
 * (two of the 14 have no headshot at all). Swapping the headshots for cut-out
 * PNGs is what completes the composition — not a change here.
 */
export function PortraitTile({ className, children, ...rest }: PortraitTileProps) {
  return (
    <div
      className={cn('bg-ink relative isolate aspect-square w-full overflow-hidden', className)}
      {...rest}
    >
      {/*
       * The arc. Read off the raster's centre and edge columns: the red meets
       * the tile's left and right edges at ~38% of its height and bows up from
       * there, so it is an ellipse wider than the tile with only its cap
       * showing — the same "hang the circle and show the cap" move the hero's
       * OrbitalSphere makes.
       */}
      <div
        aria-hidden="true"
        className="bg-brand absolute inset-x-[-20%] bottom-0 top-[36%] rounded-t-[100%]"
      />
      <div className="absolute inset-0 grayscale">{children}</div>
    </div>
  )
}

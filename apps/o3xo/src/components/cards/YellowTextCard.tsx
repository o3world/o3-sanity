import { cn } from '@o3/ui/lib/utils'

import type { PanelCard } from '@o3/content-ui'

/**
 * The kit's `Yellow Text Card` (`4404:3934`) — a heading over its prose on an
 * `accent` plate.
 *
 * **This card lives in the app** for the reason `KeyMetricCard` does: `accent`
 * is a role only O3XO's token package declares, and a shared component that
 * named one would paint yellow on an O3 page (ADR 0028).
 *
 * ```
 * card  588 × 238, radius 8, padding 32, gap 16
 *   heading  Figtree Regular 24/28   #111827
 *   body     Figtree Light   18/24   #111827
 * ```
 *
 * The kit fills the plate with the same near-flat `orange/50` raster the key
 * metric card carries, so this is `bg-accent` and not an asset, and the copy
 * is `ink` for the reason that card's is: `fg` turns into a white alpha inside
 * a dark band, and one of these rows sits in one.
 *
 * The kit's height is a fixed 238 around two lines of demo prose; a real body
 * runs three or four, so the plate is sized by its contents and the grid is
 * what makes a row match.
 */
export interface YellowTextCardProps {
  /** The card's subject — the pain point, or the principle. */
  heading?: string | null
  /** The prose under it. */
  body?: string | null
  /** The panel's `data-sanity`, stamped by the block that laid the row out. */
  dataSanity?: string
  className?: string
}

export function YellowTextCard({ heading, body, dataSanity, className }: YellowTextCardProps) {
  return (
    <article
      data-sanity={dataSanity}
      className={cn('bg-accent text-ink flex h-full flex-col gap-4 rounded-[8px] p-8', className)}
    >
      {heading ? <h3 className="text-display-sm font-display">{heading}</h3> : null}
      {body ? <p className="text-lead">{body}</p> : null}
    </article>
  )
}

/**
 * The pair — `Yellow Text Card Group` (`4404:4611`): two cards, 24px apart,
 * filling the 1200 measure.
 *
 * Takes the shared `PanelCard` shape rather than one of its own, because this
 * is what fills `railPanelsSection`'s cards slot: the band maps its panels
 * once and either brand's cards read the same items. `mark` and `note` are
 * dropped — the kit's card draws a heading and its prose and nothing else.
 */
export function YellowTextCards({ items }: { items: PanelCard[] }) {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-2">
      {items.map(({ key, heading, body, dataSanity }) => (
        <YellowTextCard key={key} heading={heading} body={body} dataSanity={dataSanity} />
      ))}
    </div>
  )
}

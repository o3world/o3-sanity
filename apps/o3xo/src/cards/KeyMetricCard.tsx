import { cn } from '@o3/ui/lib/utils'

/**
 * The kit's `Key Metric Card` (`4404:3916`) — one figure over its caption on
 * an `accent` plate.
 *
 * **This card lives in the app** because `accent` is a role only O3XO's token
 * package declares, and `brand-token-seam.test.ts` fails any shared component
 * that names one: Tailwind bakes `#ffbe00` in as the utility's own fallback,
 * so a shared card would paint yellow on an O3 page rather than paint nothing
 * (ADR 0028).
 *
 * ```
 * card  379 × 134, radius 10, padding 32, gap 10, contents centred
 *   value  Figtree Regular 36/40   #111827
 *   label  Figtree Light   20/28   #111827
 * ```
 *
 * The kit fills the plate with a raster (`ZUVO8coohNETLnG4DIG4tdPXwcU.png`,
 * 1716 × 616) rather than a colour. Every pixel of it is `orange/50` to within
 * a value or two, so it is `bg-accent` here and not an asset.
 *
 * **The copy is `ink`, not `fg`.** Both bands that carry these cards are dark,
 * and `[data-surface='ink']` re-points `--color-fg` to a white alpha for
 * everything inside one — which on a yellow plate is 1.7:1. `ink` is the role
 * that means the darkest text whatever band it lands in, and O3XO paints it at
 * the #111827 the frame sets.
 *
 * The card carries no link and no control, and neither the kit nor the live
 * site draws a state on it, so it has none.
 */
export interface KeyMetricCardProps {
  /** The headline figure — a string, so `50%+` and `<90 days` both work. */
  value: string
  /** The line under the figure. */
  label: string
  /** The stat's `data-sanity`, stamped by the block that laid the row out. */
  dataSanity?: string
  className?: string
}

export function KeyMetricCard({ value, label, dataSanity, className }: KeyMetricCardProps) {
  return (
    <div
      data-sanity={dataSanity}
      className={cn(
        'bg-accent text-ink flex h-full flex-col justify-center gap-2.5 rounded-[10px] p-8',
        className,
      )}
    >
      <p className="text-display-lg">{value}</p>
      <p className="text-lead">{label}</p>
    </div>
  )
}

export interface KeyMetricCardItem extends KeyMetricCardProps {
  /** React key — the stat's `_key` where the row is built from content. */
  key: string
}

/**
 * The row — `Key Metric Card Group` (`4404:3960`): three cards, 32px apart,
 * filling the 1200 measure.
 *
 * A `<ul>`, the same shape and for the same reason the shared `StatGroup` is
 * one: a list of statistics is a list, and a figure with its caption is one
 * item rather than a term and its definition.
 *
 * The kit draws three. The count is the editor's — `statGroup` takes one to
 * four — so the row is a grid that keeps the kit's three across and wraps a
 * fourth under it, rather than a fixed row that would squeeze the plates.
 */
export function KeyMetricCards({ items }: { items: KeyMetricCardItem[] }) {
  if (!items.length) return null
  return (
    <ul className="grid w-full gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ key, ...card }) => (
        <li key={key}>
          <KeyMetricCard {...card} />
        </li>
      ))}
    </ul>
  )
}

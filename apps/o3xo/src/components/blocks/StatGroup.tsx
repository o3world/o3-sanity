import type { BaseProps } from '@o3/content-runtime/blocks'

import { KeyMetricCards } from '@/components/cards/KeyMetricCard'

/**
 * Base block: the stat row as the kit's `Key Metric Card Group` (`4404:3960`)
 * — a yellow plate per figure where O3 sets the same numbers bare.
 *
 * **This renderer lives in the app** because the block is app-first
 * (`APP_FIRST_RENDERERS`): the card's plate is `accent`, a role only O3XO's
 * token package declares, so a shared component may not name it (ADR 0028).
 *
 * The block is the row's layout and nothing else — the plate, its type and its
 * measure are `KeyMetricCard`'s.
 */
export function StatGroup({ stats }: BaseProps<'statGroup'>) {
  return (
    <KeyMetricCards
      items={(stats ?? []).map((stat, index) => ({
        key: stat._key ?? String(index),
        value: stat.value ?? '',
        label: stat.label ?? '',
      }))}
    />
  )
}

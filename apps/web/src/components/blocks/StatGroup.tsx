import { Stat } from '@o3/ui'

import type { BaseProps } from '@o3/content-runtime/blocks'

type StatGroupProps = BaseProps<'statGroup'>

/**
 * Base block: 1–4 stats in a responsive row — O3's drawing of `statGroup`.
 *
 * **This renderer lives in the app** because the block is app-first
 * (`APP_FIRST_RENDERERS`): O3 sets the figure bare over its caption, the O3XO
 * kit plates each one on `accent` (`Key Metric Card`, `4404:3916`), and no
 * axis of one composition reaches the other. `Stat` itself stays shared —
 * only the row is each brand's own.
 *
 * A `<ul>`, not a `<dl>`. `Stat` renders a `<p>` holding the figure and its
 * caption together, and a `<dl>` may only directly contain `dt` / `dd` /
 * `div` / `script` / `template`, so the list markup would be invalid on every
 * page that drew the block. It is also the wrong shape: a figure and its
 * caption are one item, not a term and its definition. A list of statistics
 * is a list.
 */
export function StatGroup({ stats }: StatGroupProps) {
  if (!stats?.length) return null
  return (
    <ul className="grid grid-cols-2 gap-8 lg:grid-cols-4">
      {stats.map((stat) => (
        <li key={stat._key}>
          <Stat value={stat.value ?? ''} label={stat.label ?? ''} />
        </li>
      ))}
    </ul>
  )
}

import { Stat } from '@o3/ui'

import type { BaseProps } from '@o3/content-runtime/blocks'

type StatGroupProps = BaseProps<'statGroup'>

/**
 * Base block: 1–4 stats in a responsive row.
 *
 * A `<ul>`, not the `<dl>` this shipped with. `Stat` renders a `<p>` holding
 * the figure and its caption together, and a `<dl>` may only directly contain
 * `dt` / `dd` / `div` / `script` / `template` — so the old markup was invalid
 * on every page that rendered the block, and axe said so (`definition-list`)
 * the moment the block was first mounted, which was when it got its stories.
 *
 * A `<dl>` would also have been the wrong shape even done properly: a figure
 * and its caption are one item, not a term and its definition, and splitting
 * `Stat` into `dt` + `dd` to satisfy the element would have broken the
 * baseline alignment that is the whole treatment. A list of statistics is a
 * list.
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

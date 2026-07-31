import { Stat } from '@o3/ui'

import type { BaseProps } from '@/content/blocks/sectionTypes'

type StatGroupProps = BaseProps<'statGroup'>

/** Base block: 1–4 stats in a responsive row. */
export function StatGroup({ stats }: StatGroupProps) {
  if (!stats?.length) return null
  return (
    <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
      {stats.map((stat) => (
        <Stat key={stat._key} value={stat.value ?? ''} label={stat.label ?? ''} />
      ))}
    </dl>
  )
}

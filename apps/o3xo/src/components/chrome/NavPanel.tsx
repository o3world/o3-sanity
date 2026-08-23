import Link from 'next/link'

import { resolveButtonHref } from '@o3/content-ui'

import { NavPanelCard } from './NavPanelCard'
import type { NavGroup } from './navItems'

/**
 * What a dropdown shows: the group's cards in two columns, and the row that
 * closes the panel.
 *
 * Presentational and open-state-free, so the one thing a story cannot drive —
 * a panel that only exists after a pointer enters a trigger — is a component a
 * story can mount on its own. `NavRow` owns whether it is showing; this owns
 * what is in it.
 *
 * The measurements are the live panel's (2026-08-19), because the kit's
 * `Navigation` is an HTML import of the collapsed bar and draws nothing under
 * it: 595 × 92 cards two-up in a 1200 row, 10px apart, over 24px of vertical
 * padding.
 */
export function NavPanel({ group }: { group: NavGroup }) {
  const items = group.items ?? []
  const more = group.button

  return (
    <div className="px-gutter max-w-section mx-auto flex w-full flex-col gap-6 py-6">
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {items.map((item, index) => (
            <NavPanelCard key={item._key ?? `card-${index}`} item={item} />
          ))}
        </div>
      ) : null}
      {more?.label ? (
        <Link
          href={resolveButtonHref(more)}
          className="text-nav focus-visible:ring-accent duration-(--duration-hover) inline-flex w-fit items-center gap-2 text-white transition-opacity ease-out hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
        >
          {more.label}
          <span aria-hidden="true">&rarr;</span>
        </Link>
      ) : null}
    </div>
  )
}

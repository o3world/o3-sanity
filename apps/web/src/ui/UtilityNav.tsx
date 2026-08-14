import Link from 'next/link'

import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { resolveCtaHref } from '@/content/CtaLink'

interface UtilityNavProps {
  settings: SITE_SETTINGS_QUERY_RESULT
}

/**
 * The brand-property strip, built to Figma's `Utility Nav` (`2250:1445`) — #88.
 *
 * O3 runs more than this site, and this is the bar that says so: O3 World ·
 * 1682 Conference · O3XO, links to the other two properties and back to this
 * one. The 2026-08 pass added it above the nav pill; nothing rendered it until
 * now.
 *
 * ── WHAT THE FRAME SAYS ────────────────────────────────────────────────────
 *
 * A 1440 × 50 black band, `96px` of side padding (the page gutter), links `24px`
 * apart and vertically centred. Copy is Figtree Medium 18/24 — `--text-button`,
 * the same step the nav links and every button label take. Fill, hairline and
 * copy are all variable-bound, so all three are tokens (`utility`,
 * `on-utility-line`, `on-utility`).
 *
 * **No property is highlighted.** All three links are `State=Default` with the
 * same `#AAA69E` fill on the Home instance (`2250:1453`), so the strip is a
 * switcher rather than a breadcrumb, and "O3 World" gets no active treatment
 * for being the site you are already on. The hover variant (`2225:2893`) takes
 * brand red — the design's one canonical anchor for `#EB1000` on a dark
 * surface.
 *
 * ── IT SCROLLS; THE PILL DOES NOT ──────────────────────────────────────────
 *
 * The Home frame is explicit about this in a way frames usually are not.
 * `Utility Nav` `2250:1453` is an ordinary in-flow child of the page's vertical
 * stack with `scrollBehavior: SCROLLS`, and the hero starts beneath it;
 * `NavBar` `2225:2967` is `ABSOLUTE` + `FIXED` at `y: 64`, which is this strip's
 * 50px plus a 14px gap. So the strip is document, not chrome-that-follows: it
 * sits at the top of the page, scrolls away, and `SiteNav`'s pinned pill takes
 * `lg:top-[64px]` to keep the frame's gap at rest and hold its own position
 * after. That is why this renders in the layout beside `SiteNav` rather than
 * inside its fixed `<header>`.
 *
 * ── DESKTOP ONLY ───────────────────────────────────────────────────────────
 *
 * Not a `lg` composition switch (ADR 0006) but an absence: mobile Home
 * (`1814:1618`) opens on the nav bar at `y: 0` with no strip above it, at any
 * depth. So it is hidden below `lg` — which also keeps the 402 chrome exactly
 * as it shipped, since a `display: none` element adds no height to push it
 * down.
 */
export function UtilityNav({ settings }: UtilityNavProps) {
  const items = settings?.utilityNavItems ?? []
  if (items.length === 0) return null

  return (
    <nav
      aria-label="O3 properties"
      // Figma strokes the whole box; only the bottom edge meets anything, so
      // that is the edge that gets a hairline — the other three sit against the
      // viewport's edges, where a 1px dark line on a black bar draws nothing.
      className="border-on-utility-line bg-utility px-gutter hidden h-[50px] items-center gap-6 border-b lg:flex"
    >
      <ul className="contents">
        {items.map((item, i) => (
          <li key={item._key ?? `utility-${i}`}>
            <Link
              href={resolveCtaHref(item)}
              // The hover is a read state for once (`2225:2893`), not a code
              // decision: brand red, over 200ms ease-out in the file, which is
              // `--duration-hover` (220ms) here rather than a second literal
              // 20ms away from the house value.
              className="text-button text-on-utility hover:text-brand focus-visible:ring-brand duration-(--duration-hover) transition-colors ease-out focus-visible:outline-none focus-visible:ring-2"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

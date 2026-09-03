import Link from 'next/link'

import { SurfaceProvider, surfaceAttrs } from '@o3/ui'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { resolveButtonHref } from '../buttonDestination'
import { SanityImage } from '../SanityImage'

interface UtilityNavProps {
  settings: SITE_SETTINGS_QUERY_RESULT
}

type UtilityNavItem = NonNullable<
  NonNullable<SITE_SETTINGS_QUERY_RESULT>['utilityNavItems']
>[number]

/**
 * The brand-property strip, built to Figma's `Utility Nav` (`2250:1445`) as the
 * Home frame instances it (`2250:1453`) — #88.
 *
 * O3 runs more than this site, and this is the bar that says so: the words "O3
 * Family of Brands", then the 1682 Conference and O3XO marks. It sits above the
 * nav pill.
 *
 * ── WHAT THE FRAME SAYS ────────────────────────────────────────────────────
 *
 * A 1440 × 69 black band, `96px` of side padding (the page gutter), members
 * `24px` apart and vertically centred. Copy is Figtree Medium 18/24 —
 * `--text-button`, the same step the nav links and every button label take.
 * Fill, hairline and copy are all variable-bound, so all three are tokens
 * (`utility`, `on-utility-line`, `on-utility`).
 *
 * **The marks are 20px tall and nothing else is fixed about them.** 1682 is
 * drawn 55 × 20 and O3XO 76 × 20, which is each file's own proportion at that
 * height, so the renderer sets the height and lets the width follow. Both are
 * knocked out for a black bar — no plate, no grayscale.
 *
 * **No property is highlighted.** Every member is `State=Default` with the same
 * `#AAA69E` fill, so the strip is a switcher rather than a breadcrumb. The
 * hover variant (`2225:2893`) takes brand red — the design's one canonical
 * anchor for `#EB1000` on a dark surface — and that is a colour a wordmark
 * cannot take, so a mark answers a hover with opacity instead.
 *
 * ── IT SCROLLS; THE PILL DOES NOT ──────────────────────────────────────────
 *
 * The Home frame is explicit about this in a way frames usually are not.
 * `Utility Nav` `2250:1453` is an ordinary in-flow child of the page's vertical
 * stack with `scrollBehavior: SCROLLS`, and the hero starts beneath it;
 * `NavBar` `2225:2967` is `ABSOLUTE` + `FIXED` at `y: 124`, which is this
 * strip's 69px plus a 55px gap. So the strip is document, not chrome-that-
 * follows: it sits at the top of the page, scrolls away, and `SiteNav`'s pinned
 * pill takes `--spacing-nav-offset` to keep the frame's gap at rest and hold
 * its own position after. That is why this renders in the layout beside
 * `SiteNav` rather than inside its fixed `<header>`.
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
    // Chrome outside the band system, so it declares its own: `--color-utility`
    // is black. Nothing in the strip is a button today; the declaration is what
    // stops one added later resolving against nothing.
    <SurfaceProvider surface="ink">
      <nav
        aria-label="O3 properties"
        {...surfaceAttrs('ink')}
        // Figma strokes the whole box; only the bottom edge meets anything, so
        // that is the edge that gets a hairline — the other three sit against the
        // viewport's edges, where a 1px dark line on a black bar draws nothing.
        className="border-on-utility-line bg-utility px-gutter hidden h-[69px] items-center gap-6 border-b lg:flex"
      >
        <ul className="contents">
          {items.map((item, i) => (
            <li key={item._key ?? `utility-${i}`}>
              <UtilityNavLink item={item} />
            </li>
          ))}
        </ul>
      </nav>
    </SurfaceProvider>
  )
}

/**
 * One member, in whichever of the strip's two kinds it was authored.
 *
 * The hover is a read state for once (`2225:2893`), not a code decision: brand
 * red, over 200ms ease-out in the file, which is `--duration-hover` (220ms)
 * here rather than a second literal 20ms away from the house value. A mark has
 * no text colour to take it to, so it fades to 70% over the same duration —
 * the smallest honest translation of "this row responds" onto artwork whose
 * colours are the property's, not ours.
 */
function UtilityNavLink({ item }: { item: UtilityNavItem }) {
  const button = item._type === 'brandLogo' ? item.button : item
  const label = button?.label ?? ''

  if (item._type === 'brandLogo') {
    return (
      <Link
        href={resolveButtonHref(button ?? {})}
        className="duration-(--duration-hover) focus-visible:ring-brand block transition-opacity ease-out hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
      >
        {/*
         * `width` is the CDN request, not the layout: 304 is the 76px the
         * widest mark occupies at 4×, which is what a retina display asks for.
         * Height is the only thing the frame fixes, so the class sets it and
         * the mark's own proportions decide the width.
         */}
        <SanityImage
          source={item.logo}
          alt={label}
          width={304}
          sizes="76px"
          className="h-5 w-auto"
        />
      </Link>
    )
  }

  return (
    <Link
      href={resolveButtonHref(item)}
      className="text-button text-on-utility hover:text-brand focus-visible:ring-brand duration-(--duration-hover) transition-colors ease-out focus-visible:outline-none focus-visible:ring-2"
    >
      {label}
    </Link>
  )
}

import Link from 'next/link'

import { SurfaceProvider } from '@o3/ui'

import { O3xoMark } from '@/brand/O3xoMark'

import { MobileNav } from './MobileNav'
import { NavRow } from './NavRow'
import type { Settings } from './navItems'

/**
 * O3XO's nav bar, built to the kit's `Navigation` (`4404:4146`, Navigation
 * canvas `4404:3961`).
 *
 * App-local rather than shared, which is the whole of #243: the shared
 * `SiteNav` is O3's floating pill and this is a different bar (ADR 0028,
 * second addendum). Nothing about the shared one moves.
 *
 * ── WHAT THE COMPONENT SAYS ────────────────────────────────────────────────
 *
 * A 1440 × 64 bar, `10px 32px`, filled `#000000` from a bound variable with a
 * 4px background blur, holding one 1200-wide row: the mark on the left, and
 * `List` (`4404:3995`) right-aligned with a 32px gap. Five entries — three
 * carets (Industries, Case studies, About), one plain link (Insights), and a
 * filled `Contact` at the end.
 *
 * ── THE INK NEVER FLIPS ────────────────────────────────────────────────────
 *
 * O3's pill is `--color-scrim` — black at 20% — so it composites with whatever
 * band is under it and has to swap ink when that band goes light. **This bar
 * does not.** The kit fills it opaque and o3xo.ai renders `rgba(0,0,0,0.95)`,
 * which is its own surface at every scroll position: there is nothing under it
 * to read and no second skin to draw. So the fork carries no `NavInk`, no
 * `data-ink` attribute and no sampling — one bar, one set of colours, and the
 * question the ticket asked is answered by the fill rather than by a decision.
 *
 * ── STICKY, NOT FIXED ──────────────────────────────────────────────────────
 *
 * The kit draws the bar as a component and never on a page frame, so it says
 * nothing about flow; o3xo.ai pins it `fixed` over a hero whose first band
 * carries the 64px of clearance in its own padding. Our bands do not, and an
 * opaque bar has no reason to overlap one — the overlap on O3's pill exists
 * because the hero shows through it. `sticky` keeps the pinned behaviour and
 * accounts for the 64px in flow, so no band needs a spacer it would otherwise
 * have to grow.
 *
 * ── THE UTILITY STRIP IS O3'S ──────────────────────────────────────────────
 *
 * There is no O3XO equivalent, and this bar is not missing one. The two
 * property links the strip carries for O3 (`utilityNavItems`) are drawn by
 * O3XO's **footer**, in its one row beside the privacy link — see `SiteFooter`.
 */
export function SiteNav({ settings }: { settings: Settings | null }) {
  const items = settings?.navItems ?? []
  const button = settings?.primaryButton ?? null

  return (
    // Chrome sits outside the band system, so it declares its own surface: the
    // bar is black, and a button inside it resolves Auto against that.
    <SurfaceProvider surface="ink">
      <header className="bg-ink-deep/95 sticky top-0 z-50 backdrop-blur-[4px]">
        <nav
          aria-label="Primary"
          className="px-gutter max-w-section mx-auto flex h-16 w-full items-center justify-between"
        >
          <Link
            href="/"
            aria-label={`${settings?.title ?? 'O3XO'} home`}
            className="focus-visible:ring-accent shrink-0 focus-visible:outline-none focus-visible:ring-2"
          >
            {/* `Link - O3XO Home` (`4404:3980`) draws the horizontal lockup at
                32px — 104.33 wide, which is exactly the mark's own 391 × 120
                box at that height. `2 color` is the variant on a black bar:
                white word, accent star. */}
            <O3xoMark layout="horizontal" height={32} />
          </Link>

          <NavRow items={items} button={button} className="hidden lg:flex" />
          <MobileNav items={items} button={button} className="lg:hidden" />
        </nav>
      </header>
    </SurfaceProvider>
  )
}

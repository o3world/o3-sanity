import Link from 'next/link'

import { BrandLogo } from '@o3/ui'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { CtaLink, resolveCtaHref } from '@/content/CtaLink'

import { MobileNavMenu } from './MobileNavMenu'
import { NAV_INK_TARGET, NavInk } from './NavInk'

interface SiteNavProps {
  settings: SITE_SETTINGS_QUERY_RESULT
}

/**
 * The site nav, built to Figma's `NavBar` component (`1710:2271`) — #41.
 *
 * The two widths are **structurally** different, which makes this a
 * composition switch at `lg` rather than a resize (ADR 0006):
 *
 * |       | 402 (`1814:1630`)                 | 1440 (`1710:2271`)                     |
 * | ----- | --------------------------------- | -------------------------------------- |
 * | Shape | full-width square bar, `8px 20px` | 822px pill, radius 900px, `8px 32px`   |
 * | Links | behind "Open menu"                | five inline, in a 589px space-between  |
 * | CTA   | inline, beside the hamburger      | inline, ending the row                 |
 *
 * Both fills are `rgba(3,3,3,0.2)` — `bg-scrim`. It stays an alpha because it
 * sits over whatever the hero is showing. The frames put no blur on it, but
 * the pill carries the prototype's `blur(14px)` anyway: a bar that never
 * leaves crosses photography, headlines and body copy all the way down the
 * page, and a 20% scrim laid straight over a paragraph is unreadable. That is
 * the prototype's behaviour being carried deliberately, not a hunch — the
 * earlier note here said the blur was dropped, and it was, until the carry was
 * asked for outright.
 *
 * Figma places the desktop bar at `y: 30` over a hero with 164px of top
 * padding — over the page, not in flow. c1ee258 read that as `lg:absolute` and
 * let the desktop bar scroll away. It is `fixed` at every width again, because
 * the ink flip below is a **pinned** bar's behaviour: a bar that leaves never
 * crosses a light band and has nothing to flip against. Every Figma-derived
 * offset is untouched — `top-[30px]`, the gutter padding, the 822px cap.
 *
 * ── INK FLIP ───────────────────────────────────────────────────────────────
 *
 * Pinned, the bar floats over dark and light bands in turn, so it has two
 * skins. Default — and everything SSR, no-JS and jsdom ever sees — is the dark
 * scrim with white copy. When `NavInk` finds a light band under the bar's
 * midpoint it sets `data-ink="dark"` on this header, and the `group-data-`
 * variants below swap fill, hairline and copy over `--duration-ink`. The
 * sampling is the prototype's; the styling is CSS off one attribute rather
 * than the prototype's per-element inline writes.
 *
 * **The mark flips with the bar**, on Nick's direction (2026-08-02): it
 * reverses with the surface — white against dark bands, black against light —
 * while maintaining exact branding. So the resting bar is a WHITE tile with
 * `#030303` counterforms (`Color=White`), and over a light band it becomes
 * `264:52`'s ink tile with white ones. The earlier reading here — that a solid
 * tile "already reverses" because the eye reads the white counterforms on dark
 * and the black square on light — was defensible and is why `Color=White` sat
 * deferred; it is not what was asked for, and the mark now inverts outright.
 * Both of the mark's inks move on the same `--duration-ink` as everything else
 * on the bar (brand-logo.tsx).
 *
 * **The CTA does flip**, which is where this parts company with the prototype
 * rather than carrying it: the prototype's CTA was brand red and survived both
 * surfaces untouched, and this design has no red button at all (button.tsx —
 * "there is no red button on the canonical Home frame"). What it has is a white
 * one, and white on `--color-scrim-light` — white at 55% over a bone band — is
 * nothing at all. See `CTA_INK_FLIP`.
 */
/**
 * The nav CTA's half of the ink flip, on the `Button` rather than the `Link`
 * that wraps it (hence `buttonClassName`).
 *
 * `Button` already owns both fills, so this is an override and not a fourth
 * variant: `light` (white on ink) is the dark skin's, `dark` (ink on white,
 * `1864:2405`) is the flipped skin's. Without it the site's one conversion
 * path (#58) disappears the moment the bar crosses a light band — a white
 * button on a 55%-white pill on a bone band is three whites.
 *
 * The duration override is deliberate and it costs something. `Button`
 * transitions its colours at `--duration-hover` (220ms) and an element gets
 * ONE duration per property, so the fill cannot both hover at 220ms and land
 * with the bar at 350ms. The bar wins, on motion.css's own argument: fill,
 * hairline and copy have to arrive together or the flip reads as a stutter.
 * The price is a 350ms hover on this one button, and nowhere else.
 */
const CTA_INK_FLIP =
  'duration-(--duration-ink) group-data-[ink=dark]:bg-ink group-data-[ink=dark]:text-white group-data-[ink=dark]:hover:bg-ink/85'

export function SiteNav({ settings }: SiteNavProps) {
  const navItems = settings?.navItems ?? []
  const cta = settings?.primaryCta ?? null

  return (
    <header
      id={NAV_INK_TARGET}
      className="lg:px-gutter group fixed inset-x-0 top-0 z-50 lg:top-[30px]"
    >
      <NavInk />
      <nav
        aria-label="Primary"
        // The 1440 pill carries a hairline at `--color-on-ink-line`; without
        // it the `bg-scrim` fill is invisible over a dark hero and the pill
        // stops reading as a pill at all. Flipped, both sides invert together:
        // `--color-scrim-light` over `--color-on-light-line`.
        //
        // `color` lives here rather than on each link so the one transition on
        // this element carries the whole bar — the links, the hamburger's
        // `currentColor` bars and anything else added to the row inherit the
        // value mid-interpolation, and each keeps its own hover timing.
        className="bg-scrim lg:border-on-ink-line group-data-[ink=dark]:bg-scrim-light lg:group-data-[ink=dark]:border-on-light-line group-data-[ink=dark]:text-fg duration-(--duration-ink) flex items-center justify-between px-5 py-2 text-white backdrop-blur-[14px] transition-[background-color,border-color,color] ease-out lg:mx-auto lg:w-full lg:max-w-[822px] lg:rounded-full lg:border lg:px-8"
      >
        <Link
          href="/"
          aria-label={`${settings?.title ?? 'O3'} home`}
          className="focus-visible:ring-brand shrink-0 focus-visible:outline-none focus-visible:ring-2"
        >
          {/* White at rest, `264:52`'s black tile once the bar is over a light
              band. `color="white"` already sets `--logo-counterform`; the
              override below only has to name the other end of each pair. */}
          <BrandLogo
            color="white"
            size={64}
            className="group-data-[ink=dark]:text-ink-deep group-data-[ink=dark]:[--logo-counterform:white]"
          />
        </Link>

        {/* 1440: the 589px row (`1710:2245`). `contents` promotes the list
            items to flex children, so space-between spreads links and CTA. */}
        <div className="hidden items-center justify-between lg:flex lg:w-[589px]">
          <ul className="contents">
            {navItems.map((item, i) => (
              <li key={item._key ?? `nav-${i}`}>
                <Link
                  href={resolveCtaHref(item)}
                  // `Button / Ghost` ships no Hover variant, so this hover is a
                  // code decision rather than a read one (#38's State rule).
                  // No `text-*` here: the ink is the bar's, inherited, so the
                  // flip needs no second rule per link.
                  className="text-button focus-visible:ring-brand duration-(--duration-hover) transition-opacity ease-out hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {cta ? <CtaLink cta={cta} arrow variant="light" buttonClassName={CTA_INK_FLIP} /> : null}
        </div>

        {/* 402: CTA + hamburger, 32px apart (`1814:1632`). The 402 bar crosses
            the same bands the pill does, so its CTA flips on the same terms. */}
        <div className="flex items-center gap-8 lg:hidden">
          {cta ? <CtaLink cta={cta} arrow variant="light" buttonClassName={CTA_INK_FLIP} /> : null}
          <MobileNavMenu items={navItems} cta={cta} />
        </div>
      </nav>
    </header>
  )
}

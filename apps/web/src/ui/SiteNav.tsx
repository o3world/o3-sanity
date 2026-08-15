import Link from 'next/link'

import { BrandMark, SurfaceProvider } from '@o3/ui'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { ButtonLink } from '@/content/ButtonLink'
import { resolveButtonHref } from '@/content/buttonDestination'

import { MobileNavMenu } from './MobileNavMenu'
import { NAV_INK_TARGET, NavInk } from './NavInk'

interface SiteNavProps {
  settings: SITE_SETTINGS_QUERY_RESULT
}

/**
 * The site nav, built to Figma's `NavBar` component — #41. The 2026-08 pass
 * rebuilt that component as `2225:2920` and emptied the node the measurements
 * below were read from (`1710:2271`); the labels and the composition are
 * unchanged, so the node ids in this file are kept as the provenance of each
 * value rather than rewritten to a frame they were not read from.
 *
 * The two widths are **structurally** different, which makes this a
 * composition switch at `lg` rather than a resize (ADR 0006):
 *
 * |        | 402 (`1814:1630`)                 | 1440 (`1710:2271`)                    |
 * | ------ | --------------------------------- | ------------------------------------- |
 * | Shape  | full-width square bar, `8px 20px` | 900px pill, radius 900px, `8px 32px`  |
 * | Links  | behind "Open menu"                | five inline, in a 589px space-between |
 * | Button | inline, beside the hamburger      | inline, ending the row                |
 *
 * Both fills are `rgba(3,3,3,0.2)` — `bg-scrim`. It stays an alpha because it
 * sits over whatever the hero is showing. The frames put no blur on it, but
 * the pill carries the prototype's `blur(14px)` anyway: a bar that never
 * leaves crosses photography, headlines and body copy all the way down the
 * page, and a 20% scrim laid straight over a paragraph is unreadable. The
 * carry is deliberate, asked for outright — not a hunch.
 *
 * Figma places the desktop bar over a hero with 164px of top padding — over
 * the page, not in flow. That reads as `lg:absolute`, but the bar is `fixed`
 * at every width: the ink flip below is a **pinned** bar's behaviour — a bar
 * that leaves never crosses a light band and has nothing to flip against.
 *
 * **The offset is 64px** (#88). The `Utility Nav` strip (`2250:1445`) sits
 * above the pill, and the Home frame draws the rebuilt `NavBar` (`2225:2967`, `ABSOLUTE` + `FIXED`) at
 * `y: 64` — the strip's 50px plus a 14px gap. `UtilityNav` renders that strip
 * in flow at the top of the document, so at rest the two sit exactly as the
 * frame draws them; the strip then scrolls away and the pill holds 64px, which
 * is what `FIXED` on that node means. Below `lg` there is no strip and the bar
 * still starts at `top-0`.
 *
 * **The cap is 900px, read off the rebuilt `NavBar` (`2225:2920`) on
 * 2026-08-14** (#91). The component itself is 900 × 80, and every canonical
 * frame carrying the new chrome instances it at exactly that width, unstretched
 * — Home `2225:2967`, Insights index `2336:4382`, Sanity `2332:1679`, Solutions
 * `2354:2584`, each 900px inside a 1440 frame with 270px of margin either side.
 * (Sanity's sits 3px right of centre, 273 / 267. That is a placement nudge in
 * one frame, not a second width.) The pill runs narrower than the Home hero's
 * heading and subheading boxes — 978 and 962 (`2089:4313`, `2089:4318`) — so a
 * bar under its headline is the frame's composition, not a defect to fix.
 *
 * **The skin deliberately does not follow `2225:2920`**, which draws a 12px
 * radius over an opaque `#030303` fill, 16px side padding and a 643px link
 * row, where this ships a full round over `bg-scrim` at 32px and 589px.
 * Reconciling that skin is its own read against the rebuilt component (#91).
 *
 * ── INK FLIP ───────────────────────────────────────────────────────────────
 *
 * Pinned, the bar floats over dark and light bands in turn, so it has two
 * skins. Default — and everything SSR, no-JS and jsdom ever sees — is the dark
 * scrim with white copy. When `NavInk` finds a light surface under the bar's
 * midpoint it sets `data-ink="dark"` on this header, and the `group-data-`
 * variants below swap fill, hairline and copy over `--duration-ink`. The
 * sampling is the prototype's; the styling is CSS off one attribute rather
 * than the prototype's per-element inline writes.
 *
 * Nick's reference of both states (2026-08-02) is the answer sheet, and it is
 * a COLOUR answer sheet only — geometry, blur, fills, hairlines, spacing and
 * the link treatment are as built. Dark pill: white mark, white links. Light
 * pill: ink mark, ink links. The button is the third element on the bar and
 * takes neither skin — see below.
 *
 * **The mark loses its plate rather than inverting.** The bar draws
 * `BrandMark` — the ring and the superscript, free-standing — not
 * `BrandLogo`'s square. So there is nothing to invert: the mark simply takes
 * the bar's ink, white then `--color-fg`, and the tile goes on being a tile
 * everywhere it was one (the footer). An earlier pass read the direction as
 * "invert the tile" and shipped a `Color=White` square; that variant is gone
 * again, and brand-logo.tsx records why.
 *
 * **The button is `Theme=White`** — the pill instances `2205:1298`, a white
 * fill with an ink label `#0A0A0B`. The bar declares itself an `ink` surface
 * (#147, ADR 0026) and the button resolves that fill for itself, the same way
 * a button on any ink band does; nothing here forces one. The bar is the one
 * piece of chrome sitting outside the band system, so without that declaration
 * Auto would have nothing to read exactly where the fill matters most.
 *
 * The fill does not follow the ink flip. Contrast resolves from the surface a
 * band declares, and `NavInk`'s flip is a runtime read of what is passing
 * underneath — so the button holds the skin the frame draws, which is also
 * what every SSR, no-JS and jsdom render sees.
 */
export function SiteNav({ settings }: SiteNavProps) {
  const navItems = settings?.navItems ?? []
  const button = settings?.primaryButton ?? null

  return (
    // Chrome declares its own surface: the pill is a dark scrim over whatever
    // it is floating across, and the mobile bar is the same fill.
    <SurfaceProvider surface="ink">
      <header
        id={NAV_INK_TARGET}
        className="lg:px-gutter group fixed inset-x-0 top-0 z-50 lg:top-[64px]"
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
          className="bg-scrim lg:border-on-ink-line group-data-[ink=dark]:bg-scrim-light lg:group-data-[ink=dark]:border-on-light-line group-data-[ink=dark]:text-fg duration-(--duration-ink) flex items-center justify-between px-5 py-2 text-white backdrop-blur-[14px] transition-[background-color,border-color,color] ease-out lg:mx-auto lg:w-full lg:max-w-[900px] lg:rounded-full lg:border lg:px-8"
        >
          <Link
            href="/"
            aria-label={`${settings?.title ?? 'O3'} home`}
            className="focus-visible:ring-brand shrink-0 focus-visible:outline-none focus-visible:ring-2"
          >
            {/* No text color here on purpose: the mark is `currentColor`, so it
              inherits the bar's ink and rides the bar's own 350ms transition
              rather than carrying a second pair of classes. That also lands it
              on `--color-fg` (#232323) when flipped — the same ink as the
              links, and the exact value the prototype's nav mark flips to. */}
            <BrandMark size={64} />
          </Link>

          {/* 1440: the 589px row (`1710:2245`). `contents` promotes the list
            items to flex children, so space-between spreads links and the
            button. */}
          <div className="hidden items-center justify-between lg:flex lg:w-[589px]">
            <ul className="contents">
              {navItems.map((item, i) => (
                <li key={item._key ?? `nav-${i}`}>
                  <Link
                    href={resolveButtonHref(item)}
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
            {button ? <ButtonLink button={button} /> : null}
          </div>

          {/* 402: button + hamburger, 32px apart (`1814:1632`). The 402 bar
            crosses the same bands the pill does, so its button flips on the
            same terms. */}
          <div className="flex items-center gap-8 lg:hidden">
            {button ? <ButtonLink button={button} /> : null}
            <MobileNavMenu items={navItems} button={button} />
          </div>
        </nav>
      </header>
    </SurfaceProvider>
  )
}

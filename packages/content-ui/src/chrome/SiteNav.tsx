import type { ReactNode } from 'react'
import Link from 'next/link'

import { SurfaceProvider } from '@o3/ui'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { ButtonLink } from '../ButtonLink'
import { resolveButtonHref } from '../buttonDestination'

import { MobileNavMenu } from './MobileNavMenu'
import { NavLink } from './NavLink'
import { NAV_INK_TARGET, NavInk } from './NavInk'

interface SiteNavProps {
  settings: SITE_SETTINGS_QUERY_RESULT
  /**
   * The brand's mark, drawn by the app that mounts this bar (#228). Required
   * with no fallback: a brand that supplies none is a compile error rather
   * than a page wearing the other brand's logo.
   */
  brandMark: ReactNode
}

/**
 * The site nav, built to Figma's `NavBar` component — #41. Desktop is read
 * from `2225:2920`, mobile from the 402 frame's own bar (`1814:1630`).
 *
 * The two widths are **structurally** different, which makes this a
 * composition switch at `lg` rather than a resize (ADR 0006):
 *
 * |        | 402 (`1814:1630`)                 | 1440 (`2225:2920`)                |
 * | ------ | --------------------------------- | --------------------------------- |
 * | Shape  | full-width square bar, `8px 20px` | 900 × 80 bar, radius 12, `16px`   |
 * | Mark   | 64 (`1814:1631`)                  | 48 (`2225:2915`)                  |
 * | Links  | behind "Open menu"                | five inline, in a 643px row       |
 * | Button | inline, beside the hamburger      | inline, ending the row            |
 *
 * The 16px padding and the 48px mark are one measurement, not two: together
 * they are what makes the desktop bar 80px tall.
 *
 * Both fills are `rgba(3,3,3,0.2)` — `bg-scrim`. It stays an alpha because it
 * sits over whatever the hero is showing, and both frames put a `GLASS` effect
 * over it. `blur(14px)` is the prototype's value for that glass, and it is
 * what the bar needs to earn: a bar that never leaves crosses photography,
 * headlines and body copy all the way down the page, and a 20% scrim laid
 * straight over a paragraph is unreadable.
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
 * inverts with them — see below.
 *
 * **The mark is the app's, and the bar sets no colour on it.** Both brands
 * render this bar and their marks are different drawings — O3XO's carries a
 * yellow no shared token role names — so the app passes one in and the bar
 * draws it (#228). A mark that inherits colour rides the bar's ink flip for
 * free; one that carries its own paint keeps it through the flip. Which of
 * those a brand wants is the brand's answer, made where its mark lives.
 *
 * **The button is `Theme=White`** — the pill instances `2205:1298`, a white
 * fill with an ink label `#0A0A0B`. The bar declares itself an `ink` surface
 * (#147, ADR 0026) and the button resolves that fill for itself, the same way
 * a button on any ink band does; nothing here forces one. The bar is the one
 * piece of chrome sitting outside the band system, so without that declaration
 * Auto would have nothing to read exactly where the fill matters most.
 *
 * **The fill follows the ink flip, in CSS.** A white button on the flipped pill
 * is white on `--color-scrim-light` over a light band: the label survives and
 * the button's shape does not, which is the one thing chrome cannot afford. So
 * it inverts on the same `data-ink` signal the links and the hairline already
 * ride, in `NAV_BUTTON_INK` below.
 *
 * It is CSS rather than a resolved value because the flip is: `NavInk` toggles
 * one attribute and the whole bar interpolates off it. That also settles what
 * SSR sees — with no JS there is no attribute, so every server, no-JS and jsdom
 * render draws the frame's skin, and only a browser that has actually measured
 * a light band underneath draws the other one.
 *
 * Only the RESTING fill flips. The set paints every state the same on both
 * themes (`Button`'s `SET_STATES`), so a hover override here would be brand red
 * overriding brand red.
 */
const NAV_BUTTON_INK = 'group-data-[ink=dark]:bg-ink group-data-[ink=dark]:text-white'

export function SiteNav({ settings, brandMark }: SiteNavProps) {
  const navItems = settings?.navItems ?? []
  const button = settings?.primaryButton ?? null

  return (
    // Chrome declares its own surface: the pill is a dark scrim over whatever
    // it is floating across, and the mobile bar is the same fill.
    //
    // NO `surfaceAttrs` HERE, and it is not an omission. This is the one
    // surface that CHANGES without React knowing: `NavInk` toggles
    // `data-ink=dark` on the header below and the pill flips to light copy in
    // CSS, so a static `data-surface="ink"` would repaint the flipped pill's
    // `text-fg` white on white. The chrome draws in literal colours for
    // exactly that reason and needs no role token inverted.
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
          className="bg-scrim lg:border-on-ink-line group-data-[ink=dark]:bg-scrim-light lg:group-data-[ink=dark]:border-on-light-line group-data-[ink=dark]:text-fg lg:rounded-nav duration-(--duration-ink) flex items-center justify-between px-5 py-2 text-white backdrop-blur-[14px] transition-[background-color,border-color,color] ease-out lg:mx-auto lg:w-full lg:max-w-[900px] lg:border lg:px-4 lg:py-4"
        >
          <Link
            href="/"
            aria-label={`${settings?.title ?? 'O3'} home`}
            className="focus-visible:ring-brand shrink-0 focus-visible:outline-none focus-visible:ring-2"
          >
            {/* No text color here on purpose: a mark drawn in `currentColor`
              inherits the bar's ink and rides the bar's own 350ms transition
              rather than carrying a second pair of classes. That is what lands
              O3's on `--color-fg` (#232323) when flipped — the same ink as the
              links, and the exact value the prototype's nav mark flips to. */}
            {brandMark}
          </Link>

          {/* 1440: the 643px row (`2225:2740`), five links and the button at a
            48px gap. `contents` promotes the list items to flex children, so
            the gap falls between links and button alike and the row runs to
            its own width rather than a declared one. */}
          <div className="hidden items-center lg:flex lg:gap-12">
            <ul className="contents">
              {navItems.map((item, i) => (
                <li key={item._key ?? `nav-${i}`}>
                  <NavLink
                    href={resolveButtonHref(item)}
                    // The bar's own `Link` set (`2225:2894`) ships the hover:
                    // `State=Hover` is `#EB1000` — `--color-brand` — against
                    // the default's white. It is a colour, not a variant, so it
                    // lands as a `hover:` rule (#38's State rule) and it is the
                    // same red on both skins, which is why the flip needs no
                    // second rule. No resting `text-*` here: that ink is the
                    // bar's, inherited. The current section takes that same
                    // red at rest — see `NavLink`.
                    className="text-button hover:text-brand focus-visible:ring-brand duration-(--duration-hover) transition-colors ease-out focus-visible:outline-none focus-visible:ring-2"
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            {button ? <ButtonLink button={button} className={NAV_BUTTON_INK} /> : null}
          </div>

          {/* 402: button + hamburger, 32px apart (`1814:1632`). The 402 bar
            crosses the same bands the pill does, so its button flips on the
            same terms. */}
          <div className="flex items-center gap-8 lg:hidden">
            {button ? <ButtonLink button={button} className={NAV_BUTTON_INK} /> : null}
            <MobileNavMenu items={navItems} button={button} />
          </div>
        </nav>
      </header>
    </SurfaceProvider>
  )
}

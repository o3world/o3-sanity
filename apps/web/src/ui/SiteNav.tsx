import Link from 'next/link'

import { BrandMark } from '@o3/ui'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { CtaLink, resolveCtaHref } from '@/content/CtaLink'

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
 * |       | 402 (`1814:1630`)                 | 1440 (`1710:2271`)                     |
 * | ----- | --------------------------------- | -------------------------------------- |
 * | Shape | full-width square bar, `8px 20px` | 900px pill, radius 900px, `8px 32px`   |
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
 * Figma places the desktop bar over a hero with 164px of top padding — over the
 * page, not in flow. c1ee258 read that as `lg:absolute` and let the desktop bar
 * scroll away. It is `fixed` at every width again, because the ink flip below
 * is a **pinned** bar's behaviour: a bar that leaves never crosses a light band
 * and has nothing to flip against.
 *
 * **The offset is 64px, not the 30px this shipped with** (#88). The 2026-08
 * pass put the `Utility Nav` strip (`2250:1445`) above the pill, and the Home
 * frame draws the rebuilt `NavBar` (`2225:2967`, `ABSOLUTE` + `FIXED`) at
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
 * one frame, not a second width.) Four frames agreeing is what made a shared
 * dimension safe to move; reading it off one frame is how it went wrong before.
 *
 * The 1130 this replaces was measured off `.figma/frames/hero-image.png` — the
 * hero exported at 1440 × 892 / 1.7014×, where the pill's stroke ran x 267.5 →
 * 2190, or 1923 frame px. That read was right for `1710:2271`, which the
 * 2026-08 pass then emptied. **The proportion check inverted with it**: the old
 * note said to expect a pill comfortably WIDER than the headline it sits over,
 * and at 900 it is narrower — the Home hero's heading and subheading boxes are
 * 978 and 962 (`2089:4313`, `2089:4318`), both wider than the bar. That is the
 * rebuilt frame's own composition, so it is the new thing to check against.
 *
 * **Only the width moved.** `2225:2920` also draws a 12px radius over an opaque
 * `#030303` fill, 16px side padding and a 643px link row, where this ships a
 * full round over `bg-scrim` at 32px and 589px. Reconciling that skin is a
 * separate read against the rebuilt component, not part of this cap.
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
 * the link treatment are as built. Dark pill: white mark, white links, red CTA.
 * Light pill: ink mark, ink links, red CTA.
 *
 * **The mark loses its plate rather than inverting.** The bar draws
 * `BrandMark` — the ring and the superscript, free-standing — not
 * `BrandLogo`'s square. So there is nothing to invert: the mark simply takes
 * the bar's ink, white then `--color-fg`, and the tile goes on being a tile
 * everywhere it was one (the footer). An earlier pass read the direction as
 * "invert the tile" and shipped a `Color=White` square; that variant is gone
 * again, and brand-logo.tsx records why.
 *
 * **The CTA is brand red on both surfaces** — the one thing on the bar that
 * does not move. That is the prototype's `.o3btn` and it is now Nick's
 * reference too, which matters because `Button` has no red fill: "there is no
 * red button on the canonical Home frame" is still true of every content band,
 * and the red here is chrome forcing its own fill rather than a variant an
 * editor could reach. See `CTA_BRAND_RED`.
 */
/**
 * The nav CTA's fill, forced past the editor's choice and past `Button`'s
 * three variants.
 *
 * **Nav only, and deliberately not a variant.** `cta.variant` is a schema enum
 * — anything added to the cva is something a Site Settings editor can put on a
 * content band, and the canonical frames have no red button (button.tsx; the
 * `brand → dark` legacy mapping in CtaLink.tsx exists to retire exactly that).
 * The chrome owns its own surface, so it forces its own fill instead — three
 * classes that `cn` resolves over whichever variant is underneath.
 *
 * `variant="light"` stays on the call sites even though this replaces all
 * three of its classes. It pins the BASE the override lands on: without it the
 * editor's `cta.variant` decides, and `ghost` would leave its own
 * `hover:opacity-70` in place beside this hover — an editor field quietly
 * changing the nav.
 *
 * Anchored twice: the prototype's `.o3btn` is `#EB1000` on both nav states,
 * and Nick's 2026-08-02 reference draws it red on the light pill and the dark
 * one alike. The hover follows the house idiom (`Button`'s own
 * `dark: bg-ink … hover:bg-ink/85`), not the prototype's `#d5d5d5`, which is a
 * prototype artefact with no token behind it.
 *
 * No `--duration-ink` here: this fill never changes with the bar, so the
 * button keeps `Button`'s own 220ms hover.
 */
const CTA_BRAND_RED = 'bg-brand text-white hover:bg-brand/85'

export function SiteNav({ settings }: SiteNavProps) {
  const navItems = settings?.navItems ?? []
  const cta = settings?.primaryCta ?? null

  return (
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
          {cta ? <CtaLink cta={cta} arrow variant="light" buttonClassName={CTA_BRAND_RED} /> : null}
        </div>

        {/* 402: CTA + hamburger, 32px apart (`1814:1632`). The 402 bar crosses
            the same bands the pill does, so its CTA flips on the same terms. */}
        <div className="flex items-center gap-8 lg:hidden">
          {cta ? <CtaLink cta={cta} arrow variant="light" buttonClassName={CTA_BRAND_RED} /> : null}
          <MobileNavMenu items={navItems} cta={cta} />
        </div>
      </nav>
    </header>
  )
}

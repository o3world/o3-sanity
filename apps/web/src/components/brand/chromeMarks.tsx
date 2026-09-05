import { BrandMark } from '@o3/ui'

/**
 * The marks this app hands the shared chrome (#228).
 *
 * `SiteNav` and `SiteFooter` draw no mark of their own — both brands render
 * them — so the app passes one in, and the size travels with it because how big
 * a mark runs is a property of its own proportions.
 *
 * Both are `BrandMark`: the ring and the superscript free-standing, in
 * `currentColor`. That is what lets the nav's ink flip carry the mark and the
 * footer's white reach it, with no colour class at either call site.
 *
 * Held here rather than written at each call site so the layout and the
 * `Pages` story mockups cannot drift apart — the mockups stand in for the
 * layout, so a mark changed in one has to be the mark in the other.
 */

/**
 * The drawn mark stays 38.84px at both widths (`1814:1631`, `2225:2915`).
 * #446 trims the old tile's empty SVG space so the ink starts at the link's
 * left edge. The wrapper retains the 64px mobile touch target and the 48px
 * desktop footprint, keeping the header height unchanged.
 */
export const NAV_MARK = (
  <span className="flex size-16 items-center lg:size-12">
    <BrandMark trim size={38.84} />
  </span>
)

/** The footer's vector, tight-bounded: 128 at 402, 148 at 1440 (`1280:1856`, `2225:2613`). */
export const FOOTER_MARK = <BrandMark trim size={128} className="lg:size-[148px]" />

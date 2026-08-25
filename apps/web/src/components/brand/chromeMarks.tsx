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
 * **The drawn mark is 38.84px at both widths** — `1814:1631` is a 64 box and
 * `2225:2915` a 48 one, but the vector inside each is the same geometry at the
 * same scale, the 48 box being the 64 box cropped 8px on every side. So the box
 * shrinks at `lg` and the mark does not: `-m-2` takes 8 off each edge of a box
 * that stays 64, which is the crop itself rather than a second size. Scaling the
 * svg to 48 instead drew the mark at 29 — three quarters of the frame's.
 *
 * The 48px box is what makes the pill 80 tall, and it still does: the button is
 * 48 too, so the row's height is unchanged either way.
 */
export const NAV_MARK = <BrandMark size={64} className="lg:-m-2" />

/** The footer's vector, tight-bounded: 128 at 402, 148 at 1440 (`1280:1856`, `2225:2613`). */
export const FOOTER_MARK = <BrandMark trim size={128} className="lg:size-[148px]" />

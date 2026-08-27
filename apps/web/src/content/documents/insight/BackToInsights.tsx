import Link from 'next/link'

import { ArrowIcon } from '@o3/ui'
import { collectionPrefixes } from '@o3/sanity/brand'

/**
 * "← All Insights" — the article's way back to its index (precursor
 * `1379:2186`, one of the two behaviours #45 takes from the html.to.design
 * import; the canonical frame omits it).
 *
 * **The label is the type name now.** It used to read
 * `siteSettings.perspectivesLabel`, because the collection was a `perspective` in
 * the code and an "Insight" on screen, and something had to translate. ADR
 * 0017 removed the gap: the type is `insight`, so the field mapped a word onto
 * itself and went with it. That also drops a settings fetch from this
 * component, which is why it is no longer async.
 */
export function BackToInsights() {
  return (
    <Link
      href={collectionPrefixes().insight}
      // The ring carries no offset, which is what every nav link here does —
      // this one sits on the article's ink hero, where an offset would draw a
      // white gap around it.
      className="focus-visible:ring-brand duration-(--duration-hover) group inline-flex w-fit items-center gap-2 text-[15px] text-white/60 transition-colors ease-out hover:text-white focus-visible:outline-none focus-visible:ring-2"
    >
      {/* The mirror of a card's trailing nudge (`CARD_ARROW_NUDGE`): this arrow
          points back, so it leans that way. Written out rather than shared,
          because one call site is composition and not vocabulary. `rotate-180`
          and the nudge write different properties in Tailwind v4 — `rotate` and
          `translate` — so the reduced-motion cancel stops the lean without
          unturning the glyph. */}
      <ArrowIcon className="duration-(--duration-hover) motion-reduce:group-hover:translate-none motion-reduce:group-focus-visible:translate-none rotate-180 transition-transform ease-out group-hover:-translate-x-1 group-focus-visible:-translate-x-1 motion-reduce:transition-none" />
      All Insights
    </Link>
  )
}

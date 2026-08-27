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
      className="focus-visible:ring-brand duration-(--duration-hover) inline-flex w-fit items-center gap-2 text-[15px] text-white/60 transition-colors ease-out hover:text-white focus-visible:outline-none focus-visible:ring-2"
    >
      <ArrowIcon className="rotate-180" />
      All Insights
    </Link>
  )
}

import Link from 'next/link'

import { ArrowIcon } from '@o3/ui'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'

import { getSiteSettings } from '@/sanity/siteSettings'

/** What the label falls back to when Site Settings has not been filled in. */
const FALLBACK_LABEL = 'Perspectives'

/**
 * "← All insights" — the article's way back to its index (precursor
 * `1379:2186`, one of the two behaviours #45 takes from the html.to.design
 * import; the canonical frame omits it).
 *
 * **The label is not hardcoded.** "Insights" is display copy, not the domain
 * term — CONTEXT.md is explicit that the collection is a **Perspective** and
 * that nav display labels live in Site Settings. So the copy comes from
 * `siteSettings.perspectivesLabel`, the same field the nav reads, and a rename
 * there moves this link with it. `getSiteSettings` is `React.cache`d, so this
 * is the layout's fetch, not a second one.
 *
 * Async and separate from `PerspectiveView` on purpose: it keeps the view a
 * pure function of its document, which is what makes it renderable from a
 * fixture without a settings round-trip.
 */
export async function BackToPerspectives() {
  const settings = await getSiteSettings()
  const label = settings?.perspectivesLabel?.trim() || FALLBACK_LABEL

  return (
    <Link
      href={COLLECTION_PREFIXES.perspective}
      className="duration-(--duration-hover) inline-flex w-fit items-center gap-2 text-[15px] text-white/60 transition-colors ease-out hover:text-white"
    >
      <ArrowIcon className="rotate-180" />
      {`All ${label}`}
    </Link>
  )
}

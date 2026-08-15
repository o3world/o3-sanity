import { stegaClean } from '@sanity/client/stega'

import type { SanityBlock } from '@o3/sanity/types'

/**
 * WHERE A SECTION'S ANCHOR BECOMES AN `id` (#149).
 *
 * Every section block carries an `anchor` an editor names
 * (`packages/sanity/src/schemas/blocks/fields.ts`), and a button pointing at
 * one emits `#` + the stored value verbatim (`buttonDestination`). So the id
 * this returns is the stored value, untouched apart from the two things a
 * document can carry that a selector cannot: draft-mode stega characters, and
 * whitespace the field's validation already refuses.
 *
 * **Resolved for the whole array at once, because duplicates are only visible
 * from there.** Two bands may hold the same name — nothing in a per-band form
 * can see the other one — and two elements with one id is invalid HTML that
 * browsers resolve by scrolling to the first. That is the answer this keeps:
 * the first band claiming a name gets the id, and a later band holding the same
 * name renders with none. The link lands exactly where it would have anyway,
 * and the page stays valid on the way.
 *
 * The alternative — suffixing the loser, `pricing-2` — invents a target no
 * button can point at, since the button's field holds what the editor typed.
 */
export function sectionAnchors(blocks: readonly SanityBlock[]): Map<string, string> {
  const claimed = new Set<string>()
  const byKey = new Map<string, string>()

  for (const block of blocks) {
    const anchor = (stegaClean((block as { anchor?: string | null }).anchor) ?? '').trim()
    if (!anchor || claimed.has(anchor)) continue
    claimed.add(anchor)
    byKey.set(block._key, anchor)
  }

  return byKey
}

/**
 * The offset a jump link needs to clear the pinned bar.
 *
 * `SiteNav` is `fixed` at every width — 64px down with the 80px pill below
 * `lg`'s utility strip, and flush at `top-0` on the square bar above it — so a
 * band scrolled to its own top arrives underneath it. `scroll-margin-top` is
 * the browser's own answer and costs nothing to anything that is not a jump
 * target, which is why it rides on the anchored wrapper rather than on the
 * band.
 */
export const ANCHOR_OFFSET_CLASS = 'scroll-mt-20 lg:scroll-mt-40'

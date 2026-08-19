/*
 * The `Blocks` boundary exists so a document VIEW cannot bypass it and
 * silently lose the Presentation editing path (#15). This is not a view: it is
 * a story fixture, and `Blocks` is unusable here because it awaits
 * `draftMode()`, which needs a Next request scope a browser test does not
 * have. Rendering the published path directly is the right answer for a
 * mockup — see this component's doc comment. Any real view importing
 * `BlockRenderer` instead of `Blocks` is still an error.
 */
// eslint-disable-next-line no-restricted-imports -- story fixture, not a view; see above
import { BlockRenderer } from '@/content/blocks/BlockRenderer'
import { FOOTER_MARK, NAV_MARK } from '@/brand/chromeMarks'
import { SiteFooter, SiteNav } from '@o3/content-ui/chrome'

import { SITE_SETTINGS, seededPage, type SeedPageName } from '@o3/content-ui/testing/seed'

/**
 * A whole page, chrome included, from committed content — what the `Pages`
 * section of the sidebar renders.
 *
 * A section-block story answers "is this band right". Nothing answered "is the
 * **page** right" — whether the bands stack in the frame's order, whether two
 * adjacent surfaces collide, whether the pinned nav is legible over the band
 * it actually lands on, whether the rhythm between bands matches the frame's.
 * Those are page-level properties, and they are most of what a Figma page
 * frame is showing.
 *
 * ── WHAT THIS IS NOT ───────────────────────────────────────────────────────
 *
 * Not the route. `Blocks` resolves draft mode and picks the server or
 * Presentation renderer; there is no request scope in a browser test, so this
 * renders `BlockRenderer` — the published path — directly. Visual editing
 * attributes are therefore absent, which is correct: nothing here is in
 * Presentation.
 *
 * Not the data path either. `renderRoute` (the render layer) is what proves a
 * route fetches, resolves and 404s properly. This proves what the route's
 * output looks like.
 *
 * ── THE NAV IS FIXED, AND THAT IS THE POINT ────────────────────────────────
 *
 * `SiteNav` is `position: fixed` at every width, so it floats over the mockup
 * exactly as it floats over the page — and `NavInk` samples what is under it
 * on every scroll frame, so scrolling one of these stories is the only place
 * outside the running app where the ink flip can be watched against real
 * bands. That is worth more than a screenshot of the bar on its own.
 */
export function PageMockup({ page }: { page: SeedPageName }) {
  const doc = seededPage(page)

  return (
    <div className="bg-white">
      <SiteNav settings={SITE_SETTINGS} brandMark={NAV_MARK} />
      <main>
        <BlockRenderer blocks={doc.sections ?? []} />
      </main>
      <SiteFooter settings={SITE_SETTINGS} brandMark={FOOTER_MARK} />
    </div>
  )
}

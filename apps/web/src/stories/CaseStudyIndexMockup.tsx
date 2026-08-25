import type { CASE_STUDIES_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { CaseStudyIndexView } from '@/content/documents/caseStudy/CaseStudyIndexView'
import { FOOTER_MARK, NAV_MARK } from '@/components/brand/chromeMarks'
import { SiteFooter, SiteNav } from '@o3/content-ui/chrome'

import {
  CASE_STUDIES,
  SITE_SETTINGS,
  STORY_YEAR,
  seededCollectionIndex,
} from '@o3/content-ui/testing/seed'

/*
 * The story's own way into a section array. A view may only render blocks
 * through `Blocks`, which reads draft mode off `next/headers` and so cannot
 * run in a browser; a mockup is a story fixture rather than a view, which is
 * the same exemption `PageMockup` and `InsightIndexMockup` take.
 */
// eslint-disable-next-line no-restricted-imports -- story fixture, not a view; see above
import { BlockRenderer } from '@/content/blocks/BlockRenderer'

type IndexData = NonNullable<CASE_STUDIES_PAGE_QUERY_RESULT>

/** Nine, as the route's entry sets — the cards are full-width bands. */
const PAGE_SIZE = 9

/**
 * `/work` as a whole page, chrome included — the Work half of what
 * `InsightIndexMockup` does for `/insights` (#348).
 *
 * It exists to give this route a **whole-page pixel surface**. Until it did,
 * `pnpm vr` could diff the Case Study Card and the CTA band but nothing that
 * showed them in sequence, so the one property only a page mockup carries —
 * the surface run, ink → white → ink → black — was unwatched on the route that
 * has the site's other index composition.
 *
 * Everything here is committed content. The feed is `CASE_STUDIES`, the three
 * translated case studies the homepage showcase already draws; the bands above
 * and below it are the collection index's own seed, through the same block
 * renderer. So nothing on this mockup is authored for it, and a seed that
 * drifts from its frame shows up here.
 *
 * **The white grid band is the difference from /insights**, and it is the
 * reason both mockups exist rather than one: Insights lays its cards on bone
 * because two ink bands either side of white would read as two pages, and Work
 * lays its on white because the cards carry their own photographs and a bone
 * field behind them muddies the scrim.
 */
export function CaseStudyIndexMockup({
  page = 1,
}: {
  /** The page the URL would carry. */
  page?: number
}) {
  const totalPages = Math.max(1, Math.ceil(CASE_STUDIES.length / PAGE_SIZE))
  const items = CASE_STUDIES.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const chrome = seededCollectionIndex('work')

  return (
    <div className="bg-white">
      <SiteNav settings={SITE_SETTINGS} brandMark={NAV_MARK} />
      <main>
        <CaseStudyIndexView
          // One cast: `CASE_STUDIES` is the committed card projection, which
          // is the same fragment the index query returns — the seed tree types
          // it loosely because it is read off JSON.
          items={items as unknown as IndexData['items']}
          pagination={{ page, totalPages }}
          above={<BlockRenderer blocks={chrome.sectionsAbove} />}
          below={<BlockRenderer blocks={chrome.sectionsBelow} />}
        />
      </main>
      <SiteFooter settings={SITE_SETTINGS} brandMark={FOOTER_MARK} year={STORY_YEAR} />
    </div>
  )
}

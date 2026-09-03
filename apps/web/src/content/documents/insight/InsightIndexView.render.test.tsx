import { isValidElement, type ReactElement, type ReactNode } from 'react'
import Link from 'next/link'
import { describe, expect, it } from 'vitest'

import { InsightIndexView } from './InsightIndexView'

/**
 * The filter bar's navigation policy, asserted on the props the chips hand
 * `next/link` rather than on the markup: `scroll` never reaches the DOM, so
 * the rendered HTML the rest of this route's tests read cannot see it.
 */
function linksIn(node: ReactNode): ReactElement<{ href: string; scroll?: boolean }>[] {
  if (Array.isArray(node)) return node.flatMap(linksIn)
  if (!isValidElement(node)) return []

  const element = node as ReactElement<{ href?: string; children?: ReactNode }>
  const nested = linksIn(element.props.children)
  return element.type === Link
    ? [element as ReactElement<{ href: string; scroll?: boolean }>, ...nested]
    : nested
}

const CATEGORIES = [
  { title: 'AI', slug: 'artificial-intelligence-ai' },
  { title: 'Design', slug: 'design' },
]

function chips(category: string | null) {
  const tree = InsightIndexView({
    items: [],
    categories: CATEGORIES,
    category,
    pagination: { page: 1, totalPages: 1 },
  })

  return linksIn(tree)
}

describe('insights filter bar', () => {
  /**
   * A chip is followed to read the cut it names, so the viewport belongs at
   * the head of the feed — the bar itself, with the refreshed grid under it.
   * Two ways to get that wrong: Next's default sends a new route to the top of
   * the document, above the hero, and `scroll={false}` leaves the reader
   * wherever they were, which from the foot of the feed is a page that appears
   * not to have responded. `#feed` is the answer to both, and suppressing the
   * scroll would switch it off.
   */
  it.each([
    ['a filtered index', 'design'],
    ['the unfiltered index', null],
  ])('lands a chip at the head of the feed from %s', (_label, category) => {
    const followed = chips(category)

    expect(followed.length).toBeGreaterThan(0)
    for (const chip of followed) {
      expect(chip.props.href).toMatch(/#feed$/)
      expect(chip.props.scroll).not.toBe(false)
    }
  })

  it('resets the page when a chip changes the cut', () => {
    const hrefs = chips('design').map((chip) => chip.props.href)

    expect(hrefs).toContain('/insights#feed')
    expect(hrefs).toContain('/insights/category/artificial-intelligence-ai#feed')
    expect(hrefs).toContain('/insights/category/design#feed')
  })
})

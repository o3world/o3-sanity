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
   * A chip is clicked with the filter bar on screen, so the refreshed feed
   * belongs under it — Next's default of scrolling a new route to the top
   * throws the reader back above the hero instead.
   */
  it('keeps the reader where the bar is when a chip is followed', () => {
    const followed = chips('design')

    expect(followed.length).toBeGreaterThan(0)
    for (const chip of followed) expect(chip.props.scroll).toBe(false)
  })

  it('keeps the reader in place from the unfiltered index too', () => {
    const followed = chips(null)

    expect(followed.length).toBeGreaterThan(0)
    for (const chip of followed) expect(chip.props.scroll).toBe(false)
  })
})

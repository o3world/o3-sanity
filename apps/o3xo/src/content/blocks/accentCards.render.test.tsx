import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'

import { buildCatchAllRoute, buildSingletonRoute } from '@o3/content-runtime/routes'
import { CATCH_ALL_TYPES } from '@/content/documents'
import { aCorpusPage, renderRoute, siteSettings, withSettings } from '@/test'

import { home } from '../documents/page/entry'

/**
 * The accent card families, through this app's registry (#244).
 *
 * `accent` is O3XO's alone, so both cards are app-local and reach a page only
 * through a binding `apps/web` does not make. What has to hold is that the
 * binding is the one that runs: the same block types, rendered by this app,
 * come out on a yellow plate.
 *
 * Asserted against the **committed** corpus (`tools/migration/data-o3xo/`)
 * rather than a fixture written to match, for the reason the page route's own
 * tests are: the dataset is disposable (ADR 0003), so "it looked right in the
 * browser once" is not a check that survives a rebuild.
 */
const settings = siteSettings({ title: 'O3XO' })
const catchAll = buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY)

/**
 * The plates, told apart by their element: the metric card is a figure in a
 * list, the text card is an `<article>`. Both paint `accent` and nothing else
 * on either page does.
 */
const metricPlates = (html: string) => html.match(/<div[^>]*\bbg-accent\b/g) ?? []
const textPlates = (html: string) => html.match(/<article[^>]*\bbg-accent\b/g) ?? []

const homepage = await renderRoute(buildSingletonRoute(home), {
  data: withSettings(aCorpusPage(), settings),
})

const construction = await renderRoute(catchAll, {
  data: withSettings(aCorpusPage('industries/construction'), settings),
  params: { segments: ['industries', 'construction'] },
})

describe('the key metric card', () => {
  it('draws the homepage’s three metrics as accent plates', () => {
    expect(metricPlates(homepage.html)).toHaveLength(3)
    expect(homepage.html).toContain('50%+')
    expect(homepage.html).toContain('Average efficiency gains')
  })

  /**
   * The band is ink, and `[data-surface='ink']` re-points `--color-fg` to a
   * white alpha for everything inside it — 1.7:1 on a yellow plate. `ink` is
   * the role no surface re-points, so the plate keeps the figure the frame
   * draws. Asserted here rather than left to a story: axe's `color-contrast`
   * rule is held back repo-wide, so no story would have caught it.
   */
  it('sets its copy in a role the band’s surface cannot repaint', () => {
    expect(homepage.html).toMatch(/bg-accent[^"]*\btext-ink\b/)
    expect(homepage.html).not.toMatch(/bg-accent[^"]*\btext-fg\b/)
  })
})

describe('the yellow text card', () => {
  it('draws the pain-points band’s four panels as accent plates', () => {
    expect(textPlates(construction.html)).toHaveLength(4)
    expect(construction.html).toContain('Time-intensive estimation processes')
    expect(construction.html).toContain('Messy handoffs from precon to construction')
  })

  /** The homepage's partner band is the same layout, so it gets the same card. */
  it('draws every cards-layout band, not only the industry pages’', () => {
    expect(textPlates(homepage.html)).toHaveLength(4)
  })

  /**
   * The band's other layouts are the shared renderer's, unchanged — only the
   * card the `cards` layout draws is this app's. The same page carries a
   * `rows` band, which still comes out in the shared composition.
   */
  it('leaves the band’s other layouts to the shared renderer', () => {
    expect(construction.html).toContain('From strategy to profitable delivery')
  })
})

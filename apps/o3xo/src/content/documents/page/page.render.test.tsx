import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'

import { buildCatchAllRoute, buildSingletonRoute } from '@o3/content-runtime/routes'
import { CATCH_ALL_TYPES } from '@/content/documents'
import {
  aCorpusPage,
  bandPaths,
  expectNotFound,
  renderRoute,
  siteSettings,
  withSettings,
} from '@/test'

import { home } from './entry'

/**
 * The two routes a `page` document is served through: `/` (the singleton) and
 * `[...segments]` (the catch-all), both against the **committed** corpus —
 * the homepage extracted from o3xo.ai (#220) — rather than a fixture written
 * to match.
 *
 * That is what makes this survive a rebuild. The dataset is disposable
 * (ADR 0003), so "it looked right in the browser once" proves nothing about
 * the next wipe-and-load; what has to hold is that the JSON in
 * `data-o3xo/converted/page/` renders through code nobody wrote specially
 * for it.
 */
const settings = siteSettings({ title: 'O3XO' })
const seeded = aCorpusPage()

const homeRoute = buildSingletonRoute(home)
const catchAll = buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY)

const rendered = await renderRoute(homeRoute, { data: withSettings(seeded, settings) })

describe('the migrated homepage', () => {
  it('dispatches every section in the array — none silently dropped', () => {
    const sections = (seeded.sections ?? []) as unknown[]
    expect(sections.length).toBeGreaterThanOrEqual(3)
    // The dispatcher wraps each block in a keyed div stamped with its own
    // path, so the count is the honest measure of "did anything fail to
    // dispatch" — a block type this app's registry does not bind renders
    // nothing and says nothing.
    expect(bandPaths(rendered.html)).toHaveLength(sections.length)
  })

  it('renders the bands the extracted homepage composes', () => {
    expect(rendered.html).toContain('Activate AI advantage')
    expect(rendered.html).toContain('Key metrics across accounts')
  })

  it('canonicalises the homepage at the root', () => {
    expect(rendered.metadata.title).toContain('Activate AI advantage')
    expect(rendered.metadata.alternates?.canonical).toBe('http://localhost:3000/')
  })
})

describe('the catch-all page route', () => {
  /**
   * A multi-segment slug carries its own prefix (ADR 0001) — the builder joins
   * the segments and matches `slug.current`, and `hrefForDoc` leaves it alone.
   * No seed is nested yet, so the seeded page stands in at a nested slug.
   */
  it('serves a multi-segment slug at the path its segments spell', async () => {
    const nested = { ...seeded, slug: 'about/how-we-work' }
    const { html, metadata, calls } = await renderRoute(catchAll, {
      data: withSettings(nested, settings),
      params: { segments: ['about', 'how-we-work'] },
    })

    expect(calls[0]?.params).toMatchObject({ slug: 'about/how-we-work' })
    expect(html).toContain('Activate AI advantage')
    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/about/how-we-work')
  })

  it('404s when no document matches the segments', async () => {
    await expectNotFound(catchAll, {
      data: withSettings(null, settings),
      params: { segments: ['nothing', 'here'] },
    })
  })
})

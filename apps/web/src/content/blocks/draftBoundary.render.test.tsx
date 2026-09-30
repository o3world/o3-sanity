import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'

import { buildCatchAllRoute } from '@o3/content-runtime/routes'
import { CATCH_ALL_TYPES } from '@/content/documents'
import { aMigratedPage, renderRoute, siteSettings, withSettings } from '@/test'

/**
 * The draft renderer behind its lazy boundary (#269).
 *
 * `ClientBlockRenderer` is now a `next/dynamic` shell over
 * `OptimisticBlockRenderer`, which is what keeps Presentation's comlink
 * machinery out of a published page. A lazy boundary that fails to resolve
 * renders NOTHING — no error, no warning, a blank preview — so the thing worth
 * pinning is that the draft path still produces the same page the published
 * path does, plus the array wrapper only the draft renderer emits.
 */
const route = buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY)
const slug = 'privacy-policy'

async function render(draft: boolean) {
  const doc = aMigratedPage(slug)
  const { html } = await renderRoute(route, {
    data: withSettings(doc, siteSettings()),
    params: { path: [slug] },
    draft,
  })
  return { doc, html }
}

// Rendered once, at module scope: the first draft render is a cold import of
// `OptimisticBlockRenderer` through the lazy boundary, which can outlast a
// test's timeout under full-suite load. Sequential, because draft mode is a
// module-level switch in the `next/headers` stub.
const published = await render(false)
const draft = await render(true)

describe('the draft block renderer', () => {
  it('renders every section a published request renders', () => {
    const sections = (draft.doc.sections ?? []) as unknown[]
    expect(sections.length).toBeGreaterThan(0)
    expect(draft.html).toContain(draft.doc.title as string)
    expect(draft.html.match(/<h2[\s>]/g) ?? []).toHaveLength(
      published.html.match(/<h2[\s>]/g)?.length ?? 0,
    )
  })

  it('wraps the array in the container Presentation reorders', () => {
    // The array-level `data-sanity` needs a real element to sit on, so only
    // the draft renderer emits one — a fragment cannot carry it. It is what
    // tells Presentation the children form a sortable array, and it is the
    // one mark that distinguishes the two renderers' output.
    const count = (html: string) => (html.match(/data-sanity=/g) ?? []).length
    expect(count(draft.html)).toBe(count(published.html) + 1)
  })
})

import { describe, expect, it } from 'vitest'

import { isReservedPageSlug, RESERVED_PAGE_SLUG_MESSAGE } from './reservedSlugs'

describe('page slugs a coded route owns', () => {
  it('refuses the AI Visibility Review landing page’s slug', () => {
    expect(isReservedPageSlug('ai-visibility-review')).toBe(true)
  })

  it('leaves every other slug to the catch-all', () => {
    expect(isReservedPageSlug('about')).toBe(false)
    expect(isReservedPageSlug('solutions/ai-visibility-review')).toBe(false)
    expect(isReservedPageSlug(undefined)).toBe(false)
  })

  it('names the slug in the message an editor reads', () => {
    expect(RESERVED_PAGE_SLUG_MESSAGE).toContain('"ai-visibility-review"')
  })
})

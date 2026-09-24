import { describe, expect, it } from 'vitest'

import { defineStorybookPreview } from './storybookPreview'

describe('defineStorybookPreview', () => {
  it("merges the host's own parameters over the shared ones", () => {
    const storySort = { order: ['Foundations', 'Brand'] }
    const preview = defineStorybookPreview({ parameters: { options: { storySort } } })

    expect(preview.parameters?.options.storySort).toBe(storySort)
    // The shared parameters survive the merge.
    expect(preview.parameters?.a11y.test).toBe('error')
  })

  it('offers no brand toolbar', () => {
    expect(defineStorybookPreview().globalTypes?.brand).toBeUndefined()
  })
})

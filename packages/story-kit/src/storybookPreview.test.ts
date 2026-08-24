import { describe, expect, it } from 'vitest'

import { defineStorybookPreview } from './storybookPreview'

describe('defineStorybookPreview', () => {
  it("starts every story in the host's own brand", () => {
    expect(defineStorybookPreview({ brand: 'o3' }).initialGlobals?.brand).toBe('o3')
    expect(defineStorybookPreview({ brand: 'o3xo' }).initialGlobals?.brand).toBe('o3xo')
  })

  it("merges the host's own parameters over the shared ones", () => {
    const storySort = { order: ['Foundations', 'Brand'] }
    const preview = defineStorybookPreview({
      brand: 'o3xo',
      parameters: { options: { storySort } },
    })

    expect(preview.parameters?.options.storySort).toBe(storySort)
    // The shared parameters survive the merge.
    expect(preview.parameters?.a11y.test).toBe('error')
  })

  it('offers both brands on the Brand toolbar, whichever host is running', () => {
    const items = defineStorybookPreview({ brand: 'o3xo' }).globalTypes?.brand?.toolbar?.items

    expect(items).toEqual([
      { value: 'o3', title: 'O3' },
      { value: 'o3xo', title: 'O3XO' },
    ])
  })
})

import '../globals.css'

import { defineStorybookPreview } from '@o3/story-kit/storybook-preview'

export default defineStorybookPreview({
  brand: 'o3xo',
  parameters: {
    // The O3 host's order, minus the two sections that are O3's alone (page
    // mockups and captured prototypes) and plus `Brand`, which is where the
    // components `apps/o3xo` owns sort.
    //
    // Spelled out here rather than in the builder because Storybook reads this
    // array by PARSING this file (see `defineStorybookPreview`).
    options: {
      storySort: {
        order: [
          'Foundations',
          ['Overview', 'Color', 'Gradient', 'Typography', 'Layout', 'Button spec'],
          'Layout',
          ['SectionShell'],
          'UI',
          'Motion',
          'Content',
          ['Blocks', ['Base', 'Section'], 'Cards', 'Documents'],
          'Brand',
        ],
      },
    },
  },
})

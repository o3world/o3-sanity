import '../globals.css'

import { defineStorybookPreview } from '@o3/story-kit/storybook-preview'

export default defineStorybookPreview({
  brand: 'o3',
  parameters: {
    // Sidebar ordering follows the layered architecture: the extracted design
    // reference first, then layout primitives, then UI atoms, then content
    // blocks. `Foundations` documents the Figma O3DX exploration — reference
    // pages, not components; `Overview` leads because it explains why almost
    // none of it is a token yet.
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
          // Whole pages, chrome included, from the committed seed content —
          // the level a Figma page frame is actually drawn at, and the only
          // place band-against-band properties (surface sequence, the pinned
          // nav's ink flip, inter-band rhythm) are visible. After the parts,
          // because it is what the parts add up to.
          'Pages',
          // Last, deliberately: captured artifacts are history, not the
          // system. See apps/storybook/prototypes/README.md.
          'Prototypes',
        ],
      },
    },
  },
})

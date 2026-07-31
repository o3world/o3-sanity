import '../globals.css'
import type { Preview } from '@storybook/nextjs-vite'

const preview: Preview = {
  parameters: {
    // Report a11y violations without failing — flip to 'error' per-story (or
    // globally) as families burn down.
    a11y: { test: 'todo' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' } },
      },
    },
    // The three-surface system as a toolbar: stories set
    // `globals: { backgrounds: { value: 'ink' } }` to pin a surface.
    backgrounds: {
      options: {
        white: { name: 'White', value: '#ffffff' },
        bone: { name: 'Bone', value: '#efeeec' },
        ink: { name: 'Ink', value: '#030303' },
      },
    },
    // Sidebar ordering follows the layered architecture: foundations-ish
    // layout primitives first, then UI atoms, then (future) content blocks.
    options: {
      storySort: {
        order: [
          'Layout',
          ['SectionShell'],
          'UI',
          'Motion',
          'Content',
          ['Blocks', ['Base', 'Section'], 'Cards', 'Documents'],
        ],
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'white' },
  },
}

export default preview

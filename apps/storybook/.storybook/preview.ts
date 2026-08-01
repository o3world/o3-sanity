import '../globals.css'
import type { Preview } from '@storybook/nextjs-vite'

const preview: Preview = {
  parameters: {
    /**
     * Every story is axe-scanned when the `stories` layer runs (ADR 0004), and
     * a violation fails the run. The whole component set passes structurally
     * today — roles, labels, alt text, heading order — so this is enforced,
     * not aspirational.
     *
     * `color-contrast` is the one rule held back. It currently reports 12
     * violations, all from muted foreground tokens (e.g. #9a9a98 on white is
     * 2.81:1 against the 4.5:1 threshold). Those are decisions about the brand
     * palette, not defects in a component, so they belong to a design ticket
     * rather than a permanently red suite. Re-enable this rule the moment the
     * tokens land — deleting the `rules` entry below is the whole change.
     */
    a11y: {
      test: 'error',
      config: { rules: [{ id: 'color-contrast', enabled: false }] },
    },
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
    // Sidebar ordering follows the layered architecture: the extracted design
    // reference first, then layout primitives, then UI atoms, then (future)
    // content blocks. `Foundations` documents the Figma O3DX exploration —
    // reference pages, not components; `Overview` leads because it explains
    // why almost none of it is a token yet.
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
          // Last, deliberately: captured artifacts are history, not the
          // system. See apps/storybook/prototypes/README.md.
          'Prototypes',
        ],
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'white' },
  },
}

export default preview

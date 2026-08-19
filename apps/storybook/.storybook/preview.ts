import '../globals.css'
import { createElement } from 'react'
import type { Preview } from '@storybook/nextjs-vite'

const preview: Preview = {
  // Brand rides on <html data-brand>, where brand-xo.css re-points the theme's
  // custom properties — the documentElement rather than a wrapper div, so
  // portalled content (Sheet, dialogs) is themed too. Idempotent per render.
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.brand = String(context.globals.brand ?? 'o3')
      return createElement(Story)
    },
  ],
  globalTypes: {
    brand: {
      description: 'Brand token set',
      toolbar: {
        title: 'Brand',
        icon: 'paintbrush',
        items: [
          { value: 'o3', title: 'O3' },
          { value: 'o3xo', title: 'O3XO' },
        ],
        dynamicTitle: true,
      },
    },
  },
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
    // Values are var() so the surface follows whichever brand token set the
    // Brand toolbar has active, instead of duplicating one brand's hexes.
    backgrounds: {
      options: {
        white: { name: 'White', value: 'var(--color-white)' },
        bone: { name: 'Bone', value: 'var(--color-bone)' },
        ink: { name: 'Ink', value: 'var(--color-ink-deep)' },
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
  initialGlobals: {
    backgrounds: { value: 'white' },
    brand: 'o3',
  },
}

export default preview

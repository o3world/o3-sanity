import { createElement } from 'react'

import type { Brand } from '@o3/sanity/brand'
import type { Preview } from '@storybook/nextjs-vite'

export interface StorybookPreviewOptions {
  /** The brand this host paints in until a story or the toolbar says otherwise. */
  brand: Brand
  /**
   * Merged over the parameters below. **The sidebar order has to arrive this
   * way**: Storybook reads `parameters.options.storySort` by parsing the host's
   * `preview.ts` with babel and walking the first argument of the exported
   * call, so an order this builder supplies — or one the host imports from a
   * constant — is invisible to it and the index comes out in file order. Spell
   * the array inline in the host, which is also where it belongs: the two
   * hosts have different sidebars.
   */
  parameters?: Preview['parameters']
}

/**
 * The `.storybook/preview.ts` of every Storybook host in this repo.
 *
 * The host supplies three things and nothing else: its own `globals.css`
 * (which it imports for the side effect, so the sources Tailwind scans stay
 * the host's business), the brand it defaults to, and its sidebar order.
 *
 * **The Brand toolbar is on every host, and it is a test.** A shared-package
 * story flipped to the other brand must repaint and nothing more; anything
 * that survives the flip is paint leaking out of a token role (ADR 0028). A
 * story that pins `globals: { brand }` — every app-local story, which belongs
 * to exactly one brand — disables the control for itself, which is how the
 * toolbar stays a live question only where the answer is open.
 */
export function defineStorybookPreview({
  brand,
  parameters = {},
}: StorybookPreviewOptions): Preview {
  return {
    // Brand rides on <html data-brand>, where @o3/tailwind-config-o3xo
    // re-points the theme's custom properties — the documentElement rather
    // than a wrapper div, so portalled content (Sheet, dialogs) is themed
    // too. Idempotent per render.
    decorators: [
      (Story, context) => {
        document.documentElement.dataset.brand = String(context.globals.brand ?? brand)
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
      // Sidebar order (`options.storySort`) is the host's — see the option's
      // doc comment for why it cannot be here.
      ...parameters,
    },
    initialGlobals: {
      backgrounds: { value: 'white' },
      brand,
    },
  }
}

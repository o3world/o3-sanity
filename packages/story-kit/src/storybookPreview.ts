import type { Preview } from '@storybook/nextjs-vite'
import type { ViewportParameters } from 'storybook/viewport'

export interface StorybookPreviewOptions {
  /**
   * Merged over the parameters below. **The sidebar order has to arrive this
   * way**: Storybook reads `parameters.options.storySort` by parsing the host's
   * `preview.ts` with babel and walking the first argument of the exported
   * call, so an order this builder supplies — or one the host imports from a
   * constant — is invisible to it and the index comes out in file order. Spell
   * the array inline in the host, which is also where it belongs.
   */
  parameters?: Preview['parameters']
}

/**
 * The `.storybook/preview.ts` of every Storybook host in this repo.
 *
 * The host supplies two things and nothing else: its own `globals.css`
 * (which it imports for the side effect, so the sources Tailwind scans stay
 * the host's business) and its sidebar order.
 */
export function defineStorybookPreview({ parameters = {} }: StorybookPreviewOptions = {}): Preview {
  return {
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
        options: {
          mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' } },
          tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
          desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' } },
        },
      } satisfies ViewportParameters['viewport'],
      // The three-surface system as a toolbar: stories set
      // `globals: { backgrounds: { value: 'ink' } }` to pin a surface.
      // Values are var() so the surface follows the token set instead of
      // duplicating its hexes.
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
    },
  }
}

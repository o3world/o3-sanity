import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'
import { expect } from 'storybook/test'

import { Mono, Page, Section } from './spec-ui'

const meta = {
  title: 'Foundations/Color',
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('3720:60473'),
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const groups = [
  {
    title: 'Surfaces',
    note: 'Page and chrome backgrounds.',
    tokens: ['white', 'paper', 'bone', 'ink', 'ink-warm', 'ink-deep', 'utility'],
  },
  {
    title: 'Copy on light',
    note: 'Primary, body and supporting text on light surfaces.',
    tokens: ['fg', 'fg-body', 'fg-muted', 'fg-quiet', 'fg-subtle'],
  },
  {
    title: 'Copy on dark',
    note: 'White tints composite over the ink surface; utility copy uses its own chrome role.',
    dark: true,
    tokens: ['on-ink', 'on-ink-muted', 'on-ink-subtle', 'on-utility', 'on-utility-line'],
  },
  {
    title: 'Brand and rules',
    note: 'Brand accents and the rules that separate content.',
    tokens: ['brand', 'brand-deep', 'line', 'line-soft'],
  },
] as const

/** The gallery paints the same CSS variables as the current application. */
export const Palette: Story = {
  render: () => (
    <Page
      title="Color"
      intro="Live color roles from the O3 token package. Each swatch uses its CSS variable, so changes to the palette appear here and in the site together."
    >
      {groups.map((group) => (
        <Section key={group.title} title={group.title} note={group.note}>
          <div
            className={`grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3 ${'dark' in group ? 'bg-ink text-white' : 'bg-bone text-fg'}`}
          >
            {group.tokens.map((token) => (
              <div key={token} className="flex min-w-0 flex-col">
                <div
                  data-color-token={token}
                  className="h-24 w-full"
                  style={{ backgroundColor: `var(--color-${token})` }}
                />
                <div className="flex flex-col gap-1 py-4">
                  <p className="text-[15px] font-medium">{token}</p>
                  <Mono className="break-all">--color-{token}</Mono>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ))}
    </Page>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      getComputedStyle(canvasElement.querySelector('[data-color-token="bone"]')!).backgroundColor,
    ).toBe('rgb(241, 240, 236)')
    await expect(
      getComputedStyle(canvasElement.querySelector('[data-color-token="ink"]')!).backgroundColor,
    ).toBe('rgb(10, 10, 11)')
  },
}

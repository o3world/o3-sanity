import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { defineVariantStories } from '@o3/story-kit'

import { ArrowIcon } from '../arrow-icon'
import { ChevronDownIcon, ExternalLinkIcon } from '../button-icons'
import { Button } from './button'

/**
 * **The icon slot is filled by the parent**, and these stories are a parent.
 * The button places the glyph and colours it; which glyph it is comes from
 * outside — from an editor's choice by the time a page renders it.
 */
const kit = defineVariantStories({
  component: Button,
  title: 'UI/Button',
  knobs: {
    variant: ['dark', 'light', 'brand', 'subtle', 'ghost'],
    appearance: ['primary', 'secondary'],
    size: ['base', 'large'],
  },
  defaultArgs: { children: 'View our work', icon: <ArrowIcon /> },
  matrix: ['variant', 'size'],
})

const meta: Meta<typeof Button> = { ...kit.meta, component: Button }
export default meta
type Story = StoryObj<typeof meta>

// Playground, Ghost, Disabled and DownIcon repeat what Matrix, States and
// ExternalIcon already mount, so they stay in the sidebar and out of the run.
export const Playground = { ...kit.Playground, tags: ['!test'] } as Story
export const Matrix = kit.Matrix as Story

/** `Theme=Black` (2134:1786) on a light band, at the repo's `large` step. */
export const Dark: Story = {
  args: { size: 'large', children: 'See all partners', icon: <ArrowIcon /> },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    await expect(getComputedStyle(button).backgroundColor).toBe('rgb(10, 10, 11)')
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await waitFor(() => expect(getComputedStyle(button).boxShadow).toContain('rgb(214, 211, 204)'))
  },
}

/** `Theme=White` (2205:1298) on ink — the CTA band's button (3771:80361). */
export const Light: Story = {
  args: { variant: 'light', children: 'View our work', icon: <ArrowIcon /> },
  globals: { backgrounds: { value: 'ink' } },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    await expect(getComputedStyle(button).backgroundColor).toBe('rgb(255, 255, 255)')
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await waitFor(() => expect(getComputedStyle(button).boxShadow).toContain('rgb(111, 109, 104)'))
  },
}

/**
 * A LABEL WIDER THAN THE SPACE IT WAS GIVEN (#181). The set draws none this
 * long, so nothing here is transcribed — the case is authored: `/1682-conference-ai-innovation`
 * asks for "Attend the 1682 conference on October 8", which at 390px is wider
 * than the viewport. It used to take the band and the document sideways with
 * it; now it wraps inside a 320px column and the icon holds the last position.
 */
export const LongLabel: Story = {
  args: { children: 'Attend the 1682 conference on October 8', icon: <ArrowIcon /> },
  decorators: [
    (Story) => (
      <div className="outline-current/20 w-[320px] outline outline-dashed outline-1">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    await expect(button.getBoundingClientRect().width).toBeLessThanOrEqual(320)
    await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth)
  },
}

/** `Button / Ghost` (264:260). */
export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
  tags: ['!test'],
}

/** The slot left empty — the label alone, and the 12px gap goes with it. */
export const NoIcon: Story = {
  args: { children: 'Submit', icon: undefined },
}

/**
 * The other two glyphs of the curated set, in the same slot. Each one inherits
 * the label's colour, which is why a fill needs no icon of its own.
 */
export const ExternalIcon: Story = {
  args: { children: 'Visit O3XO', icon: <ExternalLinkIcon /> },
}

export const DownIcon: Story = {
  args: { children: 'How we work', icon: <ChevronDownIcon /> },
  tags: ['!test'],
}

/** `#D6D3CC` under a `#6F6D68` label (`2134:1810`). */
export const Disabled: Story = {
  args: { children: 'Disabled', disabled: true },
  tags: ['!test'],
}

/**
 * Each theme's state colours against the Figma set (`2134:1785`), read off the
 * custom properties the state rules paint with. Hover and press can't be
 * triggered from a story, so the values are checked where they're declared.
 */
const FIGMA_STATES = {
  dark: {
    hover: '#242321',
    press: '#000000',
    focus: '#d6d3cc',
    'wash-hover': '#f1f0ec',
    'wash-press': '#e5e3de',
  },
  light: {
    hover: '#f1f0ec',
    press: '#e5e3de',
    focus: '#6f6d68',
    'wash-hover': '#393633',
    'wash-press': '#55524e',
  },
  brand: {
    hover: '#a80b00',
    press: '#840900',
    // red-400, from design: the set's focus variable still binds #ff958c.
    focus: '#ff5a4c',
    'wash-hover': '#ffe0dd',
    'wash-press': '#ffc2bd',
  },
  subtle: { hover: '#aaa69e', press: '#6f6d68', focus: '#6f6d68' },
} as const

export const MatchesFigmaStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(Object.keys(FIGMA_STATES) as Array<keyof typeof FIGMA_STATES>).map((variant) => (
        <Button key={variant} variant={variant} data-variant={variant}>
          {variant}
        </Button>
      ))}
      <Button disabled data-variant="disabled">
        Disabled
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const [variant, states] of Object.entries(FIGMA_STATES)) {
      const button = canvasElement.querySelector<HTMLElement>(`[data-variant="${variant}"]`)!
      const style = getComputedStyle(button)
      for (const [state, hex] of Object.entries(states)) {
        await expect({
          variant,
          state,
          value: style.getPropertyValue(`--button-${state}`).trim(),
        }).toEqual({
          variant,
          state,
          value: hex,
        })
      }
    }
    // The disabled label, Figma `3837:6891`.
    const disabled = canvasElement.querySelector<HTMLElement>('[data-variant="disabled"]')!
    await expect(getComputedStyle(disabled).color).toBe('rgb(111, 109, 104)')
  },
}

/** Real pseudo-classes keep this gallery aligned with the component's state rules. */
export const States: Story = {
  render: () => (
    <div className="grid gap-8 md:grid-cols-2">
      {(['dark', 'light', 'brand', 'subtle'] as const).map((variant) => (
        <div
          key={variant}
          className={
            variant === 'light'
              ? 'bg-ink flex flex-col items-start gap-6 p-8'
              : 'bg-bone flex flex-col items-start gap-6 p-8'
          }
        >
          <Button variant={variant} icon={<ArrowIcon />}>
            View our work
          </Button>
          {variant !== 'subtle' && (
            <Button variant={variant} appearance="secondary" icon={<ArrowIcon />}>
              View our work
            </Button>
          )}
          <Button variant={variant} disabled icon={<ArrowIcon />}>
            Disabled
          </Button>
        </div>
      ))}
    </div>
  ),
}

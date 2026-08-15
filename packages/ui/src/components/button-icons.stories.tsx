import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { BUTTON_ICONS, ExternalLinkIcon } from './button-icons'

/**
 * The curated set a button's icon knob picks from — Figma's `Icon`
 * (`2177:1556`), narrowed to the glyphs a button in this design actually
 * trails.
 *
 * All three are inline SVG stroked with `currentColor` (ADR 0009), traced from
 * the Lucide geometry that set draws and vendored rather than installed. The
 * story is the picker's own contents: an editor choosing an icon sees these
 * shapes, not these names.
 */
const meta = {
  title: 'UI/Icons/ButtonIcons',
  component: ExternalLinkIcon,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ExternalLinkIcon>

export default meta
type Story = StoryObj<typeof meta>

/** Every glyph in the set, at the 20px the `Button` set draws. */
export const Set: Story = {
  render: () => (
    <div className="text-ink flex items-end gap-8">
      {Object.entries(BUTTON_ICONS).map(([name, Icon]) => (
        <div key={name} className="flex flex-col items-center gap-2">
          <Icon />
          <span className="text-[11px] opacity-60">{name}</span>
        </div>
      ))}
    </div>
  ),
}

/** They follow `currentColor`, so no glyph needs an inverse of itself. */
export const OnInk: Story = {
  globals: { backgrounds: { value: 'ink' } },
  render: () => (
    <div className="flex items-center gap-8 text-white">
      {Object.entries(BUTTON_ICONS).map(([name, Icon]) => (
        <Icon key={name} />
      ))}
    </div>
  ),
}

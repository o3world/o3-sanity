import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from './Button'

/**
 * The shared `button` object placed directly in a `layoutSection` column. The
 * block's fields **are** the button fields, so it forwards itself to
 * `ButtonLink` and adds nothing.
 *
 * Which makes the interesting surface `ButtonLink`'s resolution rules, and that
 * is what these stories cover:
 *
 * - **href or target, never both.** A `target` is an internal reference and
 *   wins; `href` is the external escape hatch.
 * - **the legacy variant map.** `brand → dark` and `inverse → light`, because
 *   a dataset that has not been rebuilt since #42 still carries the old
 *   strings and a locked document keeps them forever. The canonical frames
 *   have no red button, which is why `brand` maps to `dark` rather than
 *   growing a red fill.
 * - **`arrow` is a prop, not a field** (#38) — Figma's `Show right icon`
 *   toggles the presence of a child, and this block never sets it, so a base
 *   button has no arrow.
 */
const meta = {
  title: 'Content/Blocks/Base/Button',
  component: Button,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/** The default fill. */
export const Dark: Story = {
  args: { label: 'View our work', href: '/work', variant: 'dark', target: null },
}

/** For a band that paints its own ink. */
export const Light: Story = {
  args: { label: 'View our work', href: '/work', variant: 'light', target: null },
  globals: { backgrounds: { value: 'ink' } },
}

export const Ghost: Story = {
  args: { label: 'Read the case', href: '/work', variant: 'ghost', target: null },
}

/** An internal reference. `target` wins over `href`, and the URL comes from the doc. */
export const InternalTarget: Story = {
  args: {
    label: 'Read the case',
    href: '/ignored',
    variant: 'dark',
    target: { _type: 'caseStudy', title: 'Caron', slug: 'caron' },
  },
}

/** An external URL — the `href` arm, with no reference behind it. */
export const ExternalHref: Story = {
  args: { label: 'Visit O3XO', href: 'https://www.o3xo.ai/', variant: 'dark', target: null },
}

/**
 * A value the CURRENT schema cannot produce — which is exactly the point, and
 * why these three carry a cast the rest of the file does not.
 *
 * The generated type is the schema as it stands today; a **document** is
 * whatever was written when it was saved. `load` replaces every pipeline-owned
 * document, but a dataset that has not been rebuilt since #42 still holds the
 * old strings, and a `migration.locked` document keeps them forever. So the
 * renderer maps them, and the cast here is the honest way to say "this value
 * is off-schema on purpose".
 *
 * `brand` renders `dark` — not red — because the canonical frames have no red
 * button; `inverse` was already the white fill.
 */
const offSchemaVariant = (variant: string) => variant as 'dark' | 'light' | 'ghost'

export const LegacyBrandVariant: Story = {
  args: {
    label: 'Let’s talk',
    href: '/contact',
    variant: offSchemaVariant('brand'),
    target: null,
  },
}

export const LegacyInverseVariant: Story = {
  args: {
    label: 'Let’s talk',
    href: '/contact',
    variant: offSchemaVariant('inverse'),
    target: null,
  },
  globals: { backgrounds: { value: 'ink' } },
}

/** An unknown variant falls back to `dark` rather than rendering unstyled. */
export const UnknownVariant: Story = {
  args: {
    label: 'Let’s talk',
    href: '/contact',
    variant: offSchemaVariant('chartreuse'),
    target: null,
  },
}

/** No label — `ButtonLink` renders nothing, so an empty button cannot leave a bare link. */
export const NoLabel: Story = {
  args: { label: undefined, href: '/work', variant: 'dark', target: null },
}

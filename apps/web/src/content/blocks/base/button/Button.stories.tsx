import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite'

import { SurfaceProvider, type Surface } from '@o3/ui'

import { Button } from './Button'

/**
 * The shared `button` object placed directly in a `layoutSection` column. The
 * block's fields **are** the button fields, so it forwards itself to
 * `ButtonLink` and adds nothing.
 *
 * Which makes the interesting surface `ButtonLink`'s resolution rules, and that
 * is what these stories cover:
 *
 * - **the fill the button resolves.** `contrast` defaults to Auto, which reads
 *   the surface the button is standing on: the two light bands give the ink
 *   fill and ink gives the white one. An explicit choice is honoured on every
 *   band, which is what the hero and the CTA band used to overrule. The rule
 *   itself is a table in `resolveContrast` and tested there; these stories are
 *   where you can see it.
 * - **the element the button chooses.** A destination draws a link; no
 *   destination draws a `<button>`. Inspect the rendered element — that is the
 *   whole difference, and it is what a screen reader announces and what a
 *   cmd-click acts on.
 * - **the four arms**, in precedence: a `target` is an internal reference and
 *   wins, then `href`, then `anchor`, and nothing at all is the fourth.
 *   `href` is the only arm that can leave the site, and an absolute URL is
 *   what earns the new tab.
 * - **the legacy fill map.** `brand → dark` and `inverse → light`, because
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

/**
 * A band, for the stories that need one. Storybook's background addon paints
 * behind the canvas; this paints the surface AND declares it, which is the
 * pairing the whole feature rests on (ADR 0026).
 */
const on = (surface: Surface): Decorator => {
  const Band: Decorator = (Story) => (
    <SurfaceProvider surface={surface}>
      <div
        className={{ white: 'bg-white', bone: 'bg-bone', ink: 'bg-ink' }[surface] + ' p-8'}
        data-surface={surface}
      >
        <Story />
      </div>
    </SurfaceProvider>
  )
  return Band
}

/**
 * **Auto on white** — no stored contrast at all, which is what a button placed
 * today carries. The band is light, so the button is ink.
 */
export const AutoOnWhite: Story = {
  args: { label: 'View our work', href: '/work', target: null },
  decorators: [on('white')],
}

/** Auto on bone. The other light surface gives the same answer. */
export const AutoOnBone: Story = {
  args: { label: 'View our work', href: '/work', target: null },
  decorators: [on('bone')],
}

/**
 * **Auto on ink** — the same document, one band later. Nothing about the
 * button changed; the surface under it did, and that is the whole feature.
 */
export const AutoOnInk: Story = {
  args: { label: 'View our work', href: '/work', target: null },
  decorators: [on('ink')],
  globals: { backgrounds: { value: 'ink' } },
}

/**
 * **Auto with no surface at all** — a button outside the band system whose
 * chrome has not declared one. Dark, because a light button on an unknown
 * background is the one answer that can be invisible.
 */
export const AutoWithNoSurface: Story = {
  args: { label: 'View our work', href: '/work', target: null },
}

/**
 * An explicit fill on the band that would have chosen the other one. **This is
 * honoured**, which is new: the hero and the CTA band used to force `light`
 * past whatever an editor picked.
 */
export const DarkChosenOnInk: Story = {
  args: { label: 'View our work', href: '/work', contrast: 'dark', target: null },
  decorators: [on('ink')],
  globals: { backgrounds: { value: 'ink' } },
}

export const LightChosenOnWhite: Story = {
  args: { label: 'View our work', href: '/work', contrast: 'light', target: null },
  decorators: [on('white')],
}

/**
 * Ghost passes through untouched, and **Auto never produces it** — "readable on
 * this band" and "deliberately unfilled" stay separate decisions.
 */
export const Ghost: Story = {
  args: { label: 'Read the case', href: '/work', contrast: 'ghost', target: null },
  decorators: [on('bone')],
}

/** An internal reference. `target` wins over `href`, and the URL comes from the doc. */
export const InternalTarget: Story = {
  args: {
    label: 'Read the case',
    href: '/ignored',
    target: { _type: 'caseStudy', title: 'Caron', slug: 'caron' },
  },
}

/**
 * An external URL — the `href` arm, with no reference behind it. Absolute, so
 * it leaves the site and opens in a new tab with `rel="noopener noreferrer"`.
 */
export const ExternalHref: Story = {
  args: { label: 'Visit O3XO', href: 'https://www.o3xo.ai/', target: null },
}

/**
 * The same arm, pointing at a route on this site. Most of the seeded buttons
 * are here: a relative path is still a link, and still stays in this tab.
 */
export const RelativeHref: Story = {
  args: { label: 'Let’s talk', href: '/contact', target: null },
}

/**
 * The anchor arm — a place further down the page the visitor is already on.
 *
 * The name is stored without the `#` and emitted with one, and it is the same
 * name a band carries in its own `anchor` field (#149). A row of these is what
 * `buttonGroup` holds.
 */
export const AnchorOnThisPage: Story = {
  args: { label: 'How we work', anchor: 'how-we-work', target: null },
}

/**
 * The fourth arm: nothing. **This renders a `<button>`, not a link** — the
 * element the component picks when the editor has not sent the visitor
 * anywhere. It is what the inquiry form's submit is, and it is why the form's
 * submit needs no type of its own.
 */
export const NoDestination: Story = {
  args: { label: 'Send message', target: null },
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
 * button; `inverse` was already the white fill. Both are mapped rather than
 * resolved: they are a choice somebody made, so they hold on any band.
 */
const offSchemaContrast = (contrast: string) => contrast as 'auto' | 'dark' | 'light' | 'ghost'

export const LegacyBrandContrast: Story = {
  args: {
    label: 'Let’s talk',
    href: '/contact',
    contrast: offSchemaContrast('brand'),
    target: null,
  },
  decorators: [on('ink')],
  globals: { backgrounds: { value: 'ink' } },
}

export const LegacyInverseContrast: Story = {
  args: {
    label: 'Let’s talk',
    href: '/contact',
    contrast: offSchemaContrast('inverse'),
    target: null,
  },
  decorators: [on('white')],
}

/**
 * An unrecognised value resolves like Auto rather than like `dark`, because
 * Auto is what the editor's control is showing: `resolveKnobValue` falls a
 * stored value outside the option set back to `initialValue`. Here that means
 * the white fill, on ink.
 */
export const UnknownContrast: Story = {
  args: {
    label: 'Let’s talk',
    href: '/contact',
    contrast: offSchemaContrast('chartreuse'),
    target: null,
  },
  decorators: [on('ink')],
  globals: { backgrounds: { value: 'ink' } },
}

/** No label — `ButtonLink` renders nothing, so an empty button cannot leave a bare link. */
export const NoLabel: Story = {
  args: { label: undefined, href: '/work', target: null },
}

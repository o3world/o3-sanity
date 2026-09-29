import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { figmaDesign } from '@o3/story-kit'

import type { SectionProps } from '@o3/content-runtime/blocks'
import { seedImage } from '../../../testing/seedContent'

import { ScreenGridSection } from './ScreenGridSection'

/**
 * Tiled product screenshots on gradient plates — the case-study frame's screen
 * bands (`2230:3315`, `2230:7559`), #97.
 *
 * | Story      | Frame       | What it shows                             |
 * | ---------- | ----------- | ----------------------------------------- |
 * | `Default`  | `2230:3315` | a `wide` lead tile over two standard ones |
 * | `AllTones` | `2230:7559` | the three plate fills side by side        |
 * | `OnInk`    | —           | the band's own surface set to ink         |
 *
 * **The plate crops the screenshot, and that is the whole effect** — every tile
 * hangs an oversized capture 64px from the plate's top edge and lets the
 * rounded box cut it off. So the stories that matter are the ones where the
 * screenshot is taller than its plate; a picture that fits proves nothing.
 *
 * Args are hand-built rather than seeded: no seed *page* carries this block
 * (it arrived with `caseStudy.story`), so there is no `seededSectionArgs` to
 * take. The images are the real La Colombe captures out of the committed asset
 * manifest, which is the content this band actually ships with.
 */
const meta = {
  title: 'Content/Blocks/Section/ScreenGridSection',
  component: ScreenGridSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('2230:3315'),
  },
} satisfies Meta<typeof ScreenGridSection>

export default meta
type Story = StoryObj<typeof meta>

type Screen = NonNullable<SectionProps<'screenGridSection'>['screens']>[number]

const HOMEPAGE = seedImage(
  'https://www.o3world.com/wp-content/uploads/2023/01/LaColombe-casestudy2.jpg',
)
const ECOMMERCE = seedImage(
  'https://www.o3world.com/wp-content/uploads/2023/01/LaColombe-casestudy3.png',
)

function screen(
  _key: string,
  image: ReturnType<typeof seedImage>,
  alt: string,
  tone: Screen['tone'],
  span: Screen['span'],
): Screen {
  return { _key, _type: 'screen', media: { _type: 'figure', image, alt }, tone, span }
}

/** `2230:3315` — the wide lead plate, then the pair beneath it. */
export const Default: Story = {
  args: {
    surface: 'white',
    screens: [
      screen(
        'lead',
        HOMEPAGE,
        'La Colombe’s homepage, with the draft latte product shot.',
        'ink',
        'wide',
      ),
      screen('shop', ECOMMERCE, 'The shop, on mobile.', 'brand', 'standard'),
      screen('cart', HOMEPAGE, 'The cart, mid-checkout.', 'bone', 'standard'),
    ],
  },
}

/**
 * `2230:7559` — the three plate fills against each other. `brand` is O3's own
 * red gradient rather than the frame's client-specific one (ADR 0007).
 */
export const AllTones: Story = {
  args: {
    surface: 'white',
    screens: [
      screen('ink', HOMEPAGE, 'On the ink plate.', 'ink', 'standard'),
      screen('brand', ECOMMERCE, 'On the brand plate.', 'brand', 'standard'),
      screen('bone', HOMEPAGE, 'On the bone plate.', 'bone', 'wide'),
    ],
  },
  parameters: { design: figmaDesign('2230:7559') },
}

/**
 * One tile, `wide`. The grid takes whatever it is given, and a lone lead plate
 * is what a chapter with a single screenshot produces.
 */
export const SingleWide: Story = {
  args: {
    surface: 'white',
    screens: [screen('only', HOMEPAGE, 'The homepage, whole.', 'ink', 'wide')],
  },
}

/**
 * On ink. The band's surface is the editor's to set, and a bone plate on an ink
 * band is the pairing that has to still read as a plate.
 */
export const OnInk: Story = {
  args: {
    surface: 'ink',
    screens: [
      screen('lead', HOMEPAGE, 'La Colombe’s homepage, on an ink band.', 'bone', 'wide'),
      screen('shop', ECOMMERCE, 'The shop, on mobile.', 'ink', 'standard'),
      screen('cart', HOMEPAGE, 'The cart, mid-checkout.', 'brand', 'standard'),
    ],
  },
  globals: { backgrounds: { value: 'ink' } },
}

/**
 * At 402 the grid collapses to one column and every plate takes the same 4/3
 * box — `span` stops meaning anything, because a 1.78 plate on a 362px column
 * is a strip rather than a screenshot (ADR 0006).
 */
export const Mobile: Story = {
  args: Default.args,
  globals: { viewport: { value: 'mobile' } },
}

/**
 * No screens. Reachable (an editor adds the band before the captures exist),
 * and the block must render nothing rather than an empty band holding its own
 * padding open.
 */
export const NoScreens: Story = {
  args: { surface: 'white', screens: [] },
}

/** Scroll into the authored composition; reduced motion leaves the same layout still. */
export const Sequence: Story = {
  args: { ...Default.args, sequence: true },
  decorators: [
    (Story) => (
      <div>
        <div className="min-h-screen" />
        <Story />
        <div className="h-screen" />
      </div>
    ),
  ],
}

/** Current Best Egg wide tile includes its own plate in the exported image. */
export const ComposedWide: Story = {
  args: {
    surface: 'white',
    screens: [
      {
        _key: 'composed',
        _type: 'screen',
        span: 'wide',
        framing: 'image',
        media: {
          _type: 'figure',
          alt: 'Best Egg product composition',
          image: {
            _type: 'image',
            asset: {
              _id: 'image-715dec532b4d49324981a33a92e0a7a751cda830-3744x2100-png',
              metadata: null,
            },
          },
        },
      },
    ],
  },
}

const featureScreens: Screen[] = [
  ['feature', 'image-668bf0e9e446a4fa4e2e30bec61914c901da9cb2-2784x2100-png'],
  ['upper', 'image-6b3f9d9f7f9f99324fd0ee7e37dc44b92a46338c-864x1002-png'],
  ['lower', 'image-a2a859554866d5a0c6d8f48f3d83a9c009ac189e-864x1002-png'],
  ['following', 'image-02e5f3c8aabf4b08ccd5d7754b86aea0ee34a7ed-1824x1002-png'],
].map(([key, id], index) => ({
  _key: key!,
  _type: 'screen',
  span: index === 0 ? 'wide' : 'standard',
  framing: 'image',
  media: {
    _type: 'figure',
    alt: key!,
    image: { _type: 'image', asset: { _id: id!, metadata: null } },
  },
}))

/** 3503:10901 — 928 × 700 beside two 288 × 334 cards, with 32px gaps. */
export const Feature: Story = {
  args: { surface: 'white', layout: 'feature', screens: featureScreens },
  parameters: { design: figmaDesign('3503:10901') },
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const [lead, upper, lower, following] = Array.from(canvasElement.querySelectorAll('li')).map(
      (tile) => tile.getBoundingClientRect(),
    )
    await expect(Math.abs(lead!.width - 928)).toBeLessThan(1)
    await expect(Math.abs(lead!.height - 700)).toBeLessThan(1)
    await expect(Math.abs(upper!.width - 288)).toBeLessThan(1)
    await expect(Math.abs(upper!.height - 334)).toBeLessThan(1)
    await expect(Math.abs(upper!.left - lead!.right - 32)).toBeLessThan(1)
    await expect(Math.abs(lower!.top - upper!.bottom - 32)).toBeLessThan(1)
    await expect(lower!.left).toBe(upper!.left)
    await expect(Math.abs(following!.width - 608)).toBeLessThan(1)
    await expect(Math.abs(following!.top - lead!.bottom - 32)).toBeLessThan(1)
  },
}

export const FeatureMobile: Story = {
  args: Feature.args,
  parameters: {
    viewport: {
      options: { mobile: { name: 'Mobile 402', styles: { width: '402px', height: '874px' } } },
    },
  },
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const tiles = Array.from(canvasElement.querySelectorAll('li')).map((tile) =>
      tile.getBoundingClientRect(),
    )
    const [lead, upper, lower, following] = tiles
    await expect(Math.abs(lead!.width - 370)).toBeLessThan(1)
    await expect(Math.abs(upper!.width - 169)).toBeLessThan(1)
    await expect(Math.abs(lower!.width - 169)).toBeLessThan(1)
    await expect(upper!.top).toBe(lower!.top)
    await expect(Math.abs(upper!.top - lead!.bottom - 32)).toBeLessThan(1)
    await expect(Math.abs(lower!.left - upper!.right - 32)).toBeLessThan(1)
    await expect(Math.abs(following!.width - 370)).toBeLessThan(1)
    await expect(Math.abs(following!.top - upper!.bottom - 32)).toBeLessThan(1)
  },
}

/** Missing layout retains the existing full-width lead and equal-width pair. */
export const DefaultGeometry: Story = {
  args: { surface: 'white', screens: featureScreens },
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const [lead, left, right] = Array.from(canvasElement.querySelectorAll('li')).map((tile) =>
      tile.getBoundingClientRect(),
    )
    await expect(Math.abs(lead!.width - 1248)).toBeLessThan(1)
    await expect(Math.abs(left!.width - 608)).toBeLessThan(1)
    await expect(right!.top).toBe(left!.top)
    await expect(Math.abs(right!.left - left!.right - 32)).toBeLessThan(1)
  },
}

export const NarrowFeatureRow: Story = {
  args: {
    surface: 'white',
    layout: 'feature',
    screens: [
      ...featureScreens.slice(0, 3),
      ...featureScreens
        .slice(1, 3)
        .map((screen) => ({ ...screen, _key: `narrow-${screen._key}`, span: 'narrow' as const })),
      featureScreens[3]!,
    ],
  },
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const boxes = Array.from(canvasElement.querySelectorAll('li')).map((tile) =>
      tile.getBoundingClientRect(),
    )
    await expect(Math.abs(boxes[3]!.width - 288)).toBeLessThan(1)
    await expect(Math.abs(boxes[4]!.width - 288)).toBeLessThan(1)
    await expect(Math.abs(boxes[5]!.width - 608)).toBeLessThan(1)
    await expect(boxes[3]!.top).toBe(boxes[5]!.top)
  },
}

/** Quarter-width desktop tiles stay paired on mobile, including later narrow items. */
export const NarrowFeatureRowMobile: Story = {
  args: NarrowFeatureRow.args,
  parameters: FeatureMobile.parameters,
  globals: FeatureMobile.globals,
  play: async ({ canvasElement }) => {
    const boxes = Array.from(canvasElement.querySelectorAll('li')).map((tile) =>
      tile.getBoundingClientRect(),
    )
    await expect(Math.abs(boxes[3]!.width - 169)).toBeLessThan(1)
    await expect(Math.abs(boxes[4]!.width - 169)).toBeLessThan(1)
    await expect(boxes[3]!.top).toBe(boxes[4]!.top)
    await expect(Math.abs(boxes[5]!.width - 370)).toBeLessThan(1)
    await expect(Math.abs(boxes[5]!.top - boxes[3]!.bottom - 32)).toBeLessThan(1)
  },
}

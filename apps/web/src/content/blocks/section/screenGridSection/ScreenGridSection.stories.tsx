import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import type { SectionProps } from '@o3/content-runtime/blocks'
import { seedImage } from '@/stories/seedContent'

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

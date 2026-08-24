import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { CollectionHero } from './collection-hero'
import { Eyebrow } from './eyebrow'
import { OrbitalSphere } from './orbital-sphere'
import { SectionBackground } from './section-shell'

/**
 * The interior-page opener, in the compositions the canonical frames draw it
 * in. The first stories are the original band — `ink-warm`, 164px of clearance
 * for the floating pill — differing only in `align` and what hangs behind it.
 * The `Interior*` ones are the 2026-08 `Interior Hero` set that replaces it on
 * the redesigned frames: rail-absent and rail-present, the two surfaces, and
 * the two things that can sit behind it. Put `Interior` beside `Work` and every
 * difference between the generations is visible at once, which is the point of
 * keeping both.
 *
 * Stories pin the ink background, because this band paints its own dark and a
 * white canvas behind it hides where the band actually ends. `InteriorWhite`
 * pins white for the same reason in reverse.
 */
const meta = {
  title: 'UI/CollectionHero',
  component: CollectionHero,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1634:1181'),
  },
  globals: { backgrounds: { value: 'ink' } },
} satisfies Meta<typeof CollectionHero>

export default meta
type Story = StoryObj<typeof meta>

/**
 * `/work` (`1634:1181`) — the shape the component was built to: eyebrow and a
 * 48px headline left in a 588px measure, standfirst pinned right in 395px.
 */
export const Work: Story = {
  args: {
    eyebrow: 'Work',
    heading: 'The problems behind the problems.',
    subheading:
      'Every engagement here started as something else. What follows is what we found once we looked past the brief.',
  },
}

/**
 * `/about` (`1924:5344`) — the same left-aligned shape with the sphere hung
 * off the right edge, where the standfirst would otherwise sit. The decoration
 * is a slot rather than a prop, which is why the hero itself knows nothing
 * about spheres.
 */
export const AboutWithSphere: Story = {
  args: {
    eyebrow: 'About',
    heading: 'Senior people, on your problem, from the first conversation.',
    decoration: (
      <OrbitalSphere className="-z-10 hidden lg:bottom-[-30%] lg:right-[-14%] lg:block lg:w-[720px]" />
    ),
  },
}

/**
 * `/insights` (`2336:4477`) — the 2026-08 `Interior Hero` component
 * (`2107:1051`), which the redesigned frames instance, in its base shape: no
 * rail, so the standfirst stacks under the headline. Against `Work` above,
 * every difference the set carries is visible at once — `ink` rather than
 * `ink-warm`, 192px of clearance rather than 164, an 18px kicker, and a 64/76
 * Light headline where the older band draws the 48px section step.
 */
export const Interior: Story = {
  args: {
    variant: 'interior',
    eyebrow: 'Insights',
    heading: 'Learn about what drives our experiences.',
    subheading:
      'Looking for some firsthand knowledge from our world? Check out our in-depth thoughts about the industry today, our culture at O3, the future of AI and digital experiences, and other relevant topics.',
  },
  parameters: { design: figmaDesign('2336:4477') },
}

/**
 * `/partners/sanity` (`2401:3185`) — the same set with its right rail filled.
 * The standfirst does not move to make room for it, which is the whole
 * difference from the older band; what does move is the headline, which steps
 * to 48/58 Light because the rail has taken the width the 64 needs.
 */
export const InteriorWithRail: Story = {
  args: {
    variant: 'interior',
    eyebrow: 'Technology partners',
    heading: 'Sanity Development Partner',
    subheading:
      "Structure, flexibility, and scale. That's what Sanity does. That's what we build on it.",
    aside: (
      <div className="flex flex-col gap-3">
        <Eyebrow size="lg" tone="inverse">
          o3 expertise:
        </Eyebrow>
        <ul className="text-lead flex list-disc flex-col gap-1 pl-5">
          <li>20+ Sanity implementations</li>
          <li>Certified Sanity developers</li>
          <li>Partners in production</li>
        </ul>
      </div>
    ),
  },
  parameters: { design: figmaDesign('2401:3185') },
}

/**
 * `/about` (`2960:6876`) — "Interior Hero – White", the one instance of the
 * set drawn on a light band. The copy goes to ink and the kicker to brand red
 * (#EB1000, sampled off "ABOUT US"); nothing else about the composition moves.
 */
export const InteriorWhite: Story = {
  args: {
    variant: 'interior',
    surface: 'white',
    eyebrow: 'About O3',
    heading: 'The model is the story.',
    subheading: 'Senior people, on your problem, from the first conversation.',
  },
  parameters: { design: figmaDesign('2960:6876') },
  globals: { backgrounds: { value: 'white' } },
}

/**
 * The globe behind the set's own instances (`2846:4465`) is the ORBITAL
 * SPHERE, drawn rather than exported: the node is a screen capture of it with
 * a mouse cursor in the pixels. So it arrives through `decoration`, like every
 * other drawn ornament, and scales and turns.
 */
export const InteriorWithGlobe: Story = {
  args: {
    variant: 'interior',
    eyebrow: 'Work',
    heading: 'The problems behind the problems.',
    decoration: (
      <OrbitalSphere className="-z-10 hidden lg:bottom-[-40%] lg:right-[-10%] lg:block lg:w-[760px]" />
    ),
  },
}

/**
 * The band over a picture. `background` takes a `SectionBackground`, which lays
 * the media full-bleed and then the band's own colour over it, so the copy
 * keeps the contrast its surface promised. It sits under `decoration`, so a
 * sphere and a picture compose rather than replace each other. The stand-in
 * here is a flat plate; on a page it is the editor's upload.
 */
export const InteriorOverPicture: Story = {
  args: {
    variant: 'interior',
    eyebrow: 'Solutions',
    heading: 'Strategy, design, engineering and AI under one roof.',
    background: (
      <SectionBackground surface="ink">
        <div className="bg-brand" />
      </SectionBackground>
    ),
  },
}

/**
 * `/solutions` (`1925:6141`) — centred, which takes the headline to **60px**
 * in a 650px measure. The size follows the alignment because that is what the
 * two frames do; there is no centred 48px hero anywhere in the file.
 */
export const Centred: Story = {
  args: {
    eyebrow: 'Solutions',
    heading: 'Strategy, design, engineering and AI under one roof.',
    align: 'center',
  },
}

/**
 * A subheading with `align="center"` renders nothing — the centred frame has
 * no standfirst, and the component drops it rather than inventing a placement
 * for it. This story exists so that stays deliberate.
 */
export const CentredIgnoresSubheading: Story = {
  args: {
    eyebrow: 'Solutions',
    heading: 'Centred heroes carry no standfirst.',
    subheading: 'This text is deliberately not rendered.',
    align: 'center',
  },
}

/** Headline alone — no eyebrow, no standfirst. The band must not collapse. */
export const HeadingOnly: Story = {
  args: { heading: 'Just the headline.' },
}

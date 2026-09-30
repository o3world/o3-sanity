import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'

import { ArticleByline } from './article-byline'
import { PortraitTile } from './portrait-tile'

const portraits = [
  {
    name: 'Mike Gadsby',
    src: new URL(
      '../../../../tools/migration/data/seed/assets/about-portrait-current-gadsby.png',
      import.meta.url,
    ).href,
  },
  {
    name: 'Keith Scandone',
    src: new URL(
      '../../../../tools/migration/data/seed/assets/about-portrait-current-scandone.png',
      import.meta.url,
    ).href,
  },
  {
    name: 'Talia Edmundson',
    src: new URL(
      '../../../../tools/migration/data/seed/assets/about-portrait-current-edmundson.png',
      import.meta.url,
    ).href,
  },
  {
    name: 'Jay Forbes',
    src: new URL(
      '../../../../tools/migration/data/seed/assets/about-portrait-current-forbes.png',
      import.meta.url,
    ).href,
  },
  {
    name: 'Brady Halligan',
    src: new URL(
      '../../../../tools/migration/data/seed/assets/about-portrait-current-halligan.png',
      import.meta.url,
    ).href,
  },
  {
    name: 'Justin Handler',
    src: new URL(
      '../../../../tools/migration/data/seed/assets/about-portrait-current-handler.png',
      import.meta.url,
    ).href,
  },
  {
    name: 'Kelly Navari',
    src: 'https://cdn.sanity.io/images/naorcr6k/production/4ea64d19af76ce27002ec5bdea926b96d10fddaf-395x398.png',
  },
  {
    name: 'Jackie Ost',
    src: new URL(
      '../../../../tools/migration/data/seed/assets/about-portrait-current-ost.png',
      import.meta.url,
    ).href,
  },
  {
    name: 'Alex Boenisch',
    src: 'https://cdn.sanity.io/images/naorcr6k/production/69b8641c0c9509796d0aee121c78949cee67a3c3-395x398.png',
  },
]

const meta = {
  title: 'UI/PortraitTile',
  component: PortraitTile,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PortraitTile>

export default meta
type Story = StoryObj<typeof meta>

/** A newly added person without an authored portrait gets the black tile fallback. */
export const Empty: Story = {
  args: { className: 'w-[394px] max-w-full' },
}

export const WithPortrait: Story = {
  args: {
    className: 'w-[394px] max-w-full',
    children: (
      <img src={portraits[0]!.src} alt="Mike Gadsby" className="h-full w-full object-cover" />
    ),
  },
  play: async ({ canvasElement }) => {
    const image = canvasElement.querySelector('img')!
    await image.decode()
    await expect(image.naturalWidth).toBe(790)
    await expect(getComputedStyle(image.parentElement!).filter).toBe('none')
    await expect(getComputedStyle(image.parentElement!.parentElement!).borderRadius).toBe('16px')
    // Figma "Big Shadow": offset 0/32, blur 64, #00000033.
    await expect(getComputedStyle(image.parentElement!.parentElement!).boxShadow).toContain(
      'rgba(0, 0, 0, 0.2) 0px 32px 64px 0px',
    )
  },
}

/** Prepared compositions: seven current Figma exports and two retained editor draft portraits. */
export const FinishedCompositions: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {portraits.map(({ name, src }) => (
        <figure key={name} className="flex flex-col gap-6">
          <PortraitTile>
            <img src={src} alt="" className="h-full w-full object-cover" />
          </PortraitTile>
          <figcaption className="text-lead">{name}</figcaption>
        </figure>
      ))}
    </div>
  ),
}

/** The existing shared headshot field also feeds an Insight's 42px circular avatar. */
export const BylinePreview: Story = {
  render: () => (
    <div className="bg-ink p-8">
      <ArticleByline
        name="Mike Gadsby"
        {...{ role: 'Co-Founder, Chief Innovation Officer' }}
        headshot={<img src={portraits[0]!.src} alt="" className="h-full w-full object-cover" />}
      />
    </div>
  ),
}

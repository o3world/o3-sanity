import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './carousel'

const meta = {
  title: 'UI/Carousel',
  component: Carousel,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Carousel>

export default meta
type Story = StoryObj<typeof meta>

const slides = ['One', 'Two', 'Three', 'Four', 'Five']

/**
 * The anatomy every consumer composes: controls wherever the band's header
 * puts them (never floating over the track), slide spacing as a `gap-*` on
 * the content, slide measure as a `basis-*` on each item. Drag the track,
 * or focus it and use the arrow keys.
 */
export const Anatomy: Story = {
  render: () => (
    <Carousel opts={{ align: 'start' }} aria-label="Anatomy" className="max-w-[720px]">
      <div className="mb-6 flex justify-end gap-5">
        <CarouselPrevious />
        <CarouselNext />
      </div>
      <CarouselContent className="gap-6">
        {slides.map((slide) => (
          <CarouselItem key={slide} className="basis-[240px]">
            <div className="bg-surface-muted text-fg flex h-40 items-center justify-center">
              {slide}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  ),
}

/** One slide per view — the default `basis-full`, no measure set. */
export const OnePerView: Story = {
  render: () => (
    <Carousel opts={{ align: 'start' }} aria-label="One per view" className="max-w-[480px]">
      <div className="mb-6 flex justify-end gap-5">
        <CarouselPrevious />
        <CarouselNext />
      </div>
      <CarouselContent className="gap-6">
        {slides.map((slide) => (
          <CarouselItem key={slide}>
            <div className="bg-surface-muted text-fg flex h-40 items-center justify-center">
              {slide}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  ),
}

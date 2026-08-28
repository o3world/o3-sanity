'use client'

import * as React from 'react'
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'

import { cn } from '@o3/ui/lib/utils'

import { CarouselControl } from '../carousel-control'

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

interface CarouselProps {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  /** Hands the Embla instance up, for anything the parts here do not cover —
      a progress indicator, a slide counter. */
  setApi?: (api: CarouselApi) => void
}

interface CarouselContextProps extends CarouselProps {
  carouselRef: UseEmblaCarouselType[0]
  api: CarouselApi
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

/** The Embla instance and its scroll state, anywhere inside a `<Carousel>` —
    how a header row hosts the controls, and hides them when nothing moves. */
function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error('useCarousel must be used within <Carousel>')
  }
  return context
}

/**
 * shadcn's Carousel — Embla underneath — with two deliberate departures
 * (ADR 0008: shadcn's anatomy, O3's tokens):
 *
 * - **The arrows are `CarouselControl`**, Figma's `Icon / Surface`
 *   (`778:1862`), not shadcn's outline `Button`, and they are static rather
 *   than absolutely positioned: every frame that draws a carousel here puts
 *   the pair in the band's header row, never floating over the track.
 * - **No default slide spacing.** shadcn spaces slides with `-ml-4`/`pl-4`;
 *   the frames here give each track its own gap, so the consumer sets `gap-*`
 *   on `CarouselContent` and a width on each `CarouselItem`. Embla reads the
 *   slides' real offsets, so flex gap positions snap points correctly.
 *
 * Horizontal only — no frame draws a vertical track, so the axis prop shadcn
 * carries is not reproduced here.
 *
 * The root handles ArrowLeft/ArrowRight itself, so a track with no visible
 * controls (the how-we-work band) stays keyboard-reachable through a
 * `tabIndex` on the root.
 */
function Carousel({
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel({ ...opts, axis: 'x' }, plugins)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api])
  const scrollNext = React.useCallback(() => api?.scrollNext(), [api])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        scrollNext()
      }
    },
    [scrollPrev, scrollNext],
  )

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on('reInit', onSelect)
    api.on('select', onSelect)
    return () => {
      api.off('reInit', onSelect)
      api.off('select', onSelect)
    }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        opts,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

/** The clipping viewport and the flex track it clips. The consumer's
    `className` lands on the track: a `gap-*` there is the slide spacing. */
function CarouselContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { carouselRef } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div className={cn('flex', className)} {...props} />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn('min-w-0 shrink-0 grow-0 basis-full', className)}
      {...props}
    />
  )
}

function CarouselPrevious({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { scrollPrev, canScrollPrev } = useCarousel()
  return (
    <CarouselControl
      direction="prev"
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      className={className}
      {...props}
    />
  )
}

function CarouselNext({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { scrollNext, canScrollNext } = useCarousel()
  return (
    <CarouselControl
      direction="next"
      disabled={!canScrollNext}
      onClick={scrollNext}
      className={className}
      {...props}
    />
  )
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
}

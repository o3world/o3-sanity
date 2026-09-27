import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SectionProps } from '@o3/content-runtime/blocks'

import { ScreenGridSection } from './ScreenGridSection'

/**
 * The screen-grid band (`2230:3315`, `2230:7559`), #97.
 *
 * What a browser cannot be relied on to show an agent, and what is therefore
 * asserted here: each screen gets exactly one plate, the plate carries the
 * tone it was authored with, a `wide` screen spans both columns while a
 * standard one does not, and the plate clips rather than scrolls.
 *
 * The images are `null`: `SanityImage` renders nothing for an absent asset,
 * and what is under test is the grid, not the screenshots.
 */
const SCREENS = [
  { _key: 'a', media: { image: null, alt: 'The homepage' }, tone: 'ink', span: 'wide' },
  { _key: 'b', media: { image: null, alt: 'Checkout' }, tone: 'brand', span: 'standard' },
  { _key: 'c', media: { image: null, alt: 'Account' }, tone: 'bone', span: 'standard' },
]

const html = renderToStaticMarkup(
  <ScreenGridSection
    {...({ screens: SCREENS, surface: 'white' } as unknown as SectionProps<'screenGridSection'>)}
  />,
)

const plates = html.match(/<li[^>]*>/g) ?? []

const illustratedHtml = renderToStaticMarkup(
  <ScreenGridSection
    {...({
      screens: SCREENS.map((screen, index) => ({
        ...screen,
        media: {
          ...screen.media,
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: `image-${String(index + 1).repeat(40)}-1600x900-jpg`,
            },
          },
        },
      })),
      surface: 'white',
    } as unknown as SectionProps<'screenGridSection'>)}
  />,
)

describe('the screen grid band', () => {
  it('draws one plate per screen', () => {
    expect(plates).toHaveLength(SCREENS.length)
  })

  it('lays the plates out as a two-column grid below the frame’s 32px gutter band', () => {
    // 32px 96px on `2230:3315` — the gutter token plus py-8, not one of
    // SectionShell's band steps.
    expect(html).toContain('px-gutter')
    expect(html).toContain('py-8')
    expect(html).toContain('lg:grid-cols-2')
    expect(html).toContain('gap-8')
  })

  it('keeps the wide plate and removes backgrounds from smaller tiles', () => {
    expect(plates[0]).toContain('--gradient-screen-plate')
    expect(plates[1]).not.toContain('bg-brand-glow')
    expect(plates[2]).not.toContain('bg-bone')
  })

  it('spans a wide screen across both columns and leaves a standard one alone', () => {
    expect(plates[0]).toContain('lg:col-span-2')
    expect(plates[1]).not.toContain('lg:col-span-2')
    expect(plates[2]).not.toContain('lg:col-span-2')
  })

  it('gives every plate the frame’s 32px radius and clips what runs past it', () => {
    // The crop IS the effect (`2230:3315` sets an 807 × 2048 capture in a
    // 716-tall plate). An `overflow-x-*` here would be a sideways scroll at
    // 402 instead (ADR 0006).
    for (const plate of plates) {
      expect(plate).toContain('rounded-[32px]')
      expect(plate).toContain('overflow-hidden')
      expect(plate).not.toContain('overflow-x-')
    }
  })

  it('declares the image slot after the plate padding changes at lg', () => {
    expect(illustratedHtml).toContain(
      'sizes="(min-width: 1440px) calc(100vw - 278px), (min-width: 1024px) calc(89.402vw - 125.396px), calc(90vw - 64px)"',
    )
    expect(illustratedHtml).toContain(
      'sizes="(min-width: 1440px) calc(50vw - 91px), (min-width: 1024px) calc(44.701vw - 14.698px), 90vw"',
    )
  })

  it('falls back to a standard filled tile for values it does not know', () => {
    const odd = renderToStaticMarkup(
      <ScreenGridSection
        {...({
          screens: [{ _key: 'z', media: { image: null, alt: 'x' }, tone: null, span: null }],
          surface: 'white',
        } as unknown as SectionProps<'screenGridSection'>)}
      />,
    )
    expect(odd).not.toContain('--gradient-screen-plate')
    expect(odd).not.toContain('lg:col-span-2')
  })

  it.each([
    [1824, 2100],
    [1216, 684],
  ])('preserves the complete %sx%s standard image', (width, height) => {
    const dimensions = `${width}x${height}`
    const markup = renderToStaticMarkup(
      <ScreenGridSection
        {...({
          screens: [
            {
              _key: 'image',
              span: 'standard',
              media: {
                image: {
                  asset: {
                    _ref: `image-${'1'.repeat(40)}-${dimensions}-png`,
                    _type: 'reference',
                  },
                },
                alt: 'Full screenshot',
              },
            },
          ],
          surface: 'white',
        } as unknown as SectionProps<'screenGridSection'>)}
      />,
    )
    expect(markup).toContain('h-auto w-full')
    expect(markup).not.toContain('object-cover')
    expect(markup).not.toContain('aspect-')
    expect(markup).toContain(`height="${Math.round((1600 * height) / width)}"`)
  })

  it('renders a composed wide image without a second plate or crop', () => {
    const markup = renderToStaticMarkup(
      <ScreenGridSection
        {...({
          screens: [{ ...SCREENS[0], framing: 'image' }],
          surface: 'white',
        } as unknown as SectionProps<'screenGridSection'>)}
      />,
    )
    expect(markup).toContain('lg:col-span-2')
    expect(markup).not.toContain('--gradient-screen-plate')
    expect(markup).not.toContain('aspect-')
    expect(markup).not.toContain('shadow-')
    expect(markup).not.toContain('lg:px-16')
  })

  it('renders nothing when there are no screens', () => {
    expect(
      renderToStaticMarkup(
        <ScreenGridSection
          {...({ screens: [] } as unknown as SectionProps<'screenGridSection'>)}
        />,
      ),
    ).toBe('')
  })
})

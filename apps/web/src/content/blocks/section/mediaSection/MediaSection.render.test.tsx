import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SectionProps } from '@/content/blocks/sectionTypes'

import { MediaSection } from './MediaSection'

/**
 * The media band's three shapes — the two `width` values it shipped with, and
 * the `capture` variant the 2230-era frame added (`1647:1720`, #97).
 *
 * A real asset id, because the capture's own shadow and radius live on the
 * `<img>`: `SanityImage` renders nothing at all for an absent asset, so a null
 * image would take the thing under test out of the markup.
 */
const IMAGE = { asset: { _ref: 'image-abc0123456789abcdef0123456789abcdef0123-822x1555-png' } }

function render(props: Record<string, unknown>) {
  return renderToStaticMarkup(
    <MediaSection
      {...({
        media: { image: IMAGE, alt: 'A page capture' },
        surface: 'white',
        ...props,
      } as unknown as SectionProps<'mediaSection'>)}
    />,
  )
}

describe('the media band’s capture variant', () => {
  const html = render({ variant: 'capture' })

  it('builds the frame’s dark stage rather than a figure', () => {
    // 135° over the same two stops the screen-grid plates use, with the
    // frame's inset foot shadow.
    expect(html).toContain('--gradient-screen-stage')
    expect(html).toContain('shadow-[inset_0_-16px_16px_0_rgba(0,0,0,0.05)]')
  })

  it('crops the capture at the band’s floor instead of scaling it to fit', () => {
    // 700 at 1440 with 64px of top padding. The clip is the whole effect —
    // a band that grew to the capture's height would be a different design.
    expect(html).toContain('lg:h-[700px]')
    expect(html).toContain('pt-16')
    expect(html).toContain('overflow-hidden')
    expect(html).not.toContain('overflow-x-')
  })

  it('hangs the capture on the article measure, carrying the frame’s shadow', () => {
    expect(html).toContain('max-w-article')
    expect(html).toContain('shadow-[0_0_32px_0_rgba(0,0,0,0.4)]')
  })

  it('ignores `width` — a capture is full-bleed by construction', () => {
    // Studio hides the field; a document that still carries a value must not
    // change what renders.
    expect(render({ variant: 'capture', width: 'contained' })).toBe(html)
  })
})

describe('the media band’s plain variant', () => {
  it('still draws the contained figure on the article measure', () => {
    const html = render({ variant: 'plain', width: 'contained' })
    expect(html).toContain('max-w-article')
    expect(html).not.toContain('--gradient-screen-stage')
  })

  it('still bleeds edge to edge at the frame’s two aspects', () => {
    const html = render({ variant: 'plain', width: 'full-bleed' })
    expect(html).toContain('aspect-[402/257]')
    expect(html).toContain('lg:aspect-[1440/576]')
    expect(html).not.toContain('--gradient-screen-stage')
  })

  it('treats a missing variant as plain, which is what every pre-#97 document has', () => {
    expect(render({ width: 'contained' })).toBe(render({ variant: 'plain', width: 'contained' }))
  })
})

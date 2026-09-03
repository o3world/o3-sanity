import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import type { SectionProps } from '@o3/content-runtime/blocks'

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

/**
 * `backgroundMedia` — the field every section block carries, which this band
 * offered in Studio and drew nowhere (#239's injection reached the schema
 * before this renderer).
 */
describe('the picture the media band sits on', () => {
  const PICTURE = {
    _type: 'backgroundMedia',
    image: { asset: { _ref: 'image-abc0123456789abcdef0123456789abcdef0123-1440x790-png' } },
  }

  it('draws no background layer, and no stacking context, without one', () => {
    const html = render({ variant: 'plain', width: 'contained' })
    expect(html).not.toContain('aria-hidden')
    // `isolate` traps a negative-z layer, so a band with no picture must not
    // open one.
    expect(html).not.toContain('isolate')
  })

  it('hangs the picture behind each of the three shapes', () => {
    for (const props of [
      { variant: 'plain', width: 'contained' },
      { variant: 'plain', width: 'full-bleed' },
      { variant: 'capture' },
    ]) {
      const html = render({ ...props, backgroundMedia: PICTURE })
      expect(html, `${props.variant}/${props.width ?? '—'} drew no picture`).toContain('1440x790')
      expect(html).toContain('isolate')
    }
  })

  it('replaces the capture’s stage gradient rather than hiding under it', () => {
    // The stage gradient is opaque, so a band cannot carry both. The frame's
    // own stage (`1647:1720`) hangs its picture in exactly that slot.
    const html = render({ variant: 'capture', backgroundMedia: PICTURE })
    expect(html).not.toContain('--gradient-screen-stage')
    // The stage's geometry and its foot shadow stay: only the fill moves.
    expect(html).toContain('shadow-[inset_0_-16px_16px_0_rgba(0,0,0,0.05)]')
    expect(html).toContain('lg:h-[700px]')
  })

  it('tints the picture by default and leaves it alone when told to', () => {
    expect(render({ variant: 'plain', backgroundMedia: PICTURE })).toContain('bg-white/70')
    expect(
      render({ variant: 'plain', backgroundMedia: { ...PICTURE, tint: 'none' } }),
    ).not.toContain('bg-white/70')
  })
})

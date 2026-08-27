import { renderToStaticMarkup } from 'react-dom/server'
import { SectionShell } from '@o3/ui'
import { describe, expect, it } from 'vitest'

import { sectionBackground } from './sectionBackground'

/**
 * A band with no picture has to render the markup it rendered before the field
 * existed — which is every band on o3world.com and most of o3xo's.
 *
 * The trap this guards is that a React element is truthy even when it renders
 * nothing, so a renderer that always handed `SectionShell` a component would
 * wrap every band in a stacking context for a picture that is not there. That
 * is not cosmetic: `isolate` traps the negative-z decorations (`OrbitalSphere`,
 * the molecule mark) that several bands deliberately bleed out of theirs.
 */
const band = (background: ReturnType<typeof sectionBackground>) =>
  renderToStaticMarkup(
    <SectionShell surface="ink" background={background}>
      <p>Copy</p>
    </SectionShell>,
  )

describe('a band that carries no picture', () => {
  it.each([
    ['nothing at all', undefined],
    [
      'an empty object an editor opened and left',
      { _type: 'backgroundMedia' as const, image: null },
    ],
  ])('is nothing to render, given %s', (_case, media) => {
    expect(sectionBackground(media, 'ink')).toBeNull()
  })

  it('opens no stacking context', () => {
    expect(band(sectionBackground(undefined, 'ink'))).not.toContain('isolate')
  })
})

describe('a band that carries one', () => {
  const media = {
    _type: 'backgroundMedia' as const,
    image: {
      _type: 'image' as const,
      asset: { _id: 'image-abc123-1200x630-png', metadata: null },
    },
  }

  it('opens one, so the picture lands under the copy and no further', () => {
    expect(band(sectionBackground(media, 'ink'))).toContain('isolate')
  })

  it('draws the picture decorative — the band’s own copy says what it says', () => {
    expect(band(sectionBackground(media, 'ink'))).toMatch(/<img[^>]*alt=""/)
  })
})

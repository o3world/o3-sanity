import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { BLOCK_KNOBS } from '@o3/sanity/knobs'

import { Icon, ICON_NAMES, ICONS } from './Icon'

/**
 * The kit's icon set, against the two things it has to agree with: the knob
 * that names its glyphs, and the copy it is painted beside.
 *
 * `Icon.stories.tsx` shows all eighteen on both surfaces; a fill is not
 * something a rendered story can assert, which is why both files exist.
 */
const html = (node: React.ReactElement) => renderToStaticMarkup(node)

const iconKnob = BLOCK_KNOBS.featureGridSection?.items?.features?.knobs.find(
  (knob) => knob.name === 'icon',
)

describe('the set', () => {
  /**
   * THE ONE SEAM THAT FAILS SILENTLY. The knob lists names and carries no
   * drawing — `@o3/sanity/knobs` is bundled into the Studio and may not name
   * React (ADR 0020) — so a glyph missing from this app is not a crash: the
   * lookup misses, the band renders a feature with no icon, and the only report
   * is an editor saying it "didn't work". Nowhere else can see both lists.
   */
  it('draws every glyph the feature icon knob offers, and none it does not', () => {
    expect(iconKnob).toBeDefined()
    const offered = iconKnob!.options.map((option) => option.value).filter((it) => it !== 'none')

    expect([...ICON_NAMES].sort()).toEqual([...offered].sort())
  })

  it('is the eighteen of the kit’s `Phosphor Icons` set (`4404:5589`)', () => {
    expect(ICON_NAMES).toHaveLength(18)
  })

  it('resolves each name to its own drawing', () => {
    const drawings = ICON_NAMES.map((name) => html(<Icon name={name} />))
    expect(new Set(drawings).size).toBe(ICON_NAMES.length)
  })
})

describe('one glyph', () => {
  it('takes the colour of the copy beside it, so a band can invert', () => {
    // The kit's own exports carry `#232323` and `black`. Neither survives here:
    // a fill that names an ink has to be told what surface it is on.
    const drawing = html(<Icon name="sparkle" />)
    expect(drawing).toContain('fill="currentColor"')
    expect(drawing).not.toMatch(/#[0-9a-f]{3,6}/i)
  })

  it('draws in the set’s own 24-unit box', () => {
    expect(html(<Icon name="gear" />)).toContain('viewBox="0 0 24 24"')
  })

  it('is decorative — the feature’s heading is what says the same thing', () => {
    expect(html(<Icon name="users" />)).toContain('aria-hidden="true"')
  })

  it('is the same drawing through the map the canvas and the band both read', () => {
    const Bound = ICONS.handshake
    expect(html(<Bound />)).toBe(html(<Icon name="handshake" />))
  })
})

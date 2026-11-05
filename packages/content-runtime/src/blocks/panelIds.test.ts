import { describe, expect, it } from 'vitest'

import type { SanityBlock } from '@o3/sanity/types'

import { sectionAnchors } from './anchors'
import { pagePanelIds, panelIds } from './panelIds'

const railBand = (key: string, anchor: string | undefined, ...panelAnchors: string[]) =>
  ({
    _key: key,
    _type: 'railPanelsSection',
    anchor,
    panels: panelAnchors.map((panelAnchor, index) => ({ _key: `p${index}`, anchor: panelAnchor })),
  }) as unknown as SanityBlock

const page = (...blocks: SanityBlock[]) => pagePanelIds(blocks, sectionAnchors(blocks))

describe('pagePanelIds', () => {
  it('namespaces every band by its own key', () => {
    const ids = page(
      railBand('platforms', 'tech-platforms', 'sanity'),
      railBand('more', undefined, 'x'),
    )
    expect(ids.get('platforms')).toEqual(['tech-platforms-sanity'])
    expect(ids.get('more')).toEqual(['rail-panel-more-x'])
  })

  it('skips a block with no panels', () => {
    const quote = { _key: 'q', _type: 'quoteSection' } as unknown as SanityBlock
    expect(page(quote).has('q')).toBe(false)
  })

  it('yields a joined name another band holds as its own anchor', () => {
    // The band anchor is what buttons jump to, so it keeps the name wherever it
    // sits on the page; the panel takes its key-based id.
    const ids = page(railBand('platforms', 'tech-platforms', 'sanity'), {
      _key: 'later',
      _type: 'quoteSection',
      anchor: 'tech-platforms-sanity',
    } as unknown as SanityBlock)
    expect(ids.get('platforms')).toEqual(['rail-panel-platforms-p0'])
  })

  it('gives a joined name two bands both reach to the first', () => {
    const ids = page(
      railBand('a', 'tech-platforms', 'sanity'),
      railBand('b', 'tech', 'platforms-sanity'),
    )
    expect(ids.get('a')).toEqual(['tech-platforms-sanity'])
    expect(ids.get('b')).toEqual(['rail-panel-b-p0'])
  })
})

describe('panelIds', () => {
  it('joins the band anchor and the panel anchor', () => {
    expect(
      panelIds(
        [
          { _key: 'plat-sanity', anchor: 'sanity' },
          { _key: '7721a22e1c0a', anchor: 'vercel' },
          { _key: 'plat-lovable', anchor: 'lovable' },
        ],
        { sectionKey: 'platforms', sectionAnchor: 'tech-platforms' },
      ),
    ).toEqual(['tech-platforms-sanity', 'tech-platforms-vercel', 'tech-platforms-lovable'])
  })

  it('namespaces by the section key when no panel is anchored', () => {
    expect(
      panelIds([{ _key: 'plat-sanity' }, {}], {
        sectionKey: 'platforms',
        sectionAnchor: 'tech-platforms',
      }),
    ).toEqual(['rail-panel-platforms-plat-sanity', 'rail-panel-platforms-1'])
  })

  it('namespaces a panel anchor by the section key when the band has no anchor', () => {
    expect(
      panelIds([{ _key: 'a', anchor: 'sanity' }], { sectionKey: 'platforms', sectionAnchor: null }),
    ).toEqual(['rail-panel-platforms-sanity'])
  })

  it('drops the namespace when the section key is unknown', () => {
    expect(panelIds([{ _key: 'a' }], {})).toEqual(['rail-panel-a'])
  })

  it('gives a repeated panel anchor to the first panel only', () => {
    expect(
      panelIds(
        [
          { _key: 'a', anchor: 'sanity' },
          { _key: 'b', anchor: 'sanity' },
        ],
        { sectionKey: 'platforms', sectionAnchor: 'tech-platforms' },
      ),
    ).toEqual(['tech-platforms-sanity', 'rail-panel-platforms-b'])
  })

  it('trims both anchors, and treats a blank one as unset', () => {
    expect(
      panelIds(
        [
          { _key: 'a', anchor: ' sanity ' },
          { _key: 'b', anchor: '  ' },
        ],
        { sectionKey: 'platforms', sectionAnchor: ' tech-platforms ' },
      ),
    ).toEqual(['tech-platforms-sanity', 'rail-panel-platforms-b'])
  })
})

import { describe, expect, it } from 'vitest'

import { panelIds } from './panelIds'

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

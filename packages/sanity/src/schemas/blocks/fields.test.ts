import { describe, expect, it } from 'vitest'

import { panelAnchorNeedsBand } from './fields'

const home = (bandAnchor?: string) => ({
  _type: 'page',
  sections: [
    { _key: 'quote', _type: 'quoteSection' },
    {
      _key: 'platforms',
      _type: 'railPanelsSection',
      anchor: bandAnchor,
      panels: [{ _key: 'p1', anchor: 'sanity' }],
    },
  ],
})

const panelPath = ['sections', { _key: 'platforms' }, 'panels', { _key: 'p1' }, 'anchor']

describe('panelAnchorNeedsBand', () => {
  it('passes a panel anchor whose band has one', () => {
    expect(panelAnchorNeedsBand('sanity', home('tech-platforms'), panelPath)).toBe(true)
  })

  it('warns when the band has no anchor to join it to', () => {
    expect(panelAnchorNeedsBand('sanity', home(), panelPath)).toMatch(/band’s own Anchor/)
    expect(panelAnchorNeedsBand('sanity', home('  '), panelPath)).toMatch(/band’s own Anchor/)
  })

  it('passes an empty panel anchor', () => {
    expect(panelAnchorNeedsBand(undefined, home(), panelPath)).toBe(true)
    expect(panelAnchorNeedsBand('', home(), panelPath)).toBe(true)
  })

  it('passes when the band cannot be found, rather than guess', () => {
    expect(panelAnchorNeedsBand('sanity', undefined, panelPath)).toBe(true)
    expect(panelAnchorNeedsBand('sanity', home(), undefined)).toBe(true)
  })
})

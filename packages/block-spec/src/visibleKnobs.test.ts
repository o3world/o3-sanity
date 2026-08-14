import { describe, expect, it } from 'vitest'

import { defineBlockKnobs, knob } from './knob'
import type { KnobReader } from './types'
import { visibleKnobs } from './visibleKnobs'

const reader =
  (values: Record<string, unknown>): KnobReader =>
  (relPath) =>
    values[relPath]

const railPanels = defineBlockKnobs({
  type: 'railPanelsSection',
  title: 'Rail + panels',
  tier: 'section',
  knobs: [
    knob({
      name: 'layout',
      title: 'Layout',
      options: ['rail', 'cards'],
      initialValue: 'rail',
      bar: true,
    }),
    knob({
      name: 'rail',
      title: 'Rail counts',
      options: ['label', 'number'],
      initialValue: 'label',
      showWhen: { at: 'layout', mode: 'notOneOf', values: ['cards'] },
    }),
    knob({ name: 'surface', title: 'Surface', options: ['white', 'bone', 'ink'] }),
  ],
})

const names = (knobs: readonly { knob: { name: string } }[]) => knobs.map((k) => k.knob.name)

describe('visibleKnobs', () => {
  it('returns every knob whose gate passes, in declaration order', () => {
    const { all } = visibleKnobs({ spec: railPanels, read: reader({ layout: 'rail' }) })
    expect(names(all)).toEqual(['layout', 'rail', 'surface'])
  })

  it('drops a knob whose gate fails', () => {
    const { all } = visibleKnobs({ spec: railPanels, read: reader({ layout: 'cards' }) })
    expect(names(all)).toEqual(['layout', 'surface'])
  })

  it('resolves each surviving knob to its current option', () => {
    const { all } = visibleKnobs({ spec: railPanels, read: reader({ layout: 'cards' }) })
    expect(all[0]?.current).toEqual({ value: 'cards', title: 'Cards', isDefault: false })
    expect(all[1]?.current).toEqual({ value: undefined, title: 'Default', isDefault: true })
  })

  it('groups by surface, and always names every surface', () => {
    const { bySurface } = visibleKnobs({ spec: railPanels, read: reader({ layout: 'rail' }) })
    expect(names(bySurface.block)).toEqual(['layout', 'rail'])
    expect(names(bySurface.band)).toEqual(['surface'])
    expect(bySurface.item).toEqual([])
  })

  describe('the nesting gate', () => {
    it('drops band knobs when the block is nested, because it forms no band', () => {
      const { all, bySurface } = visibleKnobs({
        spec: railPanels,
        read: reader({ layout: 'rail' }),
        nested: true,
      })
      expect(names(all)).toEqual(['layout', 'rail'])
      expect(bySurface.band).toEqual([])
    })

    it('keeps them at page root, which is the default', () => {
      const rooted = visibleKnobs({ spec: railPanels, read: reader({}), nested: false })
      expect(names(rooted.bySurface.band)).toEqual(['surface'])
    })
  })

  describe('gate inheritance', () => {
    const spec = defineBlockKnobs({
      type: 'mediaSection',
      title: 'Media',
      tier: 'section',
      knobs: [
        knob({
          name: 'media',
          title: 'Media',
          options: ['image', 'video'],
          showWhen: { at: 'variant', mode: 'oneOf', values: ['capture'] },
        }),
        knob({ name: 'media.ratio', title: 'Ratio', options: ['square', 'wide'] }),
        knob({ name: 'mediaCaption', title: 'Caption', options: ['on', 'off'] }),
      ],
    })

    it('hides a child knob when its parent knob is gated out', () => {
      const { all } = visibleKnobs({ spec, read: reader({ variant: 'plain' }) })
      expect(names(all)).toEqual(['mediaCaption'])
    })

    it('shows the child once the parent gate passes', () => {
      const { all } = visibleKnobs({ spec, read: reader({ variant: 'capture' }) })
      expect(names(all)).toEqual(['media', 'media.ratio', 'mediaCaption'])
    })

    it('conjoins the child gate with the inherited one', () => {
      const gatedChild = defineBlockKnobs({
        type: 'mediaSection',
        title: 'Media',
        tier: 'section',
        knobs: [
          knob({
            name: 'media',
            title: 'Media',
            options: ['image', 'video'],
            showWhen: { at: 'variant', mode: 'oneOf', values: ['capture'] },
          }),
          knob({
            name: 'media.ratio',
            title: 'Ratio',
            options: ['square', 'wide'],
            showWhen: { at: 'media', mode: 'oneOf', values: ['image'] },
          }),
        ],
      })
      const shown = visibleKnobs({
        spec: gatedChild,
        read: reader({ variant: 'capture', media: 'image' }),
      })
      expect(names(shown.all)).toEqual(['media', 'media.ratio'])

      const ownGateFails = visibleKnobs({
        spec: gatedChild,
        read: reader({ variant: 'capture', media: 'video' }),
      })
      expect(names(ownGateFails.all)).toEqual(['media'])
    })

    it('does not inherit from a segment-boundary near-miss', () => {
      // `mediaCaption` is a sibling of `media`, not its child, so it survives
      // the parent's gate failing.
      const { all } = visibleKnobs({ spec, read: reader({ variant: 'plain' }) })
      expect(names(all)).toContain('mediaCaption')
    })
  })
})

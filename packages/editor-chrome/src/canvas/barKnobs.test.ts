import { describe, expect, it } from 'vitest'
import { vercelStegaCombine } from '@vercel/stega'
import { defineBlockKnobs, knob } from '@o3/block-spec'

import { barKnobs, blockKnobReader } from './barKnobs'

const BLOCK = 'sections[_key=="abc"]'

const hero = defineBlockKnobs({
  type: 'heroSection',
  title: 'Hero',
  tier: 'section',
  knobs: [
    knob({ name: 'variant', title: 'Composition', options: ['orbital', 'band'], bar: true }),
    knob({ name: 'decoration', title: 'Decoration', options: ['orbs', 'none'] }),
    knob({ name: 'surface', title: 'Surface', options: ['white', 'bone', 'ink'], bar: true }),
    knob({
      name: 'eyebrow',
      title: 'Eyebrow',
      options: ['on', 'off'],
      bar: true,
      showWhen: { at: 'variant', mode: 'oneOf', values: ['band'] },
    }),
  ],
})

const snapshotWith = (block: Record<string, unknown>) => ({
  sections: [{ _key: 'abc', _type: 'heroSection', ...block }],
})

describe('reading a knob path relative to its block', () => {
  it('resolves the path under the block, not under the document', () => {
    const read = blockKnobReader(snapshotWith({ variant: 'band' }), BLOCK)
    expect(read('variant')).toBe('band')
  })

  it('reads a nested path, and answers undefined where nothing is stored', () => {
    const read = blockKnobReader(snapshotWith({ media: { ratio: 'wide' } }), BLOCK)
    expect(read('media.ratio')).toBe('wide')
    expect(read('media.fit')).toBeUndefined()
    expect(read('variant')).toBeUndefined()
  })

  it('answers undefined for every path while the snapshot is still settling', () => {
    expect(blockKnobReader(undefined, BLOCK)('variant')).toBeUndefined()
  })

  it('strips stega encoding, so a stored value still matches its declared option', () => {
    // One invisible character makes 'band' === 'band' false, and the bar then
    // reports "Default" for a value the editor did choose — while every gate
    // reading that path quietly closes.
    const encoded = vercelStegaCombine('band', { origin: 'sanity.io', href: '/studio' })
    expect(encoded).not.toBe('band')
    expect(blockKnobReader(snapshotWith({ variant: encoded }), BLOCK)('variant')).toBe('band')
  })
})

describe('which knobs ride the bar', () => {
  const bar = (block: Record<string, unknown>, nested = false) =>
    barKnobs({ spec: hero, read: blockKnobReader(snapshotWith(block), BLOCK), nested })

  it('carries only the knobs that declare themselves bar-visible', () => {
    // `decoration` applies and resolves — it is simply menu-only (#110).
    expect(bar({ variant: 'orbital' }).map((resolved) => resolved.knob.name)).toEqual([
      'surface',
      'variant',
    ])
  })

  it('puts the band before the block, outside-in', () => {
    const surfaces = bar({ variant: 'orbital' }).map((resolved) => resolved.surface)
    expect(surfaces).toEqual(['band', 'block'])
  })

  it('drops band knobs for a nested block, whose host owns the strip', () => {
    expect(bar({ variant: 'orbital' }, true).map((resolved) => resolved.knob.name)).toEqual([
      'variant',
    ])
  })

  it('honours a knob’s own gate, so the bar cannot offer what the form hides', () => {
    expect(bar({ variant: 'orbital' }).map((r) => r.knob.name)).not.toContain('eyebrow')
    expect(bar({ variant: 'band' }).map((r) => r.knob.name)).toContain('eyebrow')
  })

  it('resolves each knob’s current value, marking an unset one as inherited', () => {
    const [, variant] = barKnobs({
      spec: defineBlockKnobs({
        type: 'heroSection',
        title: 'Hero',
        tier: 'section',
        knobs: [
          knob({ name: 'surface', title: 'Surface', options: ['ink'], bar: true }),
          knob({
            name: 'variant',
            title: 'Composition',
            options: ['orbital', 'band'],
            initialValue: 'orbital',
            bar: true,
          }),
        ],
      }),
      read: blockKnobReader(snapshotWith({}), BLOCK),
      nested: false,
    })
    // Unset and explicitly-default render the same page: the title is the
    // default's own either way, and `isDefault` is what tells them apart.
    expect(variant!.current).toEqual({ value: 'orbital', title: 'Orbital', isDefault: true })
  })
})

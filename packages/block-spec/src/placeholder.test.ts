import { describe, expect, it } from 'vitest'

import { defineBlockKnobs, defineItemKnobs, knob } from './knob'
import {
  initialKnobValues,
  newBlockContent,
  placeholderReferences,
  retainsPlaceholder,
} from './placeholder'

/**
 * WHAT ONE INSERT WRITES (#112), and the rule that decides what may be in it.
 *
 * The interesting assertions here are the refusals. A placeholder is content
 * that may be published without review, so the two things it must never do —
 * point at a document, and disagree with its own block about what type it is —
 * are checked at declaration time, and the tests below provoke both rather
 * than trusting the branch exists.
 */

const surface = knob({
  name: 'surface',
  title: 'Surface',
  options: ['white', 'bone', 'ink'],
  initialValue: 'bone',
})

const columns = knob({
  name: 'columns',
  title: 'Columns',
  options: ['1', '2', '3'],
  initialValue: '2',
  valueType: 'number',
})

/** A key generator with no randomness in it, so output is assertable. */
function countingKeys() {
  let next = 0
  return () => `k${++next}`
}

describe('placeholderReferences', () => {
  it('reads a reference under `asset` as an asset reference', () => {
    const found = placeholderReferences({
      _type: 'mediaSection',
      media: {
        _type: 'figure',
        image: { _type: 'image', asset: { _type: 'reference', _ref: 'image-abc-10x10-png' } },
      },
    })

    expect(found.document).toEqual([])
    expect(found.asset).toEqual([{ path: 'media.image.asset', ref: 'image-abc-10x10-png' }])
  })

  it('reads a reference anywhere else as a document reference', () => {
    const found = placeholderReferences({
      _type: 'logoWallSection',
      clients: [{ _key: 'a', _type: 'reference', _ref: 'client-o3' }],
    })

    expect(found.asset).toEqual([])
    expect(found.document).toEqual([{ path: 'clients[0]', ref: 'client-o3' }])
  })

  // Position is the ONLY thing that distinguishes the two kinds — Sanity spells
  // them identically — so a reference has to be a leaf. Descending into one
  // would report `_ref` a second time under whatever key it sat at.
  it('does not walk inside a reference', () => {
    const found = placeholderReferences({ asset: { _ref: 'image-abc-10x10-png', asset: {} } })
    expect(found.asset).toHaveLength(1)
  })
})

describe('defineBlockKnobs, on a placeholder', () => {
  it('refuses a placeholder that references a document', () => {
    expect(() =>
      defineBlockKnobs({
        type: 'logoWallSection',
        title: 'Logo wall',
        tier: 'section',
        knobs: [surface],
        placeholder: {
          _type: 'logoWallSection',
          clients: [{ _key: 'a', _type: 'reference', _ref: 'client-o3' }],
        },
      }),
    ).toThrow(/references a document at clients\[0\] → client-o3/)
  })

  it('refuses a placeholder declaring another block’s type', () => {
    expect(() =>
      defineBlockKnobs({
        type: 'ctaSection',
        title: 'CTA',
        tier: 'section',
        knobs: [surface],
        placeholder: { _type: 'quoteSection', quote: 'Borrowed.' },
      }),
    ).toThrow(/declares _type "quoteSection"/)
  })

  it('keeps an asset reference, which is the seeded-asset case', () => {
    const spec = defineBlockKnobs({
      type: 'mediaSection',
      title: 'Media',
      tier: 'section',
      knobs: [surface],
      placeholder: {
        _type: 'mediaSection',
        media: {
          _type: 'figure',
          image: { _type: 'image', asset: { _type: 'reference', _ref: 'image-abc-10x10-png' } },
        },
      },
    })

    expect(spec.placeholder).toBeDefined()
  })
})

describe('initialKnobValues', () => {
  it('stores a number-valued knob as a number', () => {
    const spec = defineBlockKnobs({
      type: 'layoutSection',
      title: 'Layout section',
      tier: 'section',
      knobs: [columns, surface],
    })

    expect(initialKnobValues(spec)).toEqual({ columns: 2, surface: 'bone' })
  })

  it('skips a knob with no declared default', () => {
    const spec = defineBlockKnobs({
      type: 'quoteSection',
      title: 'Quote',
      tier: 'section',
      knobs: [knob({ name: 'decoration', title: 'Decoration', options: ['orbs', 'none'] })],
    })

    expect(initialKnobValues(spec)).toEqual({})
  })

  it('nests a dotted knob path', () => {
    const spec = defineBlockKnobs({
      type: 'mediaSection',
      title: 'Media',
      tier: 'section',
      knobs: [
        knob({
          name: 'media.ratio',
          title: 'Ratio',
          options: ['wide', 'square'],
          initialValue: 'wide',
        }),
      ],
    })

    expect(initialKnobValues(spec)).toEqual({ media: { ratio: 'wide' } })
  })
})

describe('newBlockContent', () => {
  const spec = defineBlockKnobs({
    type: 'railPanelsSection',
    title: 'Rail + panels',
    tier: 'section',
    knobs: [surface],
    placeholder: {
      _type: 'railPanelsSection',
      heading: 'Section heading',
      panels: [
        { _key: 'one', _type: 'panel', railLabel: 'First' },
        { _key: 'two', _type: 'panel', railLabel: 'Second' },
      ],
    },
  })

  it('puts the knob defaults under the placeholder and stamps the type', () => {
    expect(newBlockContent({ spec, newKey: countingKeys() })).toEqual({
      _type: 'railPanelsSection',
      surface: 'bone',
      heading: 'Section heading',
      panels: [
        { _key: 'k1', _type: 'panel', railLabel: 'First' },
        { _key: 'k2', _type: 'panel', railLabel: 'Second' },
      ],
    })
  })

  // The authored keys are literals — the generated type requires a string —
  // so shipping them would put `_key: 'one'` on every rail panel in the
  // dataset, beside siblings that all came from `randomKey()`.
  it('re-keys every member, deeply', () => {
    const first = newBlockContent({ spec, newKey: countingKeys() })
    const panels = (first as { panels: { _key: string }[] }).panels
    expect(panels.map((panel) => panel._key)).toEqual(['k1', 'k2'])
  })

  it('lets a placeholder override a knob default', () => {
    const opinionated = defineBlockKnobs({
      type: 'heroSection',
      title: 'Hero',
      tier: 'section',
      knobs: [surface],
      placeholder: { _type: 'heroSection', surface: 'ink' },
    })

    expect(newBlockContent({ spec: opinionated, newKey: countingKeys() })).toEqual({
      _type: 'heroSection',
      surface: 'ink',
    })
  })

  // An array member is its own knob root, so its defaults are nowhere in the
  // block's roster — and a screen added from the form IS created with a tone.
  it('gives an array member its own knob defaults', () => {
    const grid = defineBlockKnobs({
      type: 'screenGridSection',
      title: 'Screen grid',
      tier: 'section',
      knobs: [surface],
      items: {
        screens: defineItemKnobs({
          type: 'screen',
          title: 'Screen',
          knobs: [
            knob({ name: 'tone', title: 'Tone', options: ['ink', 'bone'], initialValue: 'ink' }),
          ],
        }),
      },
      placeholder: {
        _type: 'screenGridSection',
        screens: [
          { _key: 'one', _type: 'screen', media: { _type: 'figure', alt: 'A screenshot' } },
        ],
      },
    })

    expect(newBlockContent({ spec: grid, newKey: countingKeys() })).toEqual({
      _type: 'screenGridSection',
      surface: 'bone',
      screens: [
        {
          _key: 'k1',
          _type: 'screen',
          tone: 'ink',
          media: { _type: 'figure', alt: 'A screenshot' },
        },
      ],
    })
  })

  it('answers nothing for a block that declares no placeholder', () => {
    const bare = defineBlockKnobs({
      type: 'quoteSection',
      title: 'Quote',
      tier: 'section',
      knobs: [surface],
    })

    expect(newBlockContent({ spec: bare, newKey: countingKeys() })).toBeUndefined()
  })
})

describe('retainsPlaceholder', () => {
  const placeholder = {
    _type: 'ctaSection',
    heading: 'Section heading',
    cta: { _type: 'cta', label: 'Add a link' },
  }

  it('matches content nobody came back to', () => {
    expect(
      retainsPlaceholder(
        {
          _key: 'abc',
          _type: 'ctaSection',
          surface: 'ink',
          heading: 'Section heading',
          cta: { _type: 'cta', label: 'Add a link' },
        },
        placeholder,
      ),
    ).toBe(true)
  })

  // Subset, so filling in the fields a placeholder could not supply — the
  // references, the surface — does not hide copy that is still placeholder copy.
  it('still matches when the editor set something the placeholder left alone', () => {
    expect(
      retainsPlaceholder(
        {
          _type: 'ctaSection',
          heading: 'Section heading',
          body: 'Real prose.',
          cta: { _type: 'cta', label: 'Add a link' },
        },
        placeholder,
      ),
    ).toBe(true)
  })

  it('stops matching the moment the copy is edited', () => {
    expect(
      retainsPlaceholder(
        { _type: 'ctaSection', heading: 'Talk to us', cta: { _type: 'cta', label: 'Add a link' } },
        placeholder,
      ),
    ).toBe(false)
  })

  it('ignores keys, which the inserter minted fresh', () => {
    expect(
      retainsPlaceholder(
        { _type: 'x', rows: [{ _key: 'minted', label: 'One' }] },
        { _type: 'x', rows: [{ _key: 'authored', label: 'One' }] },
      ),
    ).toBe(true)
  })

  it('does not match a member the editor removed', () => {
    expect(
      retainsPlaceholder(
        { _type: 'x', rows: [{ _key: 'a', label: 'One' }] },
        {
          _type: 'x',
          rows: [
            { _key: 'a', label: 'One' },
            { _key: 'b', label: 'Two' },
          ],
        },
      ),
    ).toBe(false)
  })
})

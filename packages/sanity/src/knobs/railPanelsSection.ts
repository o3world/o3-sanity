import { defineBlockKnobs, knob } from '@o3/block-spec'
import { decorationKnob } from './decoration'
import { surfaceKnob } from './surface'
import type { RailPanelsSection } from '../types/generated'

/**
 * The rail band's design options — the block with two axes, where the second
 * one applies under exactly one value of the first.
 *
 * Read this file to know what the band offers. The Sanity fields, and the
 * canvas toolbar's controls, are generated from it, so neither can offer a
 * value this file does not list.
 */
export const railPanelsSectionKnobs = defineBlockKnobs({
  type: 'railPanelsSection',
  title: 'Rail + panels',
  tier: 'section',
  knobs: [
    {
      ...decorationKnob(['none', 'molecule']),
      showWhen: { at: 'layout', mode: 'oneOf', values: ['cards'] },
    },
    knob({
      name: 'layout',
      title: 'Layout',
      description:
        'Arrange panels beside a rail, as engagement columns, as service rows with an outcome, as service rows with details only, or on a scrolling track.',
      options: [
        { value: 'rail', title: 'Rail' },
        { value: 'cards', title: 'Engagement columns' },
        { value: 'rows', title: 'Service rows with outcomes' },
        { value: 'grid', title: 'Service rows with details' },
        { value: 'track', title: 'Scrolling track' },
      ],
      initialValue: 'rail',
    }),
    knob({
      name: 'headerWidth',
      title: 'Header width',
      description:
        'Service rows: standard 821px header or the wide 1035px Engineering lockup (4039:49385).',
      options: ['standard', 'wide'],
      initialValue: 'standard',
      showWhen: { at: 'layout', mode: 'oneOf', values: ['rows'] },
    }),
    knob({
      name: 'rail',
      title: 'Rail',
      description:
        'Rail layout only — what the rail counts off: each panel’s label (the platforms band) or its position, numbered 01/02/03. No other layout has a rail, so none of them asks.',
      // A variant of the block rather than a second block — #42: the rail
      // composition is one thing and this is the only value that moves inside
      // it. Numbers derive from order, the same rule caseStudy.story’s
      // chapters already follow (CONTEXT.md).
      options: ['label', 'number'],
      initialValue: 'label',
      // The gate lives on the knob rather than on a `hiddenUnless` wrapper,
      // because `rail` is itself a design option: the toolbar has to know not
      // to draw it on the rail-less layouts, and a closure would tell it
      // nothing (ADR 0020). Stated as the one layout that HAS a rail rather
      // than the list that lack one, so a fifth layout never has to remember
      // to join a negative list. `emptyMatches`, because an unset `layout`
      // falls back to the rail composition (the `ORB_ONLY` precedent in
      // `mark.ts`).
      showWhen: { at: 'layout', mode: 'oneOf', values: ['rail'], emptyMatches: true },
    }),
    knob({
      name: 'plate',
      title: 'Plate',
      description:
        'Rail layout only — the shape of each panel’s picture. Square is the 395px plate beside the copy. To the right edge keeps that left edge and runs the picture off the right of the screen, cropped to the plate’s height; on a phone it runs from the copy’s edge to the right edge the same way.',
      // Home's platforms frame (`2747:4503`) draws the plate at 491, which is
      // the 395 the content column leaves for it plus the 96 gutter: the
      // picture already meets the frame's right edge there. `square` is the
      // plate the column's own sum allows; `bleed` is the frame's edge.
      options: [
        { value: 'square', title: 'Square' },
        { value: 'bleed', title: 'To the right edge' },
      ],
      initialValue: 'square',
      showWhen: { at: 'layout', mode: 'oneOf', values: ['rail'], emptyMatches: true },
    }),
    surfaceKnob({ initialValue: 'white' }),
  ],
  /**
   * Two panels, because `panels` declares `min(2)` and a rail with one panel is
   * not the band. A placeholder answers for what the schema requires: an insert
   * is a plain `insert` patch, so nothing applies the form's own initial values
   * on the way in.
   */
  placeholder: {
    _type: 'railPanelsSection',
    heading: 'A heading for this section.',
    intro: 'Add the standfirst that introduces the panels.',
    panels: [
      {
        _key: 'first',
        _type: 'panel',
        railLabel: 'First',
        heading: 'First panel',
        body: 'Add this panel’s copy.',
      },
      {
        _key: 'second',
        _type: 'panel',
        railLabel: 'Second',
        heading: 'Second panel',
        body: 'Add this panel’s copy.',
      },
    ],
  } satisfies RailPanelsSection,
})

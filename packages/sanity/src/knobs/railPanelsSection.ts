import { defineBlockKnobs, knob } from '@o3/block-spec'
import { surfaceKnob } from './surface'
import type { RailPanelsSection } from '../types/generated'

/**
 * The rail band's design options — the block with two axes, where the second
 * one only applies under half of the first.
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
    knob({
      name: 'layout',
      title: 'Layout',
      description:
        'How the panels are arranged: a numbered/labelled rail beside tall panels, a row of ink cards, hairlined numbered rows, or side-by-side columns of details.',
      // The Solutions frame (1925:6108) carries the SAME band as Home's
      // ways-to-work (1762:2168) — same heading, same standfirst, same three
      // engagements — in a different arrangement: no rail, no media square,
      // three 394×526 ink cards each holding a halftone disc. Identical
      // content, different shape, so it is a layout axis rather than a second
      // block — the test featureGridSection's `grid | orbital` and
      // inFlightSection's `cards | rows` already passed (#47, #56, #50).
      // `rows` is the partner page's "Three Core Services" (`2334:2170`, #92):
      // the same ordered set of offers again, as full-width hairlined rows
      // with the numeral inline in an ink circle instead of in a sticky rail.
      // Third arrangement, same content, so it joins the axis rather than
      // starting a fourth block.
      // `grid` is the redesigned Solutions frame's service grid (`2358:2788`,
      // #93): the panels side by side as columns, each one's details stacked
      // under its heading — no rail, no numerals, no media square.
      options: ['rail', 'cards', 'rows', 'grid'],
      initialValue: 'rail',
    }),
    knob({
      name: 'rail',
      title: 'Rail',
      description:
        'Rail layout only — what the rail counts off: each panel’s label (the platforms band) or its position (the ways-to-work band, where the frame numbers 01/02/03). The rows layout always numbers, so it does not ask.',
      // Both canonical bands (1762:2149 and 1762:2168) share one composition
      // and differ only here, so this is a variant of the block rather than a
      // second block — #42. Numbers derive from order, the same rule
      // caseStudy.story’s chapters already follow (CONTEXT.md).
      options: ['label', 'number'],
      initialValue: 'label',
      // The gate lives on the knob rather than on a `hiddenUnless` wrapper,
      // because `rail` is itself a design option: the toolbar has to know not
      // to draw it on the rail-less layouts, and a closure would tell it
      // nothing (ADR 0020). Stated as the one layout that HAS a rail rather
      // than the list that lack one, so a fifth layout never has to remember
      // to join a negative list — and a single-value gate is the only shape
      // `knobArgs` can map to a Storybook `if` condition. `emptyMatches`,
      // because an unset `layout` falls back to the rail composition (the
      // `ORB_ONLY` precedent in `mark.ts`).
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

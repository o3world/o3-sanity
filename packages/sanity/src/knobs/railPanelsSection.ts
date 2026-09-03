import { defineBlockKnobs, knob } from '@o3/block-spec'
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
    knob({
      name: 'layout',
      title: 'Layout',
      description:
        'How the panels are arranged: a numbered/labelled rail beside tall panels, a row of ink cards, hairlined numbered rows, side-by-side columns of details, or a track of numbered columns that scrolls sideways.',
      // The Solutions frame (1925:6108) carries the same three engagements
      // Home's band does — same heading, same standfirst — in a different
      // arrangement: no rail, no media square, three 394×526 ink cards each
      // holding a halftone disc. Identical
      // content, different shape, so it is a layout axis rather than a second
      // block — the test featureGridSection's `grid | orbital` and
      // inFlightSection's `cards | rows` already passed (#47, #56, #50).
      // `rows` is the partner page's "Three Core Services" (`2749:6863`):
      // the same ordered set of offers again, as full-width hairlined rows
      // with the numeral inline in an ink circle instead of in a sticky rail.
      // Third arrangement, same content, so it joins the axis rather than
      // starting a fourth block.
      // `grid` is the redesigned Solutions frame's service grid (`2358:2788`,
      // #93): the panels side by side as columns, each one's details stacked
      // under its heading — no rail, no numerals, no media square.
      // `track` is Home's redesigned ways-to-work band (`2846:5480`, #309):
      // the same three engagements again, as columns on a rule that scrolls
      // sideways. It replaces the rail-with-numbers composition rather than
      // varying it — there is no rail to count anything off — which is why it
      // is a fifth arrangement and not a second `rail` value.
      options: ['rail', 'cards', 'rows', 'grid', 'track'],
      initialValue: 'rail',
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
      // to join a negative list — and a single-value gate is the only shape
      // `knobArgs` can map to a Storybook `if` condition. `emptyMatches`,
      // because an unset `layout` falls back to the rail composition (the
      // `ORB_ONLY` precedent in `mark.ts`).
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

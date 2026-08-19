import { defineBlockKnobs } from '@o3/block-spec'
import { surfaceKnob } from './surface'
import type { FaqSection } from '../types/generated'

/**
 * The FAQ band's design options — `surface` and nothing else.
 *
 * The kit draws one arrangement (`4406:7288`): a heading and standfirst over a
 * single column of rows, on a photograph. There is no second composition to
 * offer, so this is a one-knob spec rather than an incomplete one.
 *
 * `ink` is the default because the band the kit draws sits on a near-black
 * starfield and writes in white; a band that swaps its picture for a lighter
 * one turns the knob rather than the renderer.
 */
export const faqSectionKnobs = defineBlockKnobs({
  type: 'faqSection',
  title: 'FAQ',
  tier: 'section',
  knobs: [surfaceKnob({ initialValue: 'ink' })],
  placeholder: {
    _type: 'faqSection',
    heading: 'Frequently asked questions',
    questions: [
      {
        _type: 'question',
        _key: 'q1',
        heading: 'A question a reader actually asks.',
        body: 'The answer, in one paragraph.',
      },
    ],
  } satisfies FaqSection,
})

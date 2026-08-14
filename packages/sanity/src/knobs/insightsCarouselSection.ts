import { defineBlockKnobs } from '@o3/block-spec'
import { surfaceKnob } from './surface'
import type { InsightsCarouselSection } from '../types/generated'

/**
 * The insights carousel's design options — `surface` and nothing else.
 *
 * The band has one composition, and its two authoring choices are content
 * rather than design: which insights it carries, and — when it auto-fills —
 * which category to draw them from. `category`'s `hidden` callback stays a
 * closure, because what it gates on is "did the editor pick any insights", an
 * array's emptiness rather than a value from a closed set, and no `showWhen`
 * mode says that. An editorial field's gate is allowed to be a closure; a
 * knob's is not (ADR 0020).
 */
export const insightsCarouselSectionKnobs = defineBlockKnobs({
  type: 'insightsCarouselSection',
  title: 'Insights carousel',
  tier: 'section',
  knobs: [surfaceKnob({ initialValue: 'bone' })],
  /**
   * Nothing else is needed: an empty `insights` is the band's auto-fill state,
   * so a placeholder carousel draws the latest insights rather than an empty
   * rail. That is the one block where leaving a reference field alone produces
   * a finished-looking band.
   */
  placeholder: {
    _type: 'insightsCarouselSection',
    heading: 'A heading for this carousel.',
  } satisfies InsightsCarouselSection,
})

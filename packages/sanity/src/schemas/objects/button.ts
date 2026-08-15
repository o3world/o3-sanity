import { defineField } from 'sanity'
import { ROUTABLE_TYPES } from '../../constants'
import { buttonKnobs } from '../../knobs/button'
import { validateAnchorName } from '../blocks/fields'
import { defineSharedObject } from './defineSharedObject'

/**
 * A button, wherever one is placed — including the one that submits the
 * inquiry form.
 *
 * `variant` is declared in `src/knobs/button.ts` and its field is generated
 * from that declaration (ADR 0023), so the canvas offers the fill an editor can
 * already see in the form. Everything else here is editorial.
 *
 * **A destination is a union of four arms**: nothing, `target`, `href`, or
 * `anchor`. Which arm a button is on is read back from which field carries a
 * value, in that precedence, and the renderer picks its element from the
 * answer — a destination is a link, no destination is a control.
 *
 * There is no stored field naming the arm. A value already says which arm it
 * belongs to, so a second field holding the same fact could only ever
 * disagree with it; and a picker offering four arms is a closed value set that
 * is not a design option (CONTEXT.md → Knobs — an editor choosing where a
 * button goes is authoring content, not turning a knob on the canvas), so it
 * would have to be declared editorial for `knobGuard` and would still buy
 * nothing the fields do not already say.
 *
 * The gates hide the arms an outranking field has already claimed, so an
 * editor sees one destination at a time. They cascade one way only: a document
 * that somehow holds two arms still shows the one that wins, so clearing it
 * brings the next back rather than hiding both.
 */
export const button = defineSharedObject({
  knobs: buttonKnobs,
  fields: [
    defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'target',
      title: 'Internal target',
      type: 'reference',
      to: ROUTABLE_TYPES.map((type) => ({ type })),
      description: 'Point at a document, and the link survives that page being renamed.',
    }),
    defineField({
      name: 'href',
      title: 'External URL',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https', 'mailto'], allowRelative: true }),
      // Stays a closure: the gate reads whether a REFERENCE is filled in, which
      // no `showWhen` mode expresses. An editorial field is allowed one.
      hidden: ({ parent }) => Boolean(parent?.target),
    }),
    defineField({
      name: 'anchor',
      title: 'Anchor on this page',
      type: 'string',
      description: 'A named place further down this page, written without the #.',
      // The same rule the band's own `anchor` field validates against, called
      // rather than restated (#149): this end writes `#` + the value and that
      // end writes it as an `id`, so a rule enforced at one end only would let
      // an editor author a link that can never resolve.
      validation: (rule) => rule.custom((value: string | undefined) => validateAnchorName(value)),
      hidden: ({ parent }) => Boolean(parent?.target || parent?.href),
    }),
    'variant',
  ],
  preview: {
    select: { title: 'label', subtitle: 'href' },
  },
})

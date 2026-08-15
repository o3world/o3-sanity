import { defineField } from 'sanity'
import { ROUTABLE_TYPES } from '../../constants'
import { buttonKnobs } from '../../knobs/button'
import { defineSharedObject } from './defineSharedObject'

/**
 * A button, wherever one is placed.
 *
 * `variant` is declared in `src/knobs/button.ts` and its field is generated
 * from that declaration (ADR 0023), so the canvas offers the fill an editor can
 * already see in the form. Everything else here is editorial.
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
      description: 'Pick an internal document — or leave empty and set an external URL.',
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
    'variant',
  ],
  preview: {
    select: { title: 'label', subtitle: 'href' },
  },
})

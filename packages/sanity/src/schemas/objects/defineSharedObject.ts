import { defineType } from 'sanity'
import type { ObjectDefinition } from 'sanity'
import type { ObjectKnobs } from '@o3/block-spec'

import { withKnobFields, type KnobbedField } from '../blocks/knobFields'

/**
 * A SHARED OBJECT THAT DECLARES ITS OWN DESIGN OPTIONS (#145, ADR 0023).
 *
 * `defineSectionBlock` and `defineArrayItem` are the same factory at the other
 * two roots: a spec in, the generated fields spliced into an authored list, one
 * registered type out. The splice is shared rather than re-implemented
 * (`withKnobFields`), because field ORDER is what typegen publishes — a knob
 * that lands after the editorial fields when the author wrote it before moves
 * `generated.ts`, and every renderer's props move with it.
 *
 * **`knobs` is required, and that is the enforcement half of ADR 0023.** A
 * shared object with design options and no declaration would publish an enum
 * the form shows and the canvas has never heard of — the silent miss the
 * inversion exists to remove. The other half is `knobGuard.test.ts`, which
 * walks every registered shared object and fails on a closed value set no knob
 * answers for, so an object that reaches for `defineType` directly is caught
 * too.
 *
 * The object's `name` and `title` come from the spec, so a type cannot be filed
 * under a name its declaration does not answer to — the rule `BLOCK_KNOBS` and
 * `defineArrayItem` already keep.
 */
export function defineSharedObject({
  knobs,
  fields,
  preview,
}: {
  /** The object's design options, carrying its registered type name and title. */
  knobs: ObjectKnobs
  /** Editorial fields, and each knob's name where its generated field belongs. */
  fields: KnobbedField[]
  preview?: ObjectDefinition['preview']
}) {
  return defineType({
    name: knobs.type,
    title: knobs.title,
    type: 'object',
    fields: withKnobFields('defineSharedObject', knobs.type, fields, knobs),
    ...(preview ? { preview } : {}),
  })
}

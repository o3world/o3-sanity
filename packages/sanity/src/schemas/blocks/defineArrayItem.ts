import { defineArrayMember } from 'sanity'
import type { ObjectDefinition } from 'sanity'
import type { ItemKnobs } from '@o3/block-spec'

import { withKnobFields, type KnobbedField } from './knobFields'

/**
 * AN ARRAY MEMBER THAT DECLARES ITS OWN DESIGN OPTIONS (#122).
 *
 * `defineSectionBlock` is the same factory one level up: a spec in, the
 * generated fields spliced into an authored list, one `defineType` out. This
 * one emits a `defineArrayMember` instead, because a member is not a registered
 * type — it is an inline object inside one array's `of`.
 *
 * The splice is shared rather than re-implemented (`withKnobFields`), and that
 * is the point of the file. Field ORDER is what typegen publishes: a member
 * whose knobs land after its editorial fields when the author wrote them before
 * moves `generated.ts`, and the renderer's props move with it. One rule, one
 * place, both roots.
 *
 * A member's knobs are its own — `tone`, not `screens[].tone`. That is what
 * makes this the same splice and not a similar one, and it is the whole shape
 * of #122: an array member is its own knob root, so nothing here needs array
 * vocabulary.
 */
export function defineArrayItem({
  knobs,
  fields,
  preview,
}: {
  /**
   * The member's design options. It carries the member's `_type` as its own
   * `type`, so the emitted member cannot be filed under a name its declaration
   * does not answer to — the rule `BLOCK_KNOBS` already keeps for blocks.
   */
  knobs: ItemKnobs
  /** Editorial fields, and each knob's name where its generated field belongs. */
  fields: KnobbedField[]
  preview?: ObjectDefinition['preview']
}) {
  return defineArrayMember({
    type: 'object',
    name: knobs.type,
    title: knobs.title,
    fields: withKnobFields('defineArrayItem', knobs.type, fields, knobs),
    ...(preview ? { preview } : {}),
  })
}

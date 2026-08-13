import { defineField } from 'sanity'

/**
 * Shared field factories — the `defineField` calls more than one block needs,
 * written once. Sits beside `defineBlocks.ts` because these are the same kind
 * of thing: the parts a block is assembled from rather than a block itself.
 *
 * Add one the moment you are about to copy a field definition between blocks
 * (`CONTEXT.md` → Naming, and the `content-naming` skill's step 3).
 */

/**
 * The `decoration` enum: which piece of the orbital vocabulary a band hangs
 * behind its copy, or `none`.
 *
 * **Each block passes its own list**, because what a band can carry is a fact
 * about that band's composition — `heroSection` and `ctaSection` offer
 * `orbs | none`, and `quoteSection` adds the case-study `molecule`
 * (`2250:1525`, #97). What is shared, and what was copy-pasted into three
 * blocks before this existed, is the field itself: the name, the string type,
 * the horizontal radio layout, and the rule that the first option is the
 * default.
 *
 * The list is a non-empty tuple so there is always an `initialValue` — an enum
 * without one is the drift this factory exists to stop.
 */
export function decorationField(options: readonly [string, ...string[]]) {
  return defineField({
    name: 'decoration',
    type: 'string',
    options: { list: [...options], layout: 'radio', direction: 'horizontal' },
    initialValue: options[0],
  })
}

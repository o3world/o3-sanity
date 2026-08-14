import { newBlockContent, placeholderReferences } from '@o3/block-spec'
import { describe, expect, it } from 'vitest'

import { SECTION_BLOCKS } from '../schemas/blocks/registry'
import { BLOCK_KNOBS } from './index'

/**
 * EVERY BLOCK THE INSERT MENU CAN OFFER HAS SOMETHING TO INSERT (#112).
 *
 * The menu is derived: it offers an array's declared members, and a member with
 * no placeholder is a row it cannot build, so it does not build one. That is
 * the right behaviour and it is also silent — a block that quietly stops being
 * insertable looks exactly like one nobody wanted. This is where it stops being
 * silent.
 *
 * The commit-safe rule itself is enforced two files away and in two halves.
 * `defineBlockKnobs` refuses a document reference at declaration time, so the
 * Studio does not start with one in it (provoked in
 * `packages/block-spec/src/placeholder.test.ts`). Whether an asset reference
 * points at a **seeded** asset is a fact about the dataset, so that half lives
 * with the manifest, in `tools/migration/src/placeholder.test.ts`. What is left
 * here is the pair of claims only this package can make: that the set is
 * complete, and that a placeholder has not started mirroring the knobs beside
 * it.
 */

const SPECS = SECTION_BLOCKS.map((type) => [type, BLOCK_KNOBS[type]!] as const)

describe('every section block declares a placeholder', () => {
  it.each(SPECS)('%s', (type, spec) => {
    expect(
      spec.placeholder,
      `${type} declares no placeholder — the insert menu cannot offer it`,
    ).toBeDefined()
  })
})

describe('a placeholder is commit-safe', () => {
  // Restating the refusal `defineBlockKnobs` already makes, at the one scale
  // that matters: all sixteen at once. The constructor answers for the block in
  // front of it; this answers for the set, so a seventeenth cannot arrive
  // through some future path that skips the constructor.
  it.each(SPECS)('%s references no document', (type, spec) => {
    const found = placeholderReferences(spec.placeholder)
    expect(
      found.document,
      `${type}'s placeholder points at a document — leave the field empty and let the editor pick`,
    ).toEqual([])
  })
})

describe('a placeholder declares content, never design options', () => {
  /**
   * The drift this catches: a placeholder that writes `surface: 'ink'` when the
   * surface knob's `initialValue` is already `'ink'`. It would work, and it
   * would be a second copy of the block's default — exactly the mirror ADR 0020
   * exists to remove, arriving through the one artifact added since.
   *
   * A placeholder MAY set a knob; `newBlockContent` lets it win, for the block
   * whose starting look is deliberately not its default. What it may not do is
   * agree, because agreement is what nothing checks.
   */
  it.each(SPECS)('%s restates no knob default', (type, spec) => {
    const restated = spec.knobs
      .filter((knob) => knob.initialValue !== undefined)
      .filter((knob) => {
        const declared = (spec.placeholder as Record<string, unknown>)[knob.name]
        return declared !== undefined && String(declared) === knob.initialValue
      })
      .map((knob) => knob.name)

    expect(
      restated,
      `${type}'s placeholder repeats the initialValue of ${restated.join(', ')} — the knob already answers for it`,
    ).toEqual([])
  })
})

describe('newBlockContent', () => {
  // The knob defaults are what a form-created block would have been given, and
  // an insert patch goes nowhere near the form. Asserted per block rather than
  // in the abstract, because the failure — a hero inserted with no `variant`
  // beside one created with `orbital` — is invisible until two editors compare
  // two bands that should be the same.
  it.each(SPECS)('%s arrives with its knob defaults applied', (type, spec) => {
    const content = newBlockContent({ spec, newKey: () => 'key' })!
    const expected = Object.fromEntries(
      spec.knobs
        .filter((knob) => knob.initialValue !== undefined)
        .map((knob) => [
          knob.name,
          knob.valueType === 'number' ? Number(knob.initialValue) : knob.initialValue,
        ]),
    )

    expect(content._type).toBe(type)
    expect(content).toMatchObject(expected)
  })
})

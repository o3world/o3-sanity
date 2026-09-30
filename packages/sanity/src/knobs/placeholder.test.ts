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

it('every section block declares a placeholder', () => {
  const missing = SPECS.filter(([, spec]) => spec.placeholder === undefined).map(([type]) => type)

  expect(missing, 'these declare no placeholder — the insert menu cannot offer them').toEqual([])
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
  it('restates no knob default', () => {
    const restated = SPECS.flatMap(([type, spec]) =>
      spec.knobs
        .filter((knob) => knob.initialValue !== undefined)
        .filter((knob) => {
          const declared = (spec.placeholder as Record<string, unknown>)[knob.name]
          return declared !== undefined && String(declared) === knob.initialValue
        })
        .map((knob) => `${type}.${knob.name}`),
    )

    expect(
      restated,
      'these placeholders repeat a knob initialValue — the knob already answers for it',
    ).toEqual([])
  })
})

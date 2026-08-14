import { describe, expect, it } from 'vitest'

import { schemaTypes } from '../index'
import { BASE_BLOCKS, BLOCK_ARRAYS, SECTION_BLOCKS } from './registry'

/**
 * EVERY BLOCK-BEARING ARRAY IS DECLARED (#112) — the guard that lets the insert
 * menu say it offers what the array accepts and mean it.
 *
 * `BLOCK_ARRAYS` is the source: `page.sections`, `caseStudy.story` and
 * `layoutSection.items` all build their `of:` from it, so the members cannot
 * drift — that direction is a derivation, not an agreement. What CAN drift is
 * the other one: someone adds an array of blocks by hand, with
 * `defineArrayMember({type: 'heroSection'})` written out, and the schema is
 * fine, the form is fine, and the canvas silently offers nothing on a band
 * whose neighbours all offer sixteen.
 *
 * That is the failure the prior art's array-name constants had by construction,
 * and the reason this test walks the built schema rather than the declaration:
 * the declaration cannot see an array it was never told about.
 *
 * The second assertion is the cheap half — that each declared entry still names
 * a real array — and it fails the day a field is renamed and the key is not.
 */

/** A schema field as this walk reads it. Arrays only; everything else is skipped. */
type ReadableField = {
  name: string
  type: string
  of?: { type?: string; name?: string; fields?: ReadableField[] }[]
  fields?: ReadableField[]
}

type ReadableType = { name: string; fields?: ReadableField[] }

const REGISTERED = new Set<string>([...SECTION_BLOCKS, ...BASE_BLOCKS])

/**
 * WHAT THE FIRST ASSERTION CAN HONESTLY CLAIM, and why it is narrower than
 * "holds a registered block".
 *
 * `cta`, `figure` and `embed` are base blocks AND shared objects (CONTEXT.md →
 * Type names), and a schema cannot tell the two uses apart:
 * `siteSettings.navItems` and `siteSettings.legalLinks` are arrays of `cta`,
 * and they are nav links rather than a canvas an editor inserts blocks onto.
 * Reading them as block arrays would demand a `BLOCK_ARRAYS` entry that would
 * put an insert menu on the site's navigation.
 *
 * A SECTION block has no such second life — the `Section` suffix is the tier
 * marker and every one of them is a full-width band — so an array declaring one
 * is a composition surface with no ambiguity in it. That is the claim this
 * makes. The base tier is covered by the two assertions after it instead, which
 * check the declared entries rather than hunting for undeclared ones; the day a
 * second base-block array exists it will want a decision anyway, because it is
 * the shared-object question ADR 0021 left open.
 */
const UNAMBIGUOUS = new Set<string>(SECTION_BLOCKS)

/**
 * Every `<host>.<field>` in the schema whose array declares at least one
 * registered block, with the block types it declares.
 *
 * The host is the type the array hangs off — a document for `page.sections`, a
 * block for `layoutSection.items` — which is the same address the overlay
 * builds from the hovered path, so a key here and a key there are the same
 * string by construction rather than by convention.
 *
 * Inline object members are walked, because an array of objects can itself hold
 * an array of blocks. Nothing does today; discovering one is the point.
 */
function blockArraysInSchema(): Map<string, string[]> {
  const found = new Map<string, string[]>()

  const walkFields = (host: string, fields: ReadableField[] | undefined): void => {
    for (const field of fields ?? []) {
      if (field.type === 'array') {
        const members = (field.of ?? [])
          .map((member) => member.type)
          .filter((type): type is string => typeof type === 'string' && REGISTERED.has(type))
        if (members.length > 0) found.set(`${host}.${field.name}`, members)
        // An inline member's own fields are a nested host, addressed by the
        // member's name — the same key shape `defineItemKnobs` specs use.
        for (const member of field.of ?? []) {
          if (member.fields) walkFields(`${host}.${field.name}[${member.name}]`, member.fields)
        }
        continue
      }
      if (field.fields) walkFields(`${host}.${field.name}`, field.fields)
    }
  }

  for (const type of schemaTypes as unknown as ReadableType[]) walkFields(type.name, type.fields)
  return found
}

describe('BLOCK_ARRAYS', () => {
  it('names every array in the schema that holds section blocks', () => {
    const undeclared = [...blockArraysInSchema()]
      .filter(([, members]) => members.some((type) => UNAMBIGUOUS.has(type)))
      .map(([key]) => key)
      .filter((key) => !Object.prototype.hasOwnProperty.call(BLOCK_ARRAYS, key))

    expect(
      undeclared,
      'these arrays accept section blocks and are not in BLOCK_ARRAYS, so the canvas offers nothing in them',
    ).toEqual([])
  })

  it('names no array the schema does not have', () => {
    const inSchema = blockArraysInSchema()
    const missing = Object.keys(BLOCK_ARRAYS).filter((key) => !inSchema.has(key))

    expect(missing, 'these BLOCK_ARRAYS keys name no array in the schema').toEqual([])
  })

  // The derivation, observed rather than assumed. `of:` is built from this map,
  // so agreement is the default — and stating it is what makes a hand-written
  // `of:` on one of these three fields fail here instead of in the menu.
  it('matches what each of those arrays actually declares', () => {
    const inSchema = blockArraysInSchema()

    for (const [key, members] of Object.entries(BLOCK_ARRAYS)) {
      expect(inSchema.get(key), `${key} does not declare the members BLOCK_ARRAYS names`).toEqual([
        ...members,
      ])
    }
  })
})

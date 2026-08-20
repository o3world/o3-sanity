import { describe, expect, it } from 'vitest'

import { BRANDS } from '../brand'
import { schemaTypes, schemaTypesFor } from './index'
import { SECTION_BLOCKS, sectionBlocksFor } from './blocks/registry'

/**
 * WHAT A BRAND'S STUDIO OFFERS (#251) — the seam between the roster split and
 * the form an editor works in.
 *
 * #248 split the section tier into a core list plus per-brand extensions and
 * compile-checked each app's renderers against it, but every Studio still
 * loaded the whole model: an O3 editor was offered `faqSection` in the insert
 * menu and `apps/web` has no renderer for it, by design. So the claim under
 * test is the one that reaches editors — the schema a brand *builds* holds that
 * brand's roster and no other brand's blocks.
 *
 * It is read off the constructed schema rather than off the declaration,
 * because the declaration cannot see a hand-written `of:`. `schemaTypesFor` is
 * the only mechanism either brand loads through, so a document that stopped
 * deriving its members would fail here.
 *
 * The last case is the other half of ADR 0028: the model is one model and
 * typegen extracts all of it, so `schemaTypes` keeps every brand's blocks.
 */

/** A schema type as this walk reads it. Array fields only; everything else is skipped. */
type ReadableField = { name: string; of?: { type?: string }[] }
type ReadableType = { name: string; fields?: ReadableField[] }

/** One array field's declared member types, in the order the schema declares them. */
function arrayMembers(
  types: readonly unknown[],
  typeName: string,
  fieldName: string,
): (string | undefined)[] {
  const type = (types as readonly ReadableType[]).find((candidate) => candidate.name === typeName)
  const field = type?.fields?.find((candidate) => candidate.name === fieldName)
  return (field?.of ?? []).map((member) => member.type)
}

/** Every section block whose schema this roster registers, in registry order. */
function registeredSections(types: readonly unknown[]): string[] {
  const names = new Set((types as readonly ReadableType[]).map((type) => type.name))
  return SECTION_BLOCKS.filter((name) => names.has(name))
}

describe('the schema a brand loads', () => {
  it.each(BRANDS)('offers %s its own section roster in page.sections', (brand) => {
    expect(arrayMembers(schemaTypesFor(brand), 'page', 'sections')).toEqual([
      ...sectionBlocksFor(brand),
    ])
  })

  it.each(BRANDS)('registers %s the schemas that roster names, and no others', (brand) => {
    expect(registeredSections(schemaTypesFor(brand))).toEqual([...sectionBlocksFor(brand)])
  })

  it.each(BRANDS)('offers %s the same roster in caseStudy.story', (brand) => {
    // `chapter` rides in the same array (ADR 0018) and is a shared object
    // rather than a block, so it is the one member the roster does not name.
    expect(arrayMembers(schemaTypesFor(brand), 'caseStudy', 'story')).toEqual([
      'chapter',
      ...sectionBlocksFor(brand),
    ])
  })

  it('keeps the FAQ band on o3xo and off o3', () => {
    expect(arrayMembers(schemaTypesFor('o3'), 'page', 'sections')).not.toContain('faqSection')
    expect(arrayMembers(schemaTypesFor('o3xo'), 'page', 'sections')).toContain('faqSection')
  })

  it('extracts the whole model, whichever brand a checkout is pointed at', () => {
    expect(arrayMembers(schemaTypes, 'page', 'sections')).toEqual([...SECTION_BLOCKS])
    expect(registeredSections(schemaTypes)).toEqual([...SECTION_BLOCKS])
  })
})

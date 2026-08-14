import { describe, expect, it } from 'vitest'

import { schemaTypes } from '../index'

/**
 * THE ONE SHAPE THE PRESENTATION OVERLAY CANNOT RESOLVE (#104, ADR 0022) — a
 * polymorphic array reached through another array's keyed item.
 *
 * `@sanity/visual-editing` serialises an array with **two or more** member
 * types as a `union`, and the union branch is the only one that consults the
 * resolved-types map Studio answers over the comlink. That map is broken twice
 * over at `sanity@6.8.0` / `@sanity/visual-editing@5.7.3` — Studio drops every
 * nested answer, and the overlay looks the answer up under a key with a stray
 * dot — so a union below the first keyed segment resolves to nothing, the
 * resolver context comes back undefined, and our component resolver is never
 * called. **Silently**: no error, no console warning, no degraded mode.
 *
 * An array with exactly one member type serialises as an `arrayItem` and never
 * touches that map, which is why `railPanelsSection.panels`,
 * `screenGridSection.screens` and `statGroup.stats` all resolve at any depth.
 *
 * So the blast radius is a schema property, and this is the guard that keeps it
 * one entry long. `layoutSection.items` is the known exception; ADR 0022 argues
 * why it is cheaper to leave the toolbar silent there than to de-polymorphise
 * the array or carry two pnpm patches. A **second** entry is a different
 * decision — the deferral's whole case is that one block is one block — and it
 * should fail here, on the commit that adds it, rather than as "the toolbar
 * doesn't work in this one place" a month later.
 */

type ReadableMember = { type?: string; name?: string; fields?: ReadableField[] }
type ReadableField = { name: string; type: string; of?: ReadableMember[]; fields?: ReadableField[] }
type ReadableType = { name: string; type?: string; of?: ReadableMember[]; fields?: ReadableField[] }

const BY_NAME = new Map<string, ReadableType>(
  (schemaTypes as unknown as ReadableType[]).map((type) => [type.name, type]),
)

/**
 * Portable text is polymorphic and nested — `chapter.body` sits inside
 * `caseStudy.story`, `richText.body` sits inside `layoutSection.items` — and it
 * is deliberately not counted. We do not attach knobs to prose: a run of copy
 * is reached through stega rather than through an attributed element, so the
 * overlay never asks the schema to resolve a path inside it. The `block` member
 * is the tell, and it is Sanity's own reserved type name rather than one of
 * ours.
 */
function isPortableText(members: readonly ReadableMember[]): boolean {
  return members.some((member) => member.type === 'block')
}

/** Every polymorphic array in the schema that is reached through an array item. */
function nestedUnionArrays(): string[] {
  const found = new Set<string>()

  const walkFields = (host: string, fields: ReadableField[] | undefined, nested: boolean): void => {
    for (const field of fields ?? []) {
      // A field's shape is either written out (`type: 'array'`) or named
      // (`type: 'bodyText'`). Both have to be followed, because the nesting the
      // overlay trips over is a property of the path, not of the spelling.
      const named = BY_NAME.get(field.type)
      const members =
        field.type === 'array' ? field.of : named?.type === 'array' ? named.of : undefined

      if (members) {
        const types = new Set(members.map((member) => member.type).filter(Boolean))
        if (nested && types.size > 1 && !isPortableText(members)) found.add(`${host}.${field.name}`)
        for (const member of members) walkMember(member, true)
        continue
      }

      if (field.fields) walkFields(host, field.fields, nested)
      else if (named?.fields) walkFields(named.name, named.fields, nested)
    }
  }

  // Named members are followed through the registry; inline ones carry their
  // own fields and are addressed by the member name, matching the key shape
  // `blockArrays.test.ts` builds.
  const walkMember = (member: ReadableMember, nested: boolean): void => {
    if (member.fields) return walkFields(member.name ?? 'inline', member.fields, nested)
    const named = member.type ? BY_NAME.get(member.type) : undefined
    if (named?.fields) walkFields(named.name, named.fields, nested)
  }

  for (const type of BY_NAME.values()) {
    if (type.type === 'document') walkFields(type.name, type.fields, false)
  }
  return [...found].sort()
}

describe('polymorphic arrays below the block root', () => {
  it('is exactly the one the canvas toolbar is known to be silent inside', () => {
    expect(
      nestedUnionArrays(),
      'a polymorphic array nested inside another array cannot be resolved by the Presentation overlay at sanity@6.8.0 — see ADR 0022 before adding a second one',
    ).toEqual(['layoutSection.items'])
  })
})

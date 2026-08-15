import { describe, expect, it } from 'vitest'

import { diffSchemas } from './schema-diff'

describe('diffSchemas', () => {
  it('reports a field the repo declares and the deployed schema is missing', () => {
    const repo = [
      { name: 'railPanelsSection', type: 'object', fields: [{ name: 'mark', type: 'mark' }] },
    ]
    const deployed = [{ name: 'railPanelsSection', type: 'object', fields: [] }]

    expect(diffSchemas(repo, deployed)).toEqual([
      { kind: 'field-missing', path: 'railPanelsSection.mark' },
    ])
  })

  /* The drift #139 was filed for sat two levels down — `mark` on the inline
   * `panel` object inside the `panels` array, not on the section itself. A
   * walk that stops at a type's own fields reports the schema as clean. */
  it('walks into an array member, where the drift it was filed for actually sat', () => {
    const panels = (fields: { name: string; type: string }[]) => ({
      name: 'panels',
      type: 'array',
      of: [{ name: 'panel', type: 'object', fields }],
    })
    const repo = [
      {
        name: 'railPanelsSection',
        type: 'object',
        fields: [panels([{ name: 'mark', type: 'mark' }])],
      },
    ]
    const deployed = [{ name: 'railPanelsSection', type: 'object', fields: [panels([])] }]

    expect(diffSchemas(repo, deployed)).toEqual([
      { kind: 'field-missing', path: 'railPanelsSection.panels.panel.mark' },
    ])
  })

  /* A union's members carry a `type` and no `name` — `page.sections` lists
   * twenty section types that way. Keying them by name puts every member under
   * `undefined`, so the walk compares whichever two happened to sort first and
   * reports the rest as drift against the wrong sibling. Order is the Studio's
   * and is not drift. */
  it('identifies an array member by type when it has no name, as a union does', () => {
    const member = (type: string, description: string) => ({ type, description })
    const sections = (of: { type: string; description: string }[]) => ({
      name: 'sections',
      type: 'array',
      of,
    })
    const repo = [
      {
        name: 'page',
        type: 'document',
        fields: [
          sections([member('heroSection', 'The opener.'), member('ctaSection', 'The ask.')]),
        ],
      },
    ]
    const deployed = [
      {
        name: 'page',
        type: 'document',
        fields: [
          sections([member('ctaSection', 'The ask.'), member('heroSection', 'The opener.')]),
        ],
      },
    ]

    expect(diffSchemas(repo, deployed)).toEqual([])
  })

  /* Both strings are the ones #139 recorded off the live schema. A field the
   * deploy still has, describing itself the way the design used to work, is
   * the failure the knowledge contract cannot survive — the field is present,
   * so nothing else notices. */
  it('reports a description the deploy has not caught up with', () => {
    const media = (description: string) => ({ name: 'media', type: 'figure', description })
    const repo = [
      {
        name: 'railPanelsSection',
        type: 'object',
        fields: [media('Rail layout only. A card draws its mark instead.')],
      },
    ]
    const deployed = [
      {
        name: 'railPanelsSection',
        type: 'object',
        fields: [media('Rail layout only. A card draws a halftone disc instead.')],
      },
    ]

    expect(diffSchemas(repo, deployed)).toEqual([
      {
        kind: 'description',
        path: 'railPanelsSection.media',
        repo: 'Rail layout only. A card draws its mark instead.',
        deployed: 'Rail layout only. A card draws a halftone disc instead.',
      },
    ])
  })
})

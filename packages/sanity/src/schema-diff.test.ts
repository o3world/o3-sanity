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

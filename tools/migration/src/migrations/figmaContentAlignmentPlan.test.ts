import { describe, expect, it } from 'vitest'
import manifest from './figmaContentAlignment.json'
import {
  contentValue,
  planFigmaContentAlignment,
  type ContentRow,
} from './figmaContentAlignmentPlan'

const spec = manifest.documents.find((document) => document.id === 'siteSettings')!
const settings = (after: boolean): ContentRow => ({
  _id: 'siteSettings',
  _rev: 'reviewed',
  _type: 'siteSettings',
  migration: { locked: true },
  navItems: spec.patches.find((field) => field.path === 'navItems')![after ? 'after' : 'before'],
  footerGroups: [{ _key: 'group-1', label: after ? 'Beyond O3' : 'Our world' }],
  unrelated: 'Preserve this',
})

describe('reviewed Figma content migration', () => {
  it('requires scoped lock authority, preserves the input and reruns as a no-op', () => {
    const row = settings(false)
    const before = structuredClone(row)
    expect(() => planFigmaContentAlignment(row)).toThrow('Content locked')
    const plan = planFigmaContentAlignment(row, true)!
    expect(plan.revision).toBe('reviewed')
    expect(Object.keys(plan.set).sort()).toEqual([
      'footerGroups[_key=="group-1"].label',
      'navItems',
    ])
    expect(row).toEqual(before)
    expect(planFigmaContentAlignment(settings(true))).toBeNull()
  })
  it('refuses changed draft copy and ambiguous keys instead of overwriting them', () => {
    const draft = { ...settings(false), _id: 'drafts.siteSettings', navItems: [] }
    expect(() => planFigmaContentAlignment(draft, true)).toThrow('Editorial change since review')
    expect(() =>
      contentValue({ sections: [{ _key: 'x' }, { _key: 'x' }] }, 'sections[_key=="x"].heading'),
    ).toThrow('Expected one keyed item')
    expect(() => planFigmaContentAlignment({ ...settings(false), _id: 'unrelated' }, true)).toThrow(
      'Unexpected content document',
    )
  })
  it('leaves the homepage hero and pending client claims outside the patch scope', () => {
    const home = manifest.documents.find((document) => document.id === 'page-seed-index')!
    expect(home.patches.some((field) => field.path.startsWith('sections[_key=="hero"]'))).toBe(
      false,
    )
    const partner = manifest.documents.find(
      (document) => document.id === 'page-seed-partners-sanity',
    )!
    expect(
      partner.patches.some((field) => field.path.startsWith('sections[_key=="hero"].details')),
    ).toBe(false)
    for (const document of manifest.documents)
      for (const field of document.patches)
        expect(JSON.stringify(field.after)).not.toMatch(
          /Lorem ipsum|Note to self:|I’ll write a headline/,
        )
  })
})

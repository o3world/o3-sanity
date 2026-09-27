import finishManifest from './figmaAlignmentFinish.json'
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

describe('finishing alignment', () => {
  it('removes only the reviewed extra About content and reruns without changes', () => {
    const spec = finishManifest.documents.find((document) => document.id === 'page-seed-about')!
    const row: ContentRow = {
      _id: spec.id,
      _type: spec.type,
      _rev: 'reviewed',
      slug: { current: 'about' },
      sections: [spec.patches[0]!.before, { _key: 'beyond', items: [spec.patches[1]!.before] }],
    }
    expect(planFigmaContentAlignment(row, true, finishManifest)?.unset).toEqual(
      spec.patches.map((patch) => patch.path),
    )
    expect(
      planFigmaContentAlignment(
        { ...row, sections: [{ _key: 'beyond', items: [] }] },
        true,
        finishManifest,
      ),
    ).toBeNull()
    expect(() => planFigmaContentAlignment({ ...row, sections: [] }, true, finishManifest)).toThrow(
      'Expected one keyed item',
    )
  })
})

describe('review findings migration', () => {
  it('preserves every case narrative, rejects editorial drift and reruns as a no-op', async () => {
    const { default: review } = await import('./figmaReviewFixes.json')
    for (const spec of review.documents.filter((document) => document.type === 'caseStudy')) {
      const field = spec.patches.find((patch) => patch.path === 'story')!
      const before = field.before as { _type: string; _key: string }[]
      const after = field.after as { _type: string; _key: string }[]
      expect(after.filter((item) => item._type === 'chapter')).toEqual(
        before.filter((item) => item._type === 'chapter'),
      )
      expect(new Set(after.map((item) => item._key)).size).toBe(after.length)
      const row = {
        _id: spec.id,
        _rev: 'reviewed',
        _type: spec.type,
        slug: { current: spec.slug! },
        story: before,
        migration: { locked: true },
      }
      expect(() => planFigmaContentAlignment(row, false, review)).toThrow('Content locked')
      expect(planFigmaContentAlignment(row, true, review)?.set.story).toEqual(after)
      expect(planFigmaContentAlignment({ ...row, story: after }, true, review)).toBeNull()
      expect(() => planFigmaContentAlignment({ ...row, story: [] }, true, review)).toThrow(
        'Editorial change',
      )
    }
    const home = review.documents.find((document) => document.id === 'page-seed-index')!
    expect(home.patches.some((patch) => patch.path.includes('"hero"'))).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'

import { planInsightCardMedia, type InsightFile, type InsightRow } from './insightCardMediaPlan'

/**
 * The plan the `insight-card-media` migration carries out, decided with no
 * project and no token (#418). The script's own half is a client call and an
 * argv read; everything that could get 272 committed files wrong is here.
 */
const picture = {
  _type: 'figure',
  image: { _type: 'image', asset: { _type: 'reference', _ref: 'image-abc-1200x800-jpg' } },
  alt: 'A photograph',
  caption: 'Shot on location.',
}

function row(overrides: Partial<InsightRow> = {}): InsightRow {
  return { _id: 'insight-wp-1', title: 'One', featuredImage: picture, ...overrides }
}

function file(doc: Record<string, unknown>, path = 'one.json'): InsightFile {
  return { path, doc }
}

describe('the insight card-picture plan', () => {
  it('patches the document and rewrites its file when there is a picture', () => {
    const plan = planInsightCardMedia(
      [row()],
      [file({ _id: 'insight-wp-1', _type: 'insight', featuredImage: picture })],
    )

    expect(plan.patches).toEqual([{ _id: 'insight-wp-1', cardMedia: picture }])
    expect(plan.rewrites).toEqual([
      { path: 'one.json', doc: { _id: 'insight-wp-1', _type: 'insight', cardMedia: picture } },
    ])
  })

  it('carries the asset reference, the alt text and the caption across whole', () => {
    const [patch] = planInsightCardMedia([row()], []).patches
    expect(patch?.cardMedia).toBe(picture)
  })

  /** What makes a second run — or a repeat of a half-written one — safe. */
  it('does nothing to a document that already holds a card picture', () => {
    const plan = planInsightCardMedia(
      [row({ cardMedia: picture })],
      [file({ _id: 'insight-wp-1', cardMedia: picture })],
    )
    expect(plan.patches).toEqual([])
    expect(plan.rewrites).toEqual([])
    expect(plan.skips).toHaveLength(2)
  })

  it('skips the one insight with no picture at all rather than erroring', () => {
    const plan = planInsightCardMedia(
      [row({ featuredImage: null })],
      [file({ _id: 'insight-wp-1' })],
    )
    expect(plan.patches).toEqual([])
    expect(plan.rewrites).toEqual([])
    expect(plan.skips.map((skip) => skip.why)).toEqual(['no picture at all', 'no picture at all'])
  })

  /**
   * The lock guards a replacement from outside the document; this copy's only
   * input is the document's own field, so a locked article is patched like
   * any other. Honouring it would leave the most tended articles as the only
   * ones without a card picture.
   */
  it('patches a locked document like any other', () => {
    const plan = planInsightCardMedia([{ ...row(), migration: { locked: true } } as InsightRow], [])
    expect(plan.patches).toEqual([{ _id: 'insight-wp-1', cardMedia: picture }])
  })

  it('patches a draft alongside its published document', () => {
    const plan = planInsightCardMedia([row(), row({ _id: 'drafts.insight-wp-1' })], [])
    expect(plan.patches.map((patch) => patch._id)).toEqual(['insight-wp-1', 'drafts.insight-wp-1'])
  })

  /** The record has to match the dataset the removal (#421) will leave behind. */
  it('drops the old field from the file, in the place it held', () => {
    const [rewrite] = planInsightCardMedia(
      [],
      [file({ _id: 'insight-wp-1', featuredImage: picture, body: [] })],
    ).rewrites
    expect(Object.keys(rewrite!.doc)).toEqual(['_id', 'cardMedia', 'body'])
    expect(rewrite!.doc).not.toHaveProperty('featuredImage')
  })
})

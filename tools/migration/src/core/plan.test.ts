import { describe, expect, it } from 'vitest'

import { plan } from './plan'

/** A committed document, with only the fields a plan has an opinion about. */
function committed(id: string, type = 'insight') {
  return { _id: id, _type: type, migration: { locked: false, sourceId: `wp:post:${id}` } }
}

/** A live lock row, as the raw-perspective projection returns it. */
function live(id: string, locked: boolean | null = false) {
  return { _id: id, locked }
}

const NO_PROVENANCE = { runs: {}, extractSource: () => undefined }

/**
 * Every committed document is written published, in all three trees (ADR
 * 0016), unless an editor holds the lock on it (ADR 0003).
 */
describe('writes', () => {
  it('writes every committed document, in the order the corpus gives them', () => {
    const result = plan(
      [committed('insight-wp-1'), committed('page-seed-index', 'page')],
      [],
      NO_PROVENANCE,
    )

    expect(result.writes.map((doc) => doc._id)).toEqual(['insight-wp-1', 'page-seed-index'])
  })

  it('writes a document the dataset does not hold yet', () => {
    const result = plan([committed('insight-wp-1')], [], NO_PROVENANCE)

    expect(result.writes).toEqual([committed('insight-wp-1')])
    expect(result.lockedSkips).toEqual([])
  })

  it('skips a document whose published copy an editor locked', () => {
    const result = plan(
      [committed('insight-wp-1'), committed('insight-wp-2')],
      [live('insight-wp-1', true)],
      NO_PROVENANCE,
    )

    expect(result.writes.map((doc) => doc._id)).toEqual(['insight-wp-2'])
    expect(result.lockedSkips).toEqual(['insight-wp-1'])
  })

  it('skips a document whose draft an editor locked', () => {
    const result = plan(
      [committed('insight-wp-1')],
      [live('insight-wp-1'), live('drafts.insight-wp-1', true)],
      NO_PROVENANCE,
    )

    expect(result.writes).toEqual([])
    expect(result.lockedSkips).toEqual(['insight-wp-1'])
  })

  it('writes a document the pipeline has never stamped, whose lock flag is absent', () => {
    const result = plan([committed('insight-wp-1')], [live('insight-wp-1', null)], NO_PROVENANCE)

    expect(result.writes.map((doc) => doc._id)).toEqual(['insight-wp-1'])
  })
})

/**
 * Retirement is the delete half of CONTEXT.md's Rebuild promise: the run that
 * stops writing a document removes it, in both the forms the dataset holds it.
 */
describe('retirement', () => {
  it('retires a document absent from the corpus, in both its forms', () => {
    const result = plan(
      [committed('insight-wp-1')],
      [live('insight-wp-1'), live('insight-wp-9'), live('drafts.insight-wp-9')],
      NO_PROVENANCE,
    )

    expect(result.retirements).toEqual([{ id: 'insight-wp-9', draft: true, published: true }])
  })

  it('retires a document the dataset holds only as a published copy', () => {
    const result = plan([committed('insight-wp-1')], [live('insight-wp-9')], NO_PROVENANCE)

    expect(result.retirements).toEqual([{ id: 'insight-wp-9', draft: false, published: true }])
  })

  it('skips a document whose published copy an editor locked', () => {
    const result = plan(
      [committed('insight-wp-1')],
      [live('insight-wp-9', true), live('drafts.insight-wp-9')],
      NO_PROVENANCE,
    )

    expect(result.retirements).toEqual([])
    expect(result.lockedSkips).toEqual(['insight-wp-9'])
  })

  it('skips a document whose draft an editor locked, published copy and all', () => {
    const result = plan(
      [committed('insight-wp-1')],
      [live('insight-wp-9'), live('drafts.insight-wp-9', true)],
      NO_PROVENANCE,
    )

    expect(result.retirements).toEqual([])
    expect(result.lockedSkips).toEqual(['insight-wp-9'])
  })

  it('never retires a Studio-created document, whose id is outside the contract', () => {
    const result = plan(
      [committed('insight-wp-1')],
      [live('a1b2c3d4-0000-4000-8000-000000000000'), live('siteSettings')],
      NO_PROVENANCE,
    )

    expect(result.retirements).toEqual([])
    expect(result.lockedSkips).toEqual([])
  })
})

/**
 * A draft shadows its published document everywhere draft mode is on, so a
 * stale one is cleared by the same run that rewrites the published copy — and
 * only by that run.
 */
describe('stale-draft clears', () => {
  it('clears the draft shadowing a document the run writes', () => {
    const result = plan(
      [committed('insight-wp-1')],
      [live('insight-wp-1'), live('drafts.insight-wp-1')],
      NO_PROVENANCE,
    )

    expect(result.staleDraftClears).toEqual(['insight-wp-1'])
  })

  it('leaves the draft of a locked document alone', () => {
    const result = plan(
      [committed('insight-wp-1')],
      [live('insight-wp-1', true), live('drafts.insight-wp-1')],
      NO_PROVENANCE,
    )

    expect(result.staleDraftClears).toEqual([])
    expect(result.lockedSkips).toEqual(['insight-wp-1'])
  })

  it('does not clear the draft of a document the run is not writing', () => {
    const result = plan([committed('insight-wp-1')], [live('drafts.insight-wp-9')], NO_PROVENANCE)

    expect(result.staleDraftClears).toEqual([])
    expect(result.retirements).toEqual([{ id: 'insight-wp-9', draft: true, published: false }])
  })
})

describe('provenance stamping', () => {
  it('stamps extractedAt from the manifest run that produced the document', () => {
    const result = plan([committed('insight-wp-1')], [], {
      runs: { perspective: '2026-08-01T00:00:00Z' },
      extractSource: () => undefined,
    })

    expect(result.writes[0]?.migration).toMatchObject({ extractedAt: '2026-08-01T00:00:00Z' })
  })

  it('leaves a document alone when no extract stands behind its source', () => {
    const seeded = {
      _id: 'page-seed-index',
      _type: 'page',
      migration: { locked: false, sourceId: 'seed:index' },
    }
    const result = plan([seeded], [], {
      runs: { perspective: '2026-08-01T00:00:00Z' },
      extractSource: () => undefined,
    })

    expect(result.writes[0]).toEqual(seeded)
  })

  it("folds a translated document's _meta into migration.source", () => {
    const translated = {
      ...committed('caseStudy-wp-1', 'caseStudy'),
      _meta: {
        sourceFile: 'caseStudy/1.json',
        model: 'claude-opus-5',
        translatedAt: '2026-08-02T00:00:00Z',
        flags: [{ field: 'title', note: 'shortened' }],
      },
    }
    const result = plan([translated], [], {
      runs: {},
      extractSource: (sourceFile) =>
        sourceFile === 'caseStudy/1.json' ? { title: 'The extracted title' } : undefined,
    })

    const write = result.writes[0]!
    expect(write._meta).toBeUndefined()
    const source = JSON.parse((write.migration as { source: string }).source)
    expect(source.translation).toEqual({
      model: 'claude-opus-5',
      translatedAt: '2026-08-02T00:00:00Z',
      flags: [{ field: 'title', note: 'shortened' }],
    })
    expect(source.source).toEqual({ title: 'The extracted title' })
  })

  it('strips _meta but writes no source when the extract file is gone', () => {
    const translated = {
      ...committed('caseStudy-wp-1', 'caseStudy'),
      _meta: { sourceFile: 'caseStudy/1.json' },
    }
    const result = plan([translated], [], NO_PROVENANCE)

    const write = result.writes[0]!
    expect(write._meta).toBeUndefined()
    expect((write.migration as { source?: string }).source).toBeUndefined()
  })
})

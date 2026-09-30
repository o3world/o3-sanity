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
 * Every committed document is in the plan unless an editor holds the lock on
 * it (ADR 0003).
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

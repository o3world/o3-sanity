import { describe, expect, it } from 'vitest'

import { planCorpus } from './corpus/plan'
import { guidanceCorpus } from './sources'

/**
 * The committed corpus, not a fixture: what `guidance:sync` would actually push
 * from this checkout. The invariants are the ones a silent failure would break —
 * a renamed markdown file, a document that arrives empty, skill frontmatter
 * reaching the dataset as if it were guidance.
 */
describe('the guidance corpus', () => {
  it('registers the six documents an authoring session fetches', () => {
    expect(guidanceCorpus().sources.map((source) => source.key)).toEqual([
      'o3-voice',
      'o3-brand',
      'o3-slop',
      'o3-composition',
      'o3-argument',
      'o3-visual',
    ])
  })

  it('reads a body for every source, with no frontmatter in it', () => {
    for (const source of guidanceCorpus().sources) {
      expect(source.body.length, source.sourcePath).toBeGreaterThan(200)
      expect(source.body.startsWith('---'), source.sourcePath).toBe(false)
    }
  })

  it('plans deterministic published ids outside the load pipeline’s contract', () => {
    const plan = planCorpus(guidanceCorpus(), [])

    expect(plan.entries.map((entry) => entry.document._id)).toEqual([
      'guidance-o3-voice',
      'guidance-o3-brand',
      'guidance-o3-slop',
      'guidance-o3-composition',
      'guidance-o3-argument',
      'guidance-o3-visual',
    ])
  })
})

import { describe, expect, it } from 'vitest'

import { briefCorpus } from './briefs'
import { planCorpus } from './corpus/plan'

/**
 * The committed corpus, not a fixture: what `brief:sync` would push from this
 * checkout. Registration is frontmatter alone, so the failures worth catching
 * are a file that registers nothing and a document that arrives empty — both of
 * which sync happily and leave an agent reading a blank brief.
 */
describe('the brief corpus', () => {
  it('registers the brief the insight corpus points at', () => {
    expect(briefCorpus().sources.map((source) => source.key)).toContain('figma-sync-pipeline')
  })

  it('reads a background for every brief, with no frontmatter in it', () => {
    for (const source of briefCorpus().sources) {
      expect(source.body.length, source.sourcePath).toBeGreaterThan(200)
      expect(source.body.startsWith('---'), source.sourcePath).toBe(false)
      expect(source.title.length, source.sourcePath).toBeGreaterThan(0)
    }
  })

  // `brief-<key>` is the id seed JSON writes by hand, so the corpus has to plan
  // exactly that shape or every committed reference points at nothing.
  it('plans a brief-<key> document with the markdown in `background`', () => {
    const plan = planCorpus(briefCorpus(), [])
    const entry = plan.entries.find(({ document }) => document.key === 'figma-sync-pipeline')

    expect(entry?.document._id).toBe('brief-figma-sync-pipeline')
    expect(entry?.document.background).toContain('pnpm figma:sync')
    expect(entry?.document.sourcePath).toBe('tools/guidance/briefs/figma-sync-pipeline.md')
    expect(entry?.document.body).toBeUndefined()
  })
})

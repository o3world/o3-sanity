import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { briefCorpus } from './briefs'
import { planCorpus } from './corpus/plan'
import { REPO_ROOT } from './repo'

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

/** The committed migration corpus, which is where `briefs` references are written. */
const PIPELINE_TREES = ['converted', 'seed', 'translated'].map((tree) =>
  join(REPO_ROOT, 'tools', 'migration', 'data', tree),
)

/** Every `brief-<key>` a committed document points at, with the file that points. */
function committedBriefRefs(): { file: string; ref: string }[] {
  const refs = (node: unknown, found: string[] = []): string[] => {
    if (Array.isArray(node)) for (const item of node) refs(item, found)
    else if (node && typeof node === 'object') {
      const object = node as Record<string, unknown>
      if (typeof object._ref === 'string' && object._ref.startsWith('brief-'))
        found.push(object._ref)
      for (const value of Object.values(object)) refs(value, found)
    }
    return found
  }

  const out: { file: string; ref: string }[] = []
  for (const tree of PIPELINE_TREES) {
    if (!existsSync(tree)) continue
    for (const type of readdirSync(tree)) {
      const directory = join(tree, type)
      for (const name of readdirSync(directory).filter((file) => file.endsWith('.json'))) {
        const document: unknown = JSON.parse(readFileSync(join(directory, name), 'utf8'))
        for (const ref of refs(document)) out.push({ file: `${type}/${name}`, ref })
      }
    }
  }
  return out
}

/**
 * The other half of the reference (ADR 0027): a committed `brief-<key>` is a
 * promise that a markdown file in the corpus registers that key. Nothing else
 * keeps the two ends together — the reference is weak, so it loads, verifies
 * and renders exactly as well when it points at nothing at all.
 *
 * Asserted here rather than in the migration suite because the reader is here.
 * Over there it needed a second frontmatter parser, and that parser disagreed
 * with this one about quoted values and where a fence ends — so it passed files
 * `brief:sync` refuses and failed files it accepts. The shape of a `briefs`
 * entry — a weak reference, and nothing brief-shaped outside the array — stays
 * in the migration suite, which needs no reader for it.
 */
describe('the briefs committed content points at', () => {
  const committed = committedBriefRefs()

  it('has references to resolve', () => {
    expect(committed.length).toBeGreaterThan(0)
  })

  it('registers a key for every one of them', () => {
    const keys = new Set(briefCorpus().sources.map((source) => source.key))
    const offenders = committed
      .filter(({ ref }) => !keys.has(ref.replace(/^brief-/, '')))
      .map(({ file, ref }) => `${file} points at ${ref}, which no markdown registers`)

    expect(offenders).toEqual([])
  })
})

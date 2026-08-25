import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { briefCorpus } from './briefs'
import { planCorpus } from './corpus/plan'
import { REPO_ROOT } from './repo'

/**
 * Two corpora under test. The committed one carries the invariants that must
 * hold of whatever is on disk — a file that registers nothing and a document
 * that arrives empty both sync happily and leave an agent reading a blank
 * brief. The planning shape is asserted on a fixture instead, because it is a
 * fact about the engine rather than about today's contents: the corpus is
 * legitimately empty whenever no piece is mid-flight.
 */
describe('the brief corpus', () => {
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
    const corpus = {
      ...briefCorpus(),
      sources: [
        {
          key: 'a-piece',
          title: 'A piece',
          body: 'The background the piece was written from.',
          sourcePath: 'tools/guidance/briefs/a-piece.md',
        },
      ],
    }
    const [entry] = planCorpus(corpus, []).entries

    expect(entry?.document._id).toBe('brief-a-piece')
    expect(entry?.document.background).toBe('The background the piece was written from.')
    expect(entry?.document.sourcePath).toBe('tools/guidance/briefs/a-piece.md')
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

  it('registers a key for every one of them', () => {
    const keys = new Set(briefCorpus().sources.map((source) => source.key))
    const offenders = committed
      .filter(({ ref }) => !keys.has(ref.replace(/^brief-/, '')))
      .map(({ file, ref }) => `${file} points at ${ref}, which no markdown registers`)

    expect(offenders).toEqual([])
  })
})

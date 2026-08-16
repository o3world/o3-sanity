import { describe, expect, it } from 'vitest'

import { checkCorpus, syncCorpus } from './commands'

import type { Corpus, CorpusSnapshotDocument } from './plan'

const CORPUS: Corpus = {
  type: 'guidance',
  bodyField: 'body',
  writes: 'replace',
  claimsOrphans: 'every',
  sources: [
    {
      key: 'o3-voice',
      title: 'O3 voice guide',
      body: 'Say the specific thing.',
      sourcePath: 'docs/guidance/voice.md',
    },
    {
      key: 'o3-slop',
      title: 'O3 slop patterns',
      body: 'No em dash pile-ups.',
      sourcePath: 'docs/guidance/slop.md',
    },
  ],
}

const VOICE: CorpusSnapshotDocument = {
  _id: 'guidance-o3-voice',
  key: 'o3-voice',
  title: 'O3 voice guide',
  body: 'Say the specific thing.',
  sourcePath: 'docs/guidance/voice.md',
}

const SLOP: CorpusSnapshotDocument = {
  _id: 'guidance-o3-slop',
  key: 'o3-slop',
  title: 'O3 slop patterns',
  body: 'No em dash pile-ups.',
  sourcePath: 'docs/guidance/slop.md',
}

/** The dataset agreeing with the corpus above, which is what most tests perturb. */
const IN_STEP: CorpusSnapshotDocument[] = [VOICE, SLOP]

/** The drifted fixture: the dataset still holds a sentence the repo no longer says. */
const DRIFTED: CorpusSnapshotDocument[] = [
  { ...VOICE, body: 'Something the repo no longer says.' },
  SLOP,
]

/**
 * The brief corpus: markdown lands in `background`, the dataset owns `record`,
 * and a document with no `sourcePath` was born there rather than left behind
 * (ADR 0027).
 */
const BRIEFS: Corpus = {
  type: 'brief',
  bodyField: 'background',
  writes: 'merge',
  claimsOrphans: 'file-backed',
  sources: [
    {
      key: 'figma-sync',
      title: 'The Figma sync pipeline',
      body: 'What the watcher does and what it refuses to do.',
      sourcePath: 'tools/guidance/briefs/figma-sync.md',
    },
  ],
}

/** A brief the authoring skill wrote mid-session: no `sourcePath`, and nobody's to retire. */
const DATASET_BORN: CorpusSnapshotDocument = {
  _id: 'brief-sanity-partner',
  key: 'sanity-partner',
  title: 'The Sanity partnership page',
  background: 'Gathered in the session that drafted it.',
}

/** Captures what a command told the operator, so a test can read the report it prints. */
function sink() {
  const logged: string[] = []
  const errored: string[] = []
  return {
    out: { log: (line: string) => logged.push(line), error: (line: string) => errored.push(line) },
    logged: () => logged.join('\n'),
    errored: () => errored.join('\n'),
  }
}

describe('syncCorpus', () => {
  it('writes every source as a published document when the dataset is empty', () => {
    const { out } = sink()

    const { writes } = syncCorpus(CORPUS, [], out)

    expect(writes.filter((write) => write.op === 'createOrReplace')).toEqual([
      {
        op: 'createOrReplace',
        document: {
          _id: 'guidance-o3-voice',
          _type: 'guidance',
          key: 'o3-voice',
          title: 'O3 voice guide',
          body: 'Say the specific thing.',
          sourcePath: 'docs/guidance/voice.md',
        },
      },
      {
        op: 'createOrReplace',
        document: {
          _id: 'guidance-o3-slop',
          _type: 'guidance',
          key: 'o3-slop',
          title: 'O3 slop patterns',
          body: 'No em dash pile-ups.',
          sourcePath: 'docs/guidance/slop.md',
        },
      },
    ])
  })

  it('clears the draft shadow of every document it writes', () => {
    const { out } = sink()

    const { writes } = syncCorpus(CORPUS, IN_STEP, out)

    expect(writes.filter((write) => write.op === 'delete')).toEqual([
      { op: 'delete', _id: 'drafts.guidance-o3-voice' },
      { op: 'delete', _id: 'drafts.guidance-o3-slop' },
    ])
  })

  it('retires a published document no source claims, draft and all', () => {
    const { out, logged } = sink()

    const { writes } = syncCorpus(
      CORPUS,
      [...IN_STEP, { _id: 'guidance-o3-retired', key: 'gone' }],
      out,
    )

    expect(writes).toContainEqual({ op: 'delete', _id: 'guidance-o3-retired' })
    expect(writes).toContainEqual({ op: 'delete', _id: 'drafts.guidance-o3-retired' })
    expect(logged()).toContain('guidance-o3-retired')
  })

  it('names each document and the state it is in', () => {
    const { out, logged } = sink()

    syncCorpus(CORPUS, DRIFTED, out)

    expect(logged()).toContain('updated')
    expect(logged()).toContain('unchanged')
  })

  /**
   * A merge corpus writes around the fields the dataset owns. `record` is
   * written by the authoring skill and by nothing in the repo, so a
   * whole-document replace would delete an interview on every sync — the one
   * failure that would make briefing a piece unsafe to repeat.
   */
  it('leaves a dataset-owned field alone when the corpus merges', () => {
    const { out } = sink()

    const { writes } = syncCorpus(
      BRIEFS,
      [
        {
          _id: 'brief-figma-sync',
          key: 'figma-sync',
          title: 'The Figma sync pipeline',
          background: 'Something the repo no longer says.',
          sourcePath: 'tools/guidance/briefs/figma-sync.md',
          record: 'Thesis: noticing no longer belongs to anyone.',
        },
      ],
      out,
    )

    expect(writes.some((write) => write.op === 'createOrReplace')).toBe(false)
    expect(writes).toContainEqual({
      op: 'createIfNotExists',
      document: {
        _id: 'brief-figma-sync',
        _type: 'brief',
        key: 'figma-sync',
        title: 'The Figma sync pipeline',
        background: 'What the watcher does and what it refuses to do.',
        sourcePath: 'tools/guidance/briefs/figma-sync.md',
      },
    })
    expect(writes).toContainEqual({
      op: 'patch',
      _id: 'brief-figma-sync',
      set: {
        key: 'figma-sync',
        title: 'The Figma sync pipeline',
        background: 'What the watcher does and what it refuses to do.',
        sourcePath: 'tools/guidance/briefs/figma-sync.md',
      },
    })
  })

  /**
   * A settled merge entry has nothing to set, and patching it anyway bumps
   * `_rev` and `_updatedAt` on every run — a no-op sync that leaves the whole
   * corpus looking freshly edited. The create stays: it costs nothing against
   * a document that exists and repairs one that does not.
   */
  it('patches nothing when the dataset already agrees with the source', () => {
    const { out } = sink()

    const { writes } = syncCorpus(
      BRIEFS,
      [
        {
          _id: 'brief-figma-sync',
          key: 'figma-sync',
          title: 'The Figma sync pipeline',
          background: 'What the watcher does and what it refuses to do.',
          sourcePath: 'tools/guidance/briefs/figma-sync.md',
          record: 'Thesis: noticing no longer belongs to anyone.',
        },
      ],
      out,
    )

    expect(writes.some((write) => write.op === 'patch')).toBe(false)
    expect(writes).toContainEqual({ op: 'createIfNotExists', document: expect.anything() })
  })

  /**
   * The severe case (ADR 0027): a markdown file lands on the id the authoring
   * skill already wrote in the dataset. Patching would put the repo's
   * background over the session's work and stamp a `sourcePath` on it; the
   * draft delete that follows every entry would take the skill's draft with
   * it. So the entry is dropped whole — no create, no patch, no draft delete —
   * and the operator is told, because a source that never syncs is otherwise
   * indistinguishable from one that did.
   */
  it('writes nothing at all for a source whose id the dataset owns', () => {
    const { out, errored } = sink()

    const { writes, status } = syncCorpus(
      BRIEFS,
      [{ ...DATASET_BORN, _id: 'brief-figma-sync', key: 'figma-sync' }],
      out,
    )

    expect(writes).toEqual([])
    expect(status).toBe(1)
    expect(errored()).toContain('brief-figma-sync')
    expect(errored()).toContain('tools/guidance/briefs/figma-sync.md')
    expect(errored()).toMatch(/export|different key/)
  })

  it('names a contested id the dataset holds only as a draft', () => {
    const { out, errored } = sink()

    const { writes, status } = syncCorpus(
      BRIEFS,
      [{ ...DATASET_BORN, _id: 'brief-figma-sync', key: 'figma-sync', draftOnly: true }],
      out,
    )

    expect(writes).toEqual([])
    expect(status).toBe(1)
    expect(errored()).toContain('draft')
  })

  it('syncs the rest of the corpus around a conflict', () => {
    const { out } = sink()

    const corpus = {
      ...BRIEFS,
      sources: [
        ...BRIEFS.sources,
        {
          key: 'sanity-partner',
          title: 'The Sanity partnership page',
          body: 'What the partnership is.',
          sourcePath: 'tools/guidance/briefs/sanity-partner.md',
        },
      ],
    }

    const { writes, status } = syncCorpus(
      corpus,
      [{ ...DATASET_BORN, _id: 'brief-figma-sync', key: 'figma-sync' }],
      out,
    )

    expect(status).toBe(1)
    expect(writes.map((write) => ('document' in write ? write.document._id : write._id))).toEqual([
      'brief-sanity-partner',
      'brief-sanity-partner',
      'drafts.brief-sanity-partner',
    ])
  })

  it('never retires a document the corpus disowned, and says it left it alone', () => {
    const { out, logged } = sink()

    const { writes } = syncCorpus(BRIEFS, [DATASET_BORN], out)

    expect(writes.filter((write) => write.op === 'delete')).toEqual([
      { op: 'delete', _id: 'drafts.brief-figma-sync' },
    ])
    expect(logged()).toContain('brief-sanity-partner')
  })
})

describe('checkCorpus', () => {
  it('passes silently when the dataset holds what the repo says', () => {
    const { out, errored } = sink()

    expect(checkCorpus(CORPUS, IN_STEP, out)).toBe(0)
    expect(errored()).toBe('')
  })

  it('fails and names the drifted document, its source and its fields', () => {
    const { out, errored } = sink()

    const code = checkCorpus(CORPUS, DRIFTED, out)

    expect(code).toBe(1)
    expect(errored()).toContain('guidance-o3-voice drifted from docs/guidance/voice.md: body')
  })

  it('fails when a document is missing from the dataset', () => {
    const { out, errored } = sink()

    expect(checkCorpus(CORPUS, [VOICE], out)).toBe(1)
    expect(errored()).toContain('guidance-o3-slop is missing from the dataset')
  })

  it('fails when the dataset holds a document no source claims', () => {
    const { out, errored } = sink()

    const code = checkCorpus(CORPUS, [...IN_STEP, { _id: 'guidance-o3-retired' }], out)

    expect(code).toBe(1)
    expect(errored()).toContain('guidance-o3-retired has no source in the corpus')
  })

  // `brief:check` audits file-backed briefs only; its silence about a
  // dataset-born one is ADR 0027's design rather than a gap in the check.
  it('passes with a document the corpus disowned sitting in the dataset', () => {
    const { out, errored } = sink()

    const settled: CorpusSnapshotDocument = {
      _id: 'brief-figma-sync',
      key: 'figma-sync',
      title: 'The Figma sync pipeline',
      background: 'What the watcher does and what it refuses to do.',
      sourcePath: 'tools/guidance/briefs/figma-sync.md',
      record: 'Thesis: noticing no longer belongs to anyone.',
    }

    expect(checkCorpus(BRIEFS, [settled, DATASET_BORN], out)).toBe(0)
    expect(errored()).toBe('')
  })

  // The one drift a sync cannot settle: it names the file, the id, and the two
  // ways out, because the resolution is a decision rather than a re-run.
  it('fails when a source asks for an id the dataset owns', () => {
    const { out, errored } = sink()

    const code = checkCorpus(
      BRIEFS,
      [{ ...DATASET_BORN, _id: 'brief-figma-sync', key: 'figma-sync' }],
      out,
    )

    expect(code).toBe(1)
    expect(errored()).toContain('tools/guidance/briefs/figma-sync.md')
    expect(errored()).toMatch(/export|different key/)
  })

  it('still fails when the markdown behind a file-backed document is gone', () => {
    const { out, errored } = sink()

    const code = checkCorpus(
      BRIEFS,
      [{ _id: 'brief-retired', key: 'retired', sourcePath: 'tools/guidance/briefs/retired.md' }],
      out,
    )

    expect(code).toBe(1)
    expect(errored()).toContain('brief-retired has no source in the corpus')
  })
})

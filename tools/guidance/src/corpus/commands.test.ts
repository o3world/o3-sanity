import { describe, expect, it } from 'vitest'

import { checkCorpus, syncCorpus } from './commands'

import type { Corpus, CorpusSnapshotDocument } from './plan'

const CORPUS: Corpus = {
  type: 'guidance',
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

    const writes = syncCorpus(CORPUS, [], out)

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

    const writes = syncCorpus(CORPUS, IN_STEP, out)

    expect(writes.filter((write) => write.op === 'delete')).toEqual([
      { op: 'delete', _id: 'drafts.guidance-o3-voice' },
      { op: 'delete', _id: 'drafts.guidance-o3-slop' },
    ])
  })

  it('retires a published document no source claims, draft and all', () => {
    const { out, logged } = sink()

    const writes = syncCorpus(
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
})

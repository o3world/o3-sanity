import { describe, expect, it } from 'vitest'

import { driftOf, planCorpus } from './plan'

import type { CorpusSource } from './plan'

const source = (over: Partial<CorpusSource> & Pick<CorpusSource, 'key'>): CorpusSource => ({
  title: `The ${over.key} document`,
  body: `The body of ${over.key}.`,
  sourcePath: `docs/guidance/${over.key}.md`,
  ...over,
})

describe('planCorpus', () => {
  it('creates every source when the dataset is empty', () => {
    const plan = planCorpus(
      {
        type: 'guidance',
        sources: [{ key: 'o3-voice', title: 'O3 voice guide', body: 'Write plainly.' }],
      },
      [],
    )

    expect(plan.entries).toEqual([
      {
        state: 'created',
        fields: [],
        document: {
          _id: 'guidance-o3-voice',
          _type: 'guidance',
          key: 'o3-voice',
          title: 'O3 voice guide',
          body: 'Write plainly.',
        },
      },
    ])
  })

  it('leaves a document alone when the dataset already matches its source', () => {
    const plan = planCorpus(
      {
        type: 'guidance',
        sources: [
          {
            key: 'o3-voice',
            title: 'O3 voice guide',
            body: 'Write plainly.',
            sourcePath: 'docs/guidance/voice.md',
          },
        ],
      },
      [
        {
          _id: 'guidance-o3-voice',
          key: 'o3-voice',
          title: 'O3 voice guide',
          body: 'Write plainly.',
          sourcePath: 'docs/guidance/voice.md',
        },
      ],
    )

    expect(plan.entries.map((entry) => entry.state)).toEqual(['unchanged'])
  })

  it('names the fields a stale dataset copy disagrees on', () => {
    const plan = planCorpus(
      {
        type: 'guidance',
        sources: [
          {
            key: 'o3-voice',
            title: 'O3 voice guide',
            body: 'Write plainly.',
            sourcePath: 'docs/guidance/voice.md',
          },
        ],
      },
      [
        {
          _id: 'guidance-o3-voice',
          key: 'o3-voice',
          title: 'The voice guide',
          body: 'Write grandly.',
          sourcePath: 'docs/guidance/voice.md',
        },
      ],
    )

    expect(plan.entries).toMatchObject([{ state: 'updated', fields: ['title', 'body'] }])
  })

  it('counts a document the dataset has never seen a field of as drifted', () => {
    const plan = planCorpus(
      {
        type: 'guidance',
        sources: [
          {
            key: 'o3-voice',
            title: 'O3 voice guide',
            body: 'Write plainly.',
            sourcePath: 'docs/guidance/voice.md',
          },
        ],
      },
      [
        {
          _id: 'guidance-o3-voice',
          key: 'o3-voice',
          title: 'O3 voice guide',
          body: 'Write plainly.',
        },
      ],
    )

    expect(plan.entries).toMatchObject([{ state: 'updated', fields: ['sourcePath'] }])
  })

  it('reports a dataset document no source claims, whole', () => {
    const plan = planCorpus({ type: 'brief', sources: [] }, [
      { _id: 'brief-retired', key: 'retired', title: 'Retired', body: 'x', sourcePath: 'gone.md' },
      { _id: 'brief-session', key: 'session', title: 'Session', body: 'y' },
    ])

    expect(plan.entries).toEqual([])
    expect(plan.orphans).toEqual([
      { _id: 'brief-retired', key: 'retired', title: 'Retired', body: 'x', sourcePath: 'gone.md' },
      { _id: 'brief-session', key: 'session', title: 'Session', body: 'y' },
    ])
  })
})

describe('driftOf', () => {
  it('reports what is missing, what is stale and what has no source, and nothing else', () => {
    const plan = planCorpus(
      {
        type: 'guidance',
        sources: [source({ key: 'missing' }), source({ key: 'stale' }), source({ key: 'settled' })],
      },
      [
        {
          _id: 'guidance-stale',
          key: 'stale',
          title: 'The stale document',
          body: 'Something else.',
          sourcePath: 'docs/guidance/stale.md',
        },
        {
          _id: 'guidance-settled',
          key: 'settled',
          title: 'The settled document',
          body: 'The body of settled.',
          sourcePath: 'docs/guidance/settled.md',
        },
        { _id: 'guidance-orphan', key: 'orphan', title: 'The orphan', body: 'Nobody claims me.' },
      ],
    )

    expect(driftOf(plan)).toEqual([
      { kind: 'missing', _id: 'guidance-missing', sourcePath: 'docs/guidance/missing.md' },
      {
        kind: 'drifted',
        _id: 'guidance-stale',
        sourcePath: 'docs/guidance/stale.md',
        fields: ['body'],
      },
      { kind: 'unsourced', _id: 'guidance-orphan', sourcePath: undefined },
    ])
  })

  it('is empty when the dataset holds exactly what the sources say', () => {
    const plan = planCorpus({ type: 'guidance', sources: [source({ key: 'settled' })] }, [
      {
        _id: 'guidance-settled',
        key: 'settled',
        title: 'The settled document',
        body: 'The body of settled.',
        sourcePath: 'docs/guidance/settled.md',
      },
    ])

    expect(driftOf(plan)).toEqual([])
  })
})

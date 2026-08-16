import { describe, expect, it } from 'vitest'

import { driftOf, planCorpus } from './plan'

import type { Corpus, CorpusSource } from './plan'

const source = (over: Partial<CorpusSource> & Pick<CorpusSource, 'key'>): CorpusSource => ({
  title: `The ${over.key} document`,
  body: `The body of ${over.key}.`,
  sourcePath: `docs/guidance/${over.key}.md`,
  ...over,
})

/** The guidance shape: body in `body`, and the repo is the whole truth. */
const guidance = (sources: CorpusSource[]): Corpus => ({
  type: 'guidance',
  bodyField: 'body',
  writes: 'replace',
  claimsOrphans: 'every',
  sources,
})

/** The brief shape: body in `background`, and the dataset may hold its own (ADR 0027). */
const briefs = (sources: CorpusSource[]): Corpus => ({
  type: 'brief',
  bodyField: 'background',
  writes: 'merge',
  claimsOrphans: 'file-backed',
  sources,
})

describe('planCorpus', () => {
  it('creates every source when the dataset is empty', () => {
    const plan = planCorpus(
      guidance([{ key: 'o3-voice', title: 'O3 voice guide', body: 'Write plainly.' }]),
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

  /**
   * The engine writes one markdown body into whichever field the corpus
   * declares: `guidance.body`, `brief.background`. A brief has no `body` field
   * at all, so a corpus that could not say where its markdown goes would sync
   * documents the schema does not declare.
   */
  it('lands the markdown in the field the corpus maps it to', () => {
    const plan = planCorpus(
      briefs([
        {
          key: 'figma-sync',
          title: 'The Figma sync pipeline',
          body: 'What the watcher does and what it refuses to do.',
          sourcePath: 'tools/guidance/briefs/figma-sync.md',
        },
      ]),
      [],
    )

    expect(plan.entries[0]?.document).toEqual({
      _id: 'brief-figma-sync',
      _type: 'brief',
      key: 'figma-sync',
      title: 'The Figma sync pipeline',
      background: 'What the watcher does and what it refuses to do.',
      sourcePath: 'tools/guidance/briefs/figma-sync.md',
    })
  })

  it('compares the dataset on the mapped field, not on `body`', () => {
    const plan = planCorpus(
      briefs([
        {
          key: 'figma-sync',
          title: 'The Figma sync pipeline',
          body: 'What the watcher does.',
          sourcePath: 'tools/guidance/briefs/figma-sync.md',
        },
      ]),
      [
        {
          _id: 'brief-figma-sync',
          key: 'figma-sync',
          title: 'The Figma sync pipeline',
          background: 'Something the repo no longer says.',
          sourcePath: 'tools/guidance/briefs/figma-sync.md',
          record: 'Thesis: the file is checkable.',
        },
      ],
    )

    expect(plan.entries).toMatchObject([{ state: 'updated', fields: ['background'] }])
  })

  it('leaves a document alone when the dataset already matches its source', () => {
    const plan = planCorpus(
      guidance([
        {
          key: 'o3-voice',
          title: 'O3 voice guide',
          body: 'Write plainly.',
          sourcePath: 'docs/guidance/voice.md',
        },
      ]),
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
      guidance([
        {
          key: 'o3-voice',
          title: 'O3 voice guide',
          body: 'Write plainly.',
          sourcePath: 'docs/guidance/voice.md',
        },
      ]),
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
      guidance([
        {
          key: 'o3-voice',
          title: 'O3 voice guide',
          body: 'Write plainly.',
          sourcePath: 'docs/guidance/voice.md',
        },
      ]),
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
    const plan = planCorpus(guidance([]), [
      {
        _id: 'guidance-retired',
        key: 'retired',
        title: 'Retired',
        body: 'x',
        sourcePath: 'gone.md',
      },
      { _id: 'guidance-session', key: 'session', title: 'Session', body: 'y' },
    ])

    expect(plan.entries).toEqual([])
    expect(plan.orphans).toEqual([
      {
        _id: 'guidance-retired',
        key: 'retired',
        title: 'Retired',
        body: 'x',
        sourcePath: 'gone.md',
      },
      { _id: 'guidance-session', key: 'session', title: 'Session', body: 'y' },
    ])
    expect(plan.disowned).toEqual([])
  })

  /**
   * A brief with no `sourcePath` was written in the dataset by the authoring
   * skill (ADR 0027) — a supported provenance state, not a leftover. The
   * corpus disowns it: sync must never delete it and check must never call it
   * drift. A file-backed brief whose markdown was deleted still has its
   * `sourcePath` and is still the corpus's to retire.
   */
  it('disowns a dataset-born document when the corpus only claims file-backed ones', () => {
    const plan = planCorpus(briefs([]), [
      {
        _id: 'brief-retired',
        key: 'retired',
        title: 'Retired',
        background: 'x',
        sourcePath: 'tools/guidance/briefs/retired.md',
      },
      { _id: 'brief-session', key: 'session', title: 'Session', background: 'y' },
    ])

    expect(plan.orphans.map((document) => document._id)).toEqual(['brief-retired'])
    expect(plan.disowned.map((document) => document._id)).toEqual(['brief-session'])
  })

  /**
   * A GROQ projection returns a field the document does not have as `null`
   * rather than leaving it out, so a snapshot fetched from the dataset says
   * `sourcePath: null` where a hand-written one says nothing at all. Read
   * strictly, that is a file-backed document, and sync deletes it — which is
   * what a dataset-born brief looked like the first time this ran for real.
   */
  it('reads a null sourcePath as no sourcePath', () => {
    const plan = planCorpus(briefs([]), [
      { _id: 'brief-session', key: 'session', title: 'Session', background: 'y', sourcePath: null },
    ])

    expect(plan.orphans).toEqual([])
    expect(plan.disowned.map((document) => document._id)).toEqual(['brief-session'])
  })
})

describe('driftOf', () => {
  it('reports what is missing, what is stale and what has no source, and nothing else', () => {
    const plan = planCorpus(
      guidance([source({ key: 'missing' }), source({ key: 'stale' }), source({ key: 'settled' })]),
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
    const plan = planCorpus(guidance([source({ key: 'settled' })]), [
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

  // `brief:check` audits file-backed briefs and says nothing about the rest —
  // its silence about a dataset-born one is the ADR's design, not a gap.
  it('says nothing about a document the corpus disowned', () => {
    const plan = planCorpus(briefs([]), [
      { _id: 'brief-session', key: 'session', title: 'Session', background: 'y' },
    ])

    expect(driftOf(plan)).toEqual([])
  })
})

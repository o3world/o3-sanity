import { describe, expect, it } from 'vitest'

import { driftOf, normalizeSnapshot, planCorpus } from './plan'

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
          thesis: 'The file is checkable.',
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

  /**
   * The id is derived from the key, so a file dropped into the corpus can land
   * on one the authoring skill already wrote in the dataset. Claiming it by id
   * alone would patch the repo's background over a session's work, stamp a
   * `sourcePath` on it, and delete its draft — a silent conversion of a
   * dataset-born brief into a file-backed one (ADR 0027). The collision is a
   * conflict instead: no entry, so nothing is written for it at all.
   */
  it('refuses a source whose id is already a dataset-born document', () => {
    const plan = planCorpus(
      briefs([
        {
          key: 'session',
          title: 'The session brief',
          body: 'What the repo says.',
          sourcePath: 'tools/guidance/briefs/session.md',
        },
      ]),
      [
        {
          _id: 'brief-session',
          key: 'session',
          title: 'Session',
          background: 'y',
          sourcePath: null,
        },
      ],
    )

    expect(plan.entries).toEqual([])
    expect(plan.conflicts).toEqual([
      {
        _id: 'brief-session',
        sourcePath: 'tools/guidance/briefs/session.md',
        live: 'published',
      },
    ])
    expect(plan.orphans).toEqual([])
    expect(plan.disowned).toEqual([])
  })

  /**
   * The skill writes a brief as a draft and never publishes it, so the
   * document a collision would destroy is exactly the one a published-only
   * snapshot cannot see. `normalizeSnapshot` folds the draft in; the guard
   * reads it like any other dataset-born document.
   */
  it('refuses a source whose id is a draft nobody published', () => {
    const plan = planCorpus(
      briefs([
        {
          key: 'session',
          title: 'The session brief',
          body: 'What the repo says.',
          sourcePath: 'tools/guidance/briefs/session.md',
        },
      ]),
      normalizeSnapshot([
        { _id: 'drafts.brief-session', key: 'session', title: 'Session', background: 'y' },
      ]),
    )

    expect(plan.entries).toEqual([])
    expect(plan.conflicts).toMatchObject([{ _id: 'brief-session', live: 'draft' }])
  })

  it('claims a source whose live document is already file-backed', () => {
    const plan = planCorpus(
      briefs([
        {
          key: 'session',
          title: 'The session brief',
          body: 'What the repo says.',
          sourcePath: 'tools/guidance/briefs/session.md',
        },
      ]),
      [
        {
          _id: 'brief-session',
          key: 'session',
          title: 'The session brief',
          background: 'What the repo says.',
          sourcePath: 'tools/guidance/briefs/session.md',
        },
      ],
    )

    expect(plan.conflicts).toEqual([])
    expect(plan.entries.map((entry) => entry.state)).toEqual(['unchanged'])
  })

  // Guidance is the whole truth of its type — there is no such thing as a
  // dataset-born guidance document, so a live copy with no `sourcePath` is a
  // document to overwrite rather than one to step around.
  it('never conflicts in a corpus that claims every document', () => {
    const plan = planCorpus(
      guidance([source({ key: 'o3-voice', sourcePath: 'docs/guidance/voice.md' })]),
      [{ _id: 'guidance-o3-voice', key: 'o3-voice', title: 'Something else', body: 'x' }],
    )

    expect(plan.conflicts).toEqual([])
    expect(plan.entries).toMatchObject([{ state: 'updated' }])
  })

  // A published copy that exists is what sync compares against; a draft-only
  // id has no published copy to compare, so the document is missing.
  it('counts a file-backed id the dataset holds only as a draft as missing', () => {
    const plan = planCorpus(
      briefs([
        {
          key: 'session',
          title: 'The session brief',
          body: 'What the repo says.',
          sourcePath: 'tools/guidance/briefs/session.md',
        },
      ]),
      normalizeSnapshot([
        {
          _id: 'drafts.brief-session',
          key: 'session',
          title: 'The session brief',
          background: 'What the repo says.',
          sourcePath: 'tools/guidance/briefs/session.md',
        },
      ]),
    )

    expect(plan.conflicts).toEqual([])
    expect(plan.entries).toMatchObject([{ state: 'created' }])
  })
})

/**
 * Drafts have to reach the plan — the document a key collision would destroy
 * is usually one the authoring skill never published (ADR 0027) — but they are
 * not separate documents to the corpus. One id, one row.
 */
describe('normalizeSnapshot', () => {
  it('folds a draft into the published copy it shadows, published fields winning', () => {
    expect(
      normalizeSnapshot([
        {
          _id: 'brief-figma-sync',
          key: 'figma-sync',
          title: 'The Figma sync pipeline',
          sourcePath: 'tools/guidance/briefs/figma-sync.md',
        },
        { _id: 'drafts.brief-figma-sync', key: 'figma-sync', title: 'Edited in Studio' },
      ]),
    ).toEqual([
      {
        _id: 'brief-figma-sync',
        key: 'figma-sync',
        title: 'The Figma sync pipeline',
        sourcePath: 'tools/guidance/briefs/figma-sync.md',
        draftBeside: true,
      },
    ])
  })

  /**
   * The fold loses the draft's fields, and sync deletes the draft itself. That
   * is right for a file-backed document, whose draft can only be an accident,
   * and wrong for a dataset-born one, where the draft is the newer edit — so
   * the row says the draft was there and export refuses to promote past it.
   */
  it('marks a published row that a draft still stands beside', () => {
    const folded = normalizeSnapshot([
      { _id: 'brief-sanity-partner', key: 'sanity-partner', background: 'Published once.' },
      { _id: 'drafts.brief-sanity-partner', key: 'sanity-partner', background: 'Edited since.' },
    ])

    expect(folded).toMatchObject([{ _id: 'brief-sanity-partner', draftBeside: true }])
  })

  it('leaves the marker off a row no draft shadows', () => {
    const folded = normalizeSnapshot([{ _id: 'brief-sanity-partner', key: 'sanity-partner' }])

    expect(folded[0]?.draftBeside).toBeUndefined()
  })

  it('keeps a draft nobody published, under the id it will publish as', () => {
    expect(
      normalizeSnapshot([
        { _id: 'drafts.brief-session', key: 'session', title: 'Session', background: 'y' },
      ]),
    ).toEqual([
      {
        _id: 'brief-session',
        key: 'session',
        title: 'Session',
        background: 'y',
        draftOnly: true,
      },
    ])
  })

  // Provenance is the document's, not the copy's: a published row that lost
  // its `sourcePath` while the draft still carries one is a file-backed brief
  // to patch, not a dataset-born one to step around.
  it('takes a sourcePath from whichever copy has one', () => {
    expect(
      normalizeSnapshot([
        { _id: 'brief-figma-sync', key: 'figma-sync', sourcePath: null },
        {
          _id: 'drafts.brief-figma-sync',
          key: 'figma-sync',
          sourcePath: 'tools/guidance/briefs/figma-sync.md',
        },
      ]),
    ).toEqual([
      {
        _id: 'brief-figma-sync',
        key: 'figma-sync',
        sourcePath: 'tools/guidance/briefs/figma-sync.md',
        draftBeside: true,
      },
    ])
  })

  /**
   * A `raw` fetch returns the copies a release stages too. One of those is a
   * proposed future document rather than a document the corpus plans against:
   * left in, it reads as an orphan, and sync would delete a release's contents.
   */
  it('drops the copy a release stages', () => {
    expect(
      normalizeSnapshot([
        { _id: 'brief-figma-sync', key: 'figma-sync', title: 'The Figma sync pipeline' },
        { _id: 'versions.autumn.brief-figma-sync', key: 'figma-sync', title: 'Next autumn' },
      ]),
    ).toEqual([{ _id: 'brief-figma-sync', key: 'figma-sync', title: 'The Figma sync pipeline' }])
  })

  it('passes a published-only snapshot through unchanged', () => {
    const rows = [{ _id: 'guidance-o3-voice', key: 'o3-voice', body: 'x' }]

    expect(normalizeSnapshot(rows)).toEqual(rows)
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

  // A key collision is drift the repo cannot fix by syncing: the check has to
  // fail, and it has to name the file that cannot have the id it asks for.
  it('reports a source that collides with a dataset-born document', () => {
    const plan = planCorpus(
      briefs([
        {
          key: 'session',
          title: 'The session brief',
          body: 'What the repo says.',
          sourcePath: 'tools/guidance/briefs/session.md',
        },
      ]),
      [{ _id: 'brief-session', key: 'session', title: 'Session', background: 'y' }],
    )

    expect(driftOf(plan)).toEqual([
      {
        kind: 'conflicted',
        _id: 'brief-session',
        sourcePath: 'tools/guidance/briefs/session.md',
        live: 'published',
      },
    ])
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

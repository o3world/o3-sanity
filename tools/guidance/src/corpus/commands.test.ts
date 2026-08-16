import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { checkCorpus, exportCorpus, syncCorpus } from './commands'
import { normalizeSnapshot } from './plan'
import { readGlobbedSources } from './read'

import type { CorpusWrite } from './commands'
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

/**
 * Export promotes a dataset-born document into the repo (ADR 0027). The
 * candidates are exactly the documents the corpus disowns, and the operator
 * picks one — exporting the lot blindly would file everything a session ever
 * scribbled.
 */
describe('exportCorpus', () => {
  const REQUEST = { directory: 'tools/guidance/briefs', occupied: [] }

  it('names the dataset-born documents and exports nothing when asked for no key', () => {
    const { out, logged } = sink()

    const result = exportCorpus(BRIEFS, [DATASET_BORN], REQUEST, out)

    expect(result).toEqual({ writes: [], status: 0 })
    expect(logged()).toContain('sanity-partner')
    expect(logged()).toContain('The Sanity partnership page')
  })

  /**
   * The stamp lands on the published copy — the copy sync compares and a
   * `briefs` reference resolves to — and carries the fields the file now backs
   * with it, so the document matches its own markdown and the next sync has
   * nothing to write. Everything else the document holds is untouched.
   */
  it('turns a published document into a file and stamps its provenance', () => {
    const { out } = sink()

    const result = exportCorpus(BRIEFS, [DATASET_BORN], { ...REQUEST, key: 'sanity-partner' }, out)

    expect(result.file).toEqual({
      sourcePath: 'tools/guidance/briefs/sanity-partner.md',
      contents:
        '---\nkey: sanity-partner\ntitle: The Sanity partnership page\n---\n\nGathered in the session that drafted it.\n',
    })
    expect(result.writes).toEqual([
      {
        op: 'patch',
        _id: 'brief-sanity-partner',
        set: {
          key: 'sanity-partner',
          title: 'The Sanity partnership page',
          background: 'Gathered in the session that drafted it.',
          sourcePath: 'tools/guidance/briefs/sanity-partner.md',
        },
      },
    ])
    expect(result.status).toBe(0)
  })

  /**
   * The authoring skill writes a brief as a draft and never publishes it, so
   * most candidates arrive draft-only. Stamping the draft and leaving the rest
   * to sync would create the published copy from the file — and the file
   * carries only `background`, so the `record` the interview produced would be
   * deleted with the draft. Export publishes the draft whole instead.
   */
  it('publishes a draft-only document whole, rather than stamping the draft', () => {
    const { out } = sink()

    const snapshot = normalizeSnapshot([
      {
        _id: 'drafts.brief-sanity-partner',
        _rev: 'a1b2c3',
        _createdAt: '2026-08-15T00:00:00Z',
        key: 'sanity-partner',
        title: 'The Sanity partnership page',
        background: 'Gathered in the session that drafted it.',
        record: 'Thesis: the partnership is a delivery claim.',
      },
    ])

    const result = exportCorpus(BRIEFS, snapshot, { ...REQUEST, key: 'sanity-partner' }, out)

    expect(result.writes).toEqual([
      {
        op: 'createOrReplace',
        document: {
          _id: 'brief-sanity-partner',
          _type: 'brief',
          key: 'sanity-partner',
          title: 'The Sanity partnership page',
          background: 'Gathered in the session that drafted it.',
          record: 'Thesis: the partnership is a delivery claim.',
          sourcePath: 'tools/guidance/briefs/sanity-partner.md',
        },
      },
      { op: 'delete', _id: 'drafts.brief-sanity-partner' },
    ])
    expect(result.status).toBe(0)
  })

  // A file-backed document is already in the repo, and the file is the source
  // of truth for it: exporting again would write the dataset's copy over it.
  it('refuses a document the repo already backs', () => {
    const { out, errored } = sink()

    const result = exportCorpus(
      BRIEFS,
      [
        {
          _id: 'brief-figma-sync',
          key: 'figma-sync',
          title: 'The Figma sync pipeline',
          background: 'What the watcher does and what it refuses to do.',
          sourcePath: 'tools/guidance/briefs/figma-sync.md',
        },
      ],
      { ...REQUEST, key: 'figma-sync' },
      out,
    )

    expect(result).toEqual({ writes: [], status: 1 })
    expect(errored()).toContain('brief-figma-sync is already file-backed')
    expect(errored()).toContain('tools/guidance/briefs/figma-sync.md')
  })

  // The file a key maps to is not always the file that registers it — one
  // named for another key would be overwritten without ever being read.
  it('refuses to write over a file the directory already holds', () => {
    const { out, errored } = sink()

    const result = exportCorpus(
      BRIEFS,
      [DATASET_BORN],
      {
        ...REQUEST,
        key: 'sanity-partner',
        occupied: ['tools/guidance/briefs/sanity-partner.md'],
      },
      out,
    )

    expect(result).toEqual({ writes: [], status: 1 })
    expect(errored()).toContain('tools/guidance/briefs/sanity-partner.md already exists')
  })

  /**
   * The collision sync and check refuse (ADR 0027) sends the operator here, so
   * export has to name the same two ways out rather than claim the brief does
   * not exist: the key is taken by a file, and the document is real.
   */
  it('refuses a key a markdown file already registers, and says what to do', () => {
    const { out, errored } = sink()

    const result = exportCorpus(
      BRIEFS,
      [{ ...DATASET_BORN, _id: 'brief-figma-sync', key: 'figma-sync' }],
      { ...REQUEST, key: 'figma-sync' },
      out,
    )

    expect(result).toEqual({ writes: [], status: 1 })
    expect(errored()).toContain('tools/guidance/briefs/figma-sync.md')
    expect(errored()).toContain('different key')
  })

  // The corpus reader refuses a file that is nothing but frontmatter, so a
  // document with an empty body would export to a file sync then throws on.
  it('refuses a document with no body to write', () => {
    const { out, errored } = sink()

    const result = exportCorpus(
      BRIEFS,
      [{ ...DATASET_BORN, background: '  ' }],
      { ...REQUEST, key: 'sanity-partner' },
      out,
    )

    expect(result).toEqual({ writes: [], status: 1 })
    expect(errored()).toContain('brief-sanity-partner has no background to export')
  })

  /**
   * A brief is wider than its file: `instructions`, `links` and `record` have
   * no slot in the markdown and stay on the document, where a merge sync writes
   * around them. Losing them from the file is fine; not knowing is not.
   */
  it('names the fields the file does not carry', () => {
    const { out, logged } = sink()

    exportCorpus(
      BRIEFS,
      [
        {
          ...DATASET_BORN,
          instructions: 'Lead with the delivery claim.',
          links: ['https://o3world.com'],
          record: 'Thesis: the partnership is a delivery claim.',
        },
      ],
      { ...REQUEST, key: 'sanity-partner' },
      out,
    )

    expect(logged()).toContain('instructions, links, record')
  })
})

/**
 * What an export is for (ADR 0027): the brief survives a rebuild. The file goes
 * out through the real reader and the writes through a model of the transaction
 * `commitWrites` builds, so the loop is exercised end to end without a project.
 */
describe('export → sync', () => {
  /** The dataset after a transaction: the same fold `commitWrites` hands the client. */
  function applied(
    snapshot: readonly CorpusSnapshotDocument[],
    writes: readonly CorpusWrite[],
  ): CorpusSnapshotDocument[] {
    const byId = new Map(snapshot.map((document) => [document._id, { ...document }]))
    for (const write of writes) {
      if (write.op === 'delete') byId.delete(write._id)
      else if (write.op === 'patch') {
        const live = byId.get(write._id)
        if (live) byId.set(write._id, { ...live, ...write.set })
      } else if (write.op === 'createOrReplace' || !byId.has(write.document._id)) {
        byId.set(write.document._id, { ...write.document })
      }
    }
    return [...byId.values()]
  }

  /** The exported file, read back the way `brief:sync` reads the corpus. */
  function corpusFrom(file: { sourcePath: string; contents: string }): Corpus {
    const root = mkdtempSync(join(tmpdir(), 'corpus-export-'))
    mkdirSync(join(root, 'briefs'))
    writeFileSync(join(root, file.sourcePath), file.contents, 'utf8')
    return { ...BRIEFS, sources: readGlobbedSources(root, 'briefs') }
  }

  /** The authoring skill's output: a draft nobody published, with its interview in `record`. */
  const AUTHORED = normalizeSnapshot([
    {
      _id: 'drafts.brief-sanity-partner',
      key: 'sanity-partner',
      title: 'The Sanity partnership page',
      background: 'Gathered in the session that drafted it.\n',
      record: 'Thesis: the partnership is a delivery claim.',
    },
  ])

  it('leaves the next sync nothing to write', () => {
    const { out } = sink()

    const exported = exportCorpus(
      BRIEFS,
      AUTHORED,
      { key: 'sanity-partner', directory: 'briefs', occupied: [] },
      out,
    )
    const sync = syncCorpus(corpusFrom(exported.file!), applied(AUTHORED, exported.writes), out)

    expect(sync.status).toBe(0)
    expect(sync.writes.filter((write) => write.op === 'patch')).toEqual([])
    expect(sync.writes.filter((write) => write.op === 'delete')).toEqual([
      { op: 'delete', _id: 'drafts.brief-sanity-partner' },
    ])
  })

  it('keeps the interview on the document the export published', () => {
    const { out } = sink()

    const exported = exportCorpus(
      BRIEFS,
      AUTHORED,
      { key: 'sanity-partner', directory: 'briefs', occupied: [] },
      out,
    )

    expect(applied(AUTHORED, exported.writes)).toEqual([
      {
        _id: 'brief-sanity-partner',
        _type: 'brief',
        key: 'sanity-partner',
        title: 'The Sanity partnership page',
        background: 'Gathered in the session that drafted it.',
        record: 'Thesis: the partnership is a delivery claim.',
        sourcePath: 'briefs/sanity-partner.md',
      },
    ])
  })

  // The rebuild: an empty dataset and the exported file are enough to put the
  // brief back, which is the whole of what a dataset-born one cannot do.
  it('restores the brief from the file alone after the dataset is rebuilt', () => {
    const { out } = sink()

    const exported = exportCorpus(
      BRIEFS,
      AUTHORED,
      { key: 'sanity-partner', directory: 'briefs', occupied: [] },
      out,
    )
    const rebuilt = syncCorpus(corpusFrom(exported.file!), [], out)

    expect(applied([], rebuilt.writes)).toEqual([
      {
        _id: 'brief-sanity-partner',
        _type: 'brief',
        key: 'sanity-partner',
        title: 'The Sanity partnership page',
        background: 'Gathered in the session that drafted it.',
        sourcePath: 'briefs/sanity-partner.md',
      },
    ])
  })
})

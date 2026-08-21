import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { execPath } from 'node:process'

import { afterAll, describe, expect, it } from 'vitest'

import { gradeRun, parseFrontmatter, readGraders, validateCase } from './grade.mjs'

const evalsDir = resolve(import.meta.dirname)

const scratch = mkdtempSync(join(tmpdir(), 'o3-evals-'))
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

let counter = 0
function write(files: Record<string, string>): string {
  const root = join(scratch, `fixture-${(counter += 1)}`)
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, content)
  }
  return root
}

/** A case with one grader, so a test can vary the grader alone. */
function caseWith(grader: string): string {
  return write({
    'prompt.md': '---\nname: T\nmodel: sonnet\n---\n\nDo the thing.\n',
    'graders/only.md': grader,
  })
}

describe('parseFrontmatter', () => {
  it('reads scalars, inline arrays, inline maps and one level of nesting', () => {
    const { fields, body } = parseFrontmatter(
      [
        '---',
        'name: References read',
        'runs: 3',
        'tags: [smoke, sanity]',
        "pattern: '^BLOCKING: false \\(.+\\)$'",
        'target: { source: file, path: references.json }',
        'env:',
        '  EVAL_MODE: strict',
        '---',
        '',
        'The task.',
      ].join('\n'),
    )

    expect(fields).toMatchObject({
      name: 'References read',
      runs: 3,
      tags: ['smoke', 'sanity'],
      pattern: '^BLOCKING: false \\(.+\\)$',
      target: { source: 'file', path: 'references.json' },
      env: { EVAL_MODE: 'strict' },
    })
    expect(body).toBe('The task.')
  })

  it('rejoins a flow sequence prettier wrapped across lines, and ignores brackets inside a scalar', () => {
    const { fields } = parseFrontmatter(
      [
        '---',
        'name: Gather gate',
        'model: sonnet',
        'allowed_tools:',
        '  [',
        '    Read,',
        '    mcp__sanity__query_documents,',
        '  ]',
        'pattern: \'"gaps"\\s*:\\s*\\[\\s*"\'',
        'runs: 1',
        '---',
        '',
        'The task.',
      ].join('\n'),
    )

    expect(fields.allowed_tools).toEqual(['Read', 'mcp__sanity__query_documents'])
    expect(fields.pattern).toBe('"gaps"\\s*:\\s*\\[\\s*"')
    expect(fields.runs).toBe(1)
  })

  it('keeps a comment above a wrapped flow sequence from swallowing the budget under it', () => {
    const { fields } = parseFrontmatter(
      [
        '---',
        'name: Review verdict',
        'model: sonnet',
        "# Server name is the plugin's `sanity`.",
        'allowed_tools:',
        '  [',
        '    Read,',
        '    mcp__sanity__get_document,',
        '  ]',
        '---',
        '',
        'The task.',
      ].join('\n'),
    )

    expect(fields.allowed_tools).toEqual(['Read', 'mcp__sanity__get_document'])
  })

  it('reports a file with no frontmatter rather than guessing at one', () => {
    expect(parseFrontmatter('just a prompt').hasFrontmatter).toBe(false)
  })
})

describe('validateCase', () => {
  it('passes every case committed here', () => {
    const cases = readdirSync(evalsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== 'results')
      .map((entry) => join(evalsDir, entry.name))

    expect(cases.length).toBeGreaterThan(0)
    for (const path of cases)
      expect({ path, problems: validateCase(path) }).toEqual({
        path,
        problems: [],
      })
  })

  it('holds the Sonnet policy — an unpinned or larger model fails the case', () => {
    const unpinned = write({
      'prompt.md': '---\nname: T\n---\n\nDo the thing.\n',
      'graders/only.md': '---\ntype: file_exists\npath: out.txt\n---\n',
    })
    expect(validateCase(unpinned)).toEqual([
      'prompt.md: model must be pinned to sonnet, found `none`',
    ])

    const opus = write({
      'prompt.md': '---\nname: T\nmodel: opus\n---\n\nDo the thing.\n',
      'graders/only.md': '---\ntype: file_exists\npath: out.txt\n---\n',
    })
    expect(validateCase(opus)).toEqual(['prompt.md: model must be pinned to sonnet, found `opus`'])
  })

  it('rejects a field plugin eval does not have, so a case cannot drift from the format', () => {
    const drifted = write({
      'prompt.md': '---\nname: T\nmodel: sonnet\npersona: nick\n---\n\nDo the thing.\n',
      'graders/only.md': '---\ntype: file_exists\npath: out.txt\n---\n',
    })
    expect(validateCase(drifted)).toContain('prompt.md: unknown field `persona`')
  })

  it('rejects an unknown grader type and a pattern that does not compile', () => {
    expect(validateCase(caseWith('---\ntype: groq\nquery: "*[_type==\'brief\']"\n---\n'))).toEqual([
      'graders/only.md: unknown type `groq`',
    ])
    expect(validateCase(caseWith('---\ntype: regex\npattern: "([unclosed"\n---\n'))[0]).toMatch(
      /pattern does not compile/,
    )
  })

  it('rejects a case with no graders — a run nobody judged is not a case', () => {
    const bare = write({ 'prompt.md': '---\nname: T\nmodel: sonnet\n---\n\nDo the thing.\n' })
    expect(validateCase(bare)).toEqual(['graders/ holds no grader files'])
  })
})

describe('readGraders', () => {
  it('names a grader after its file and keeps the body as the rubric', () => {
    const path = caseWith('---\ntype: llm\ncriteria: Is it grounded?\n---\n\nThe rubric.\n')
    expect(readGraders(path)).toEqual([
      { name: 'only', type: 'llm', criteria: 'Is it grounded?', rubric: 'The rubric.' },
    ])
  })
})

describe('gradeRun', () => {
  const run = (files: Record<string, string>) => write(files)

  it('grades a regex against the last message', () => {
    const path = caseWith(
      "---\ntype: regex\npattern: '^BLOCKING: false \\(.+\\)$'\nflags: m\n---\n",
    )
    const passing = run({ 'last-message.md': 'All three.\nBLOCKING: false (references present)\n' })
    const failing = run({ 'last-message.md': 'All three present, nothing to worry about.\n' })

    expect(gradeRun(path, passing)).toEqual([
      {
        name: 'only',
        type: 'regex',
        passed: true,
        score: 1,
        detail: '1 match(es) in last_message',
      },
    ])
    expect(gradeRun(path, failing)[0]).toMatchObject({ passed: false, score: 0 })
  })

  it('counts matches when the assertion is exact', () => {
    const path = caseWith(
      "---\ntype: regex\npattern: '(argument|style)\\.md'\nflags: g\nmatch: count:2\ntarget: { source: file, path: references.json }\n---\n",
    )
    const both = run({ 'workspace/references.json': '["argument.md","style.md"]' })
    const one = run({ 'workspace/references.json': '["argument.md"]' })

    expect(gradeRun(path, both)[0]).toMatchObject({ passed: true })
    expect(gradeRun(path, one)[0]).toMatchObject({
      passed: false,
      detail: '1 match(es) in file references.json, wanted 2',
    })
  })

  it('fails rather than throws when the file a grader targets was never produced', () => {
    const path = caseWith(
      "---\ntype: regex\npattern: 'anything'\ntarget: { source: file, path: missing.json }\n---\n",
    )
    expect(gradeRun(path, run({ 'last-message.md': 'done' }))[0]).toEqual({
      name: 'only',
      type: 'regex',
      passed: false,
      score: 0,
      detail: 'no file missing.json (not produced) to match against',
    })
  })

  it('matches file_exists as a glob over what the run produced', () => {
    const path = caseWith('---\ntype: file_exists\npath: dataset/*.json\n---\n')
    expect(gradeRun(path, run({ 'workspace/dataset/brief-x.json': '{}' }))[0]).toMatchObject({
      passed: true,
    })
    expect(gradeRun(path, run({ 'workspace/notes.md': 'x' }))[0]).toMatchObject({ passed: false })
  })

  it('counts tool calls case-insensitively, because the MCP server key differs by surface', () => {
    const path = caseWith(
      "---\ntype: tool_used\ntool: mcp__sanity__query_documents\ninput_match: 'guidance'\n---\n",
    )
    const transcript = [
      '{"type":"tool_use","name":"mcp__Sanity__query_documents","input":{"query":"*[_type==\\"guidance\\"]"}}',
      '{"type":"assistant","text":"six keys"}',
    ].join('\n')

    expect(gradeRun(path, run({ 'transcript.jsonl': transcript }))[0]).toMatchObject({
      passed: true,
      detail: '1 call(s) to mcp__sanity__query_documents',
    })
  })

  it('reads max: 0 as a prohibition', () => {
    const path = caseWith(
      '---\ntype: tool_used\ntool: mcp__sanity__publish_documents\nmin: 0\nmax: 0\n---\n',
    )
    const clean = run({ 'transcript.jsonl': '{"type":"tool_use","name":"Write","input":{}}' })
    const published = run({
      'transcript.jsonl': '{"type":"tool_use","name":"mcp__Sanity__publish_documents","input":{}}',
    })

    expect(gradeRun(path, clean)[0]).toMatchObject({ passed: true })
    expect(gradeRun(path, published)[0]).toMatchObject({ passed: false })
  })

  it('checks tool order along the transcript', () => {
    const path = caseWith('---\ntype: tool_order\nbefore: Read\nafter: Write\n---\n')
    const ordered = run({
      'transcript.jsonl': [
        '{"type":"tool_use","name":"Read","input":{}}',
        '{"type":"tool_use","name":"Write","input":{}}',
      ].join('\n'),
    })
    const reversed = run({
      'transcript.jsonl': [
        '{"type":"tool_use","name":"Write","input":{}}',
        '{"type":"tool_use","name":"Read","input":{}}',
      ].join('\n'),
    })

    expect(gradeRun(path, ordered)[0]).toMatchObject({ passed: true })
    expect(gradeRun(path, reversed)[0]).toMatchObject({ passed: false })
  })

  it('refuses to grade a transcript line it cannot parse, rather than counting without it', () => {
    const path = caseWith('---\ntype: tool_used\ntool: Write\n---\n')
    const damaged = run({
      'transcript.jsonl': [
        '{"type":"tool_use","name":"Read","input":{}}',
        '{"type":"tool_use","name":"Write","input":{"file_path":"draft.md"',
      ].join('\n'),
    })

    expect(() => gradeRun(path, damaged)).toThrow(/transcript\.jsonl line 2 does not parse/)
  })

  it('refuses a min: 0 grader against a transcript with no tool call in it, rather than passing on the silence', () => {
    const path = caseWith(
      '---\ntype: tool_used\ntool: mcp__sanity__publish_documents\nmin: 0\nmax: 0\n---\n',
    )
    const unlogged = run({
      'transcript.jsonl': '{"type":"assistant","text":"Published the insight."}',
    })

    expect(() => gradeRun(path, unlogged)).toThrow(/records no tool call/)
  })

  it('refuses a tool_used grader when no transcript was captured at all', () => {
    const path = caseWith('---\ntype: tool_used\ntool: Write\nmin: 1\n---\n')

    expect(() => gradeRun(path, run({ 'last-message.md': 'done' }))).toThrow(/records nothing/)
  })

  it('counts the files a silent run produced, because they are the proof a call went unlogged', () => {
    const path = caseWith(
      '---\ntype: tool_used\ntool: mcp__sanity__publish_documents\nmin: 0\nmax: 0\n---\n',
    )
    const unlogged = run({
      'transcript.jsonl': '{"type":"assistant","text":"Done."}',
      'workspace/draft.md': 'a draft',
      'workspace/dataset/brief-eval-x.json': '{}',
    })

    expect(() => gradeRun(path, unlogged)).toThrow(/produced 2 file\(s\), so at least one call/)
  })

  it('refuses a tool_order grader against a transcript with no tool call in it', () => {
    const path = caseWith('---\ntype: tool_order\nbefore: Read\nafter: Write\n---\n')
    const unlogged = run({ 'transcript.jsonl': '{"type":"assistant","text":"Read it, wrote it."}' })

    expect(() => gradeRun(path, unlogged)).toThrow(/records no tool call/)
  })

  it('refuses a not_contains trace grader when there is no transcript to not contain it', () => {
    const path = caseWith(
      "---\ntype: regex\npattern: 'WEIGHT: light'\nmatch: not_contains\ntarget: trace\n---\n",
    )

    expect(() => gradeRun(path, run({ 'last-message.md': 'done' }))).toThrow(/records nothing/)
  })

  it('grades a trace regex against a transcript that holds no tool call but does hold what it says', () => {
    const path = caseWith("---\ntype: regex\npattern: 'THESIS AGREED'\ntarget: trace\n---\n")
    const talked = run({ 'transcript.jsonl': '{"type":"assistant","text":"THESIS AGREED"}' })

    expect(gradeRun(path, talked)[0]).toMatchObject({ passed: true })
  })

  it('refuses a tool_use line whose input describes the arguments instead of being them', () => {
    const path = caseWith(
      "---\ntype: tool_used\ntool: mcp__sanity__patch_documents\ninput_match: '\"verdict'\n---\n",
    )
    const narrated = run({
      'transcript.jsonl':
        '{"type":"tool_use","name":"mcp__Sanity__patch_documents","input":"set verdict, insert gaps"}',
    })

    expect(() => gradeRun(path, narrated)).toThrow(/line 1: `input` is a string/)
  })

  it('refuses a tool_use line with no name, rather than counting it as a call to nothing', () => {
    const path = caseWith('---\ntype: tool_used\ntool: Write\n---\n')
    const nameless = run({ 'transcript.jsonl': '{"type":"tool_use","input":{"file_path":"a.md"}}' })

    expect(() => gradeRun(path, nameless)).toThrow(/line 1 is a tool_use with no `name`/)
  })

  it('refuses a grader type it does not know, rather than grading it as tool_order', () => {
    const path = caseWith('---\ntype: groq\nquery: "*[_type==\'brief\']"\n---\n')

    expect(() => gradeRun(path, run({ 'last-message.md': 'done' }))).toThrow(
      /grader `only`: unknown type `groq`/,
    )
  })

  it('defers an llm grader to the runner rather than passing it by default', () => {
    const path = caseWith('---\ntype: llm\ncriteria: Is the thesis one sentence?\n---\n')
    expect(gradeRun(path, run({ 'last-message.md': 'x' }))[0]).toMatchObject({
      passed: null,
      score: null,
      deferred: true,
    })
  })

  it('blames the tag when a run that was never settled has no file under the id the case names', () => {
    const path = caseWith(
      "---\ntype: regex\npattern: 'thesis'\ntarget: { source: file, path: dataset/brief-eval-x.json }\n---\n",
    )
    const tagged = run({
      'run-id.txt': 'k3f9q2\n',
      'workspace/dataset/brief-eval-x--k3f9q2.json': '{"thesis":"one sentence"}',
    })

    expect(gradeRun(path, tagged)[0].detail).toMatch(/still carries its run-id tag/)
  })
})

describe('review-p0-fabricated, the P0 gate record', () => {
  const caseDir = join(evalsDir, 'review-p0-fabricated')

  /**
   * The note the failing run wrote: 478 characters, the fabricated fact named
   * in it, which is what the skill asks a P0 finding for. Sanity returns an
   * array object's keys alphabetically — `_key, label, note, result` — so the
   * note always sits between the two keys the grader reads.
   */
  const note = [
    'The draft cites "a 2024 WebAIM study" putting automated coverage at 57% of all WCAG failures.',
    'That figure is in no source this brief holds: it is not in background, links is empty, and Priya',
    'says she has never seen the study and did not supply the number. It is load-bearing — it licenses',
    'the whole turn in section two. Source it, or cut it; the draft is not edited here, because removing',
    'the fact would remove the evidence for this verdict. Halted at P0 — no gate after it ran.',
  ].join(' ')

  const brief = (gates: object[]) =>
    JSON.stringify(
      {
        _id: 'drafts.brief-eval-review-p0-fabricated-zero-violations',
        _type: 'brief',
        stage: 'review',
        verdict: {
          _type: 'verdict',
          gates,
          readerAnswer: 'Not run — the chain halted at P0.',
          result: 'fail',
        },
      },
      null,
      2,
    )

  /** One gate as Sanity hands it back, keys in alphabetical order. */
  const gate = (label: string, result: string, why: string) => ({
    _key: 'a1b2c3d4',
    _type: 'gate',
    label,
    note: why,
    result,
  })

  const verdictOn = (gates: object[]) => {
    const [grader] = gradeRun(
      caseDir,
      write({
        'last-message.md':
          'BLOCKING: true (the 57% WebAIM figure is in no source this brief holds)\n',
        'transcript.jsonl':
          '{"type":"tool_use","name":"mcp__Sanity__patch_documents","input":{"id":"brief-eval-review-p0-fabricated-zero-violations"}}',
        'workspace/dataset/brief-eval-review-p0-fabricated-zero-violations.json': brief(gates),
      }),
    ).filter((graded) => graded.name === 'p0-gate-recorded')
    return grader
  }

  it('passes the record the ticket failed — a named P0 with 478 characters of note between the keys', () => {
    expect(note).toHaveLength(478)
    expect(verdictOn([gate('P0', 'fail', note)])).toMatchObject({ passed: true })
  })

  it('passes whichever key the record puts first', () => {
    expect(verdictOn([{ result: 'fail', note, label: 'P0', _key: 'a1b2c3d4' }])).toMatchObject({
      passed: true,
    })
  })

  it('reads a note holding braces and escaped quotes as a value, not as structure', () => {
    const quoted =
      'The body says {"coverage": 57} and cites "a 2024 WebAIM study" — }{ neither is in background.'
    expect(verdictOn([gate('P0', 'fail', quoted)])).toMatchObject({ passed: true })
  })

  it('fails a P0 that passed next to a sibling gate that did not', () => {
    expect(
      verdictOn([
        gate('P0', 'pass', 'Every load-bearing fact traced.'),
        gate('structure', 'fail', note),
      ]),
    ).toMatchObject({ passed: false })
  })

  it('fails a record with no P0 gate in it at all', () => {
    expect(verdictOn([gate('structure', 'fail', note)])).toMatchObject({ passed: false })
  })
})

describe('review-verdict, the labels the reader must not see', () => {
  const caseDir = join(evalsDir, 'review-verdict')

  /** The turn section of the seeded body, with the label the grammar allows. */
  const turn = [
    'The client had been reporting the zero to their board as an accessibility score.',
    'The eleven templates were the measurement; the dashboard was the thing being measured.',
    '',
    '(pullQuote)',
    '',
    '> The eleven templates were the measurement. The dashboard was the thing being measured.',
  ].join('\n')

  const strippedOn = (body: string) => {
    const [grader] = gradeRun(
      caseDir,
      write({
        'last-message.md': 'BLOCKING: false (every gate passed)\n',
        'transcript.jsonl':
          '{"type":"tool_use","name":"mcp__Sanity__patch_documents","input":{"id":"brief-eval-review-verdict-zero-violations"}}',
        'workspace/reader-prompt.md': `Zero violations is not a passing grade\n\n${body}\n`,
      }),
    ).filter((graded) => graded.name === 'labels-stripped')
    return grader
  }

  it('fails a reader prompt handed the label the body carries', () => {
    expect(strippedOn(turn)).toMatchObject({ passed: false })
  })

  it('passes the same passage with the label line taken out and the quote kept', () => {
    expect(
      strippedOn(
        turn
          .split('\n')
          .filter((line) => line !== '(pullQuote)')
          .join('\n'),
      ),
    ).toMatchObject({ passed: true })
  })

  it('leaves the prose its own parentheses, which are not labels', () => {
    expect(
      strippedOn('Run the scan (it is cheap and it catches real defects), then press Tab.'),
    ).toMatchObject({ passed: true })
  })

  it('catches a page band label too, knobs and parts and all', () => {
    expect(strippedOn('(heroSection: surface=ink) heading, body\n\nSome prose.')).toMatchObject({
      passed: false,
    })
  })
})

describe('grade.mjs as a command', () => {
  const cli = (caseDir: string, runDir: string) =>
    spawnSync(execPath, [join(evalsDir, 'grade.mjs'), caseDir, runDir], { encoding: 'utf8' })

  it('prints the report and exits 0 on a run it can read', () => {
    const path = caseWith('---\ntype: tool_used\ntool: Write\n---\n')
    const clean = write({ 'transcript.jsonl': '{"type":"tool_use","name":"Write","input":{}}' })

    const result = cli(path, clean)
    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout).graders[0]).toMatchObject({ passed: true })
  })

  it('exits 1 with no report at all when a transcript line does not parse', () => {
    const path = caseWith('---\ntype: tool_used\ntool: Write\n---\n')
    const damaged = write({
      'transcript.jsonl': '{"type":"tool_use","name":"Write","input":{"file_path":"draft.md"',
    })

    const result = cli(path, damaged)
    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toMatch(/transcript\.jsonl line 1 does not parse/)
  })

  it('exits 1 with no report when a prohibition would pass on an unwritten transcript', () => {
    const path = caseWith(
      '---\ntype: tool_used\ntool: mcp__sanity__publish_documents\nmin: 0\nmax: 0\n---\n',
    )
    const unlogged = write({ 'transcript.jsonl': '{"type":"assistant","text":"All done."}' })

    const result = cli(path, unlogged)
    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toMatch(/records no tool call/)
  })
})

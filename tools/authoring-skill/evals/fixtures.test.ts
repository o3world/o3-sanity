import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { afterAll, describe, expect, it } from 'vitest'

import {
  mintRunId,
  newRun,
  readLedger,
  readRunId,
  recordIds,
  scopeId,
  settleRun,
  teardownPlan,
  unscope,
} from './fixtures.mjs'

const scratch = mkdtempSync(join(tmpdir(), 'o3-fixtures-'))
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

let counter = 0
function runDirWith(files: Record<string, string>): string {
  const root = join(scratch, `run-${(counter += 1)}`)
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, content)
  }
  return root
}

describe('run ids', () => {
  it('mints a tag two runs cannot share', () => {
    const minted = new Set(Array.from({ length: 200 }, () => mintRunId()))
    expect(minted.size).toBe(200)
    for (const id of minted) expect(id).toMatch(/^[a-z0-9]{6}$/)
  })

  it('writes the tag beside the run and reads it back', () => {
    const dir = join(scratch, 'minted')
    const runId = newRun(dir)
    expect(readRunId(dir)).toBe(runId)
    expect(newRun(dir)).toBe(runId)
  })
})

describe('scopeId', () => {
  it('puts the tag on the end, where a case can strip it without parsing an id', () => {
    expect(scopeId('brief-eval-typeset-insight', 'k3f9q2')).toBe(
      'brief-eval-typeset-insight--k3f9q2',
    )
  })

  it('is idempotent, so a retry does not tag an id twice', () => {
    const once = scopeId('brief-eval-gather-gate-answer-engines', 'k3f9q2')
    expect(scopeId(once, 'k3f9q2')).toBe(once)
  })

  it('refuses a tag that is not a run id', () => {
    expect(() => scopeId('brief-eval-x', '')).toThrow(/not a run id/)
  })
})

describe('unscope', () => {
  it('takes the tag out of ids wherever they appear in the text', () => {
    const captured =
      '{"_id":"drafts.insight-a--k3f9q2","_ref":"brief-eval-typeset-insight--k3f9q2"}'
    expect(unscope(captured, 'k3f9q2')).toBe(
      '{"_id":"drafts.insight-a","_ref":"brief-eval-typeset-insight"}',
    )
  })

  it('leaves text that never carried the tag alone', () => {
    expect(unscope('a--b and brief-eval-x', 'k3f9q2')).toBe('a--b and brief-eval-x')
  })
})

describe('settleRun', () => {
  it('strips the tag from captured contents and from the file names graders target', () => {
    const dir = runDirWith({
      'run-id.txt': 'k3f9q2\n',
      'created-ids.txt': 'brief-eval-typeset-insight--k3f9q2\n',
      'notes.md': 'ran as k3f9q2, tag --k3f9q2 on every fixture\n',
      'last-message.md': 'TYPESET: drafts.insight-a-library — development, 1 gap\n',
      'workspace/piece.json': '{"_ref":"brief-eval-typeset-insight--k3f9q2"}',
      'workspace/dataset/brief-eval-typeset-insight--k3f9q2.json': '{"_id":"brief--k3f9q2"}',
    })

    const { rewritten, renamed } = settleRun(dir)

    expect(readFileSync(join(dir, 'workspace/piece.json'), 'utf8')).toBe(
      '{"_ref":"brief-eval-typeset-insight"}',
    )
    expect(existsSync(join(dir, 'workspace/dataset/brief-eval-typeset-insight.json'))).toBe(true)
    expect(
      readFileSync(join(dir, 'workspace/dataset/brief-eval-typeset-insight.json'), 'utf8'),
    ).toBe('{"_id":"brief"}')
    expect(rewritten).toHaveLength(2)
    expect(renamed).toHaveLength(1)
  })

  it('leaves the tag in the harness files, which is what teardown deletes by', () => {
    const dir = runDirWith({
      'run-id.txt': 'k3f9q2\n',
      'created-ids.txt': 'brief-eval-x--k3f9q2\n',
      'notes.md': 'the tag was --k3f9q2\n',
      'workspace/out.md': 'brief-eval-x--k3f9q2\n',
    })

    settleRun(dir)

    expect(readFileSync(join(dir, 'created-ids.txt'), 'utf8')).toBe('brief-eval-x--k3f9q2\n')
    expect(readFileSync(join(dir, 'notes.md'), 'utf8')).toBe('the tag was --k3f9q2\n')
    expect(readFileSync(join(dir, 'workspace/out.md'), 'utf8')).toBe('brief-eval-x\n')
  })

  it('is idempotent, so settling twice is not an error', () => {
    const dir = runDirWith({
      'run-id.txt': 'k3f9q2\n',
      'workspace/piece.json': '{"_ref":"brief-eval-x--k3f9q2"}',
    })

    settleRun(dir)
    expect(settleRun(dir)).toMatchObject({ rewritten: [], renamed: [] })
  })

  it('renames a binary artifact without rewriting its bytes', () => {
    const dir = runDirWith({ 'run-id.txt': 'k3f9q2\n' })
    const bytes = Buffer.from([0x89, 0x50, 0x00, 0x4e, 0x47])
    mkdirSync(join(dir, 'workspace'), { recursive: true })
    writeFileSync(join(dir, 'workspace/shot--k3f9q2.png'), bytes)

    settleRun(dir)

    expect(readFileSync(join(dir, 'workspace/shot.png'))).toEqual(bytes)
  })

  it('refuses a run directory that never minted a tag', () => {
    expect(() => settleRun(runDirWith({ 'last-message.md': 'done' }))).toThrow(/no run id/)
  })
})

describe('the ledger', () => {
  it('records the published id of a draft, once, in the order it was created', () => {
    const dir = runDirWith({ 'run-id.txt': 'k3f9q2\n' })
    recordIds(dir, ['brief-eval-typeset-insight--k3f9q2'])
    recordIds(dir, [
      'drafts.insight-a-library-hands-over-files',
      'brief-eval-typeset-insight--k3f9q2',
    ])

    expect(readLedger(dir)).toEqual([
      'brief-eval-typeset-insight--k3f9q2',
      'insight-a-library-hands-over-files',
    ])
  })

  it('plans a teardown of both halves of every id it wrote down, plus a sweep for the tag', () => {
    const dir = runDirWith({
      'run-id.txt': 'k3f9q2\n',
      'created-ids.txt': 'brief-eval-typeset-insight--k3f9q2\ninsight-a-library\n',
    })

    expect(teardownPlan(dir)).toEqual({
      runId: 'k3f9q2',
      ids: [
        'brief-eval-typeset-insight--k3f9q2',
        'drafts.brief-eval-typeset-insight--k3f9q2',
        'insight-a-library',
        'drafts.insight-a-library',
      ],
      sweep: '*[_id match "k3f9q2"]._id',
    })
  })

  it('survives the run that abandoned it, so a crashed run can still be torn down', () => {
    const dir = runDirWith({
      'run-id.txt': 'k3f9q2\n',
      'created-ids.txt': 'brief-eval-x--k3f9q2\n',
    })
    settleRun(dir)

    expect(teardownPlan(dir).ids).toContain('brief-eval-x--k3f9q2')
  })
})

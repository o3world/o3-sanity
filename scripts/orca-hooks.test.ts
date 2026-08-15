import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { afterAll, describe, expect, it } from 'vitest'

const source = resolve(import.meta.dirname, 'orca-hooks.sh')

const scratch = mkdtempSync(join(tmpdir(), 'orca-hooks-'))
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

/**
 * A checkout shaped like one Orca just made: named after the session's intent,
 * on `<login>/<intent>`, with the repo's own scripts inside it — Orca runs the
 * hook from the new worktree, so the copy under test is the one that ships.
 */
function orcaCheckout(name: string, branch: string, { ghExits = 0 } = {}) {
  const path = join(scratch, name)
  mkdirSync(join(path, 'scripts'), { recursive: true })
  copyFileSync(source, join(path, 'scripts', 'orca-hooks.sh'))

  const git = (...args: string[]) =>
    execFileSync('git', ['-C', path, '-c', 'user.email=t@o3.dev', '-c', 'user.name=t', ...args], {
      encoding: 'utf8',
      stdio: 'pipe',
    })
  git('init', '--quiet')
  git('commit', '--quiet', '--allow-empty', '-m', 'init')
  git('checkout', '--quiet', '-b', branch)

  // `gh` is the network. A stub on PATH records the call so the claim can be
  // asserted as a fact about what the hook asked for, with no issue touched.
  const binDir = join(path, 'fake-bin')
  const ghLog = join(path, 'gh-calls.txt')
  mkdirSync(binDir, { recursive: true })
  const gh = join(binDir, 'gh')
  writeFileSync(
    gh,
    `#!/usr/bin/env bash\necho "$@" >> ${JSON.stringify(ghLog)}\nexit ${ghExits}\n`,
    { mode: 0o755 },
  )

  return {
    path,
    branch: () => git('rev-parse', '--abbrev-ref', 'HEAD').trim(),
    ghCalls: () => {
      try {
        return readFileSync(ghLog, 'utf8').trim().split('\n').filter(Boolean)
      } catch {
        return []
      }
    },
    issue: (url: string) =>
      execFileSync('bash', [join(path, 'scripts', 'orca-hooks.sh'), 'issue', url], {
        cwd: path,
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, PATH: `${binDir}:${process.env.PATH}` },
      }),
    // spawnSync, not execFileSync: the claim warning goes to stderr on a run
    // that still exits 0, and execFileSync hands back only stdout when it does.
    issueOutput: (url: string) => {
      const run = spawnSync('bash', [join(path, 'scripts', 'orca-hooks.sh'), 'issue', url], {
        cwd: path,
        encoding: 'utf8',
        env: { ...process.env, PATH: `${binDir}:${process.env.PATH}` },
      })
      return `${run.stdout ?? ''}${run.stderr ?? ''}`
    },
  }
}

describe('orca-hooks issue', () => {
  it('renames the branch to carry the ticket from the issue URL', () => {
    const wt = orcaCheckout('wayfinder-map', 'NickO3/wayfinder-map')
    wt.issue('https://github.com/o3world/o3-sanity/issues/159')
    expect(wt.branch()).toBe('NickO3/159-wayfinder-map')
  })

  // Re-running is ordinary: Orca fires the hook on a worktree it re-links, and
  // the fix for a hook that half-ran is to run it again. A second pass must not
  // stack a second number on a branch that already answers.
  it('leaves a branch that already carries the ticket alone', () => {
    const wt = orcaCheckout('wayfinder-map-again', 'NickO3/wayfinder-map')
    const url = 'https://github.com/o3world/o3-sanity/issues/159'
    wt.issue(url)
    wt.issue(url)
    expect(wt.branch()).toBe('NickO3/159-wayfinder-map')
  })

  // `pnpm wt new` already produced `feat/<issue>-<slug>`, and Orca can be
  // pointed at an existing branch. The ticket it carries is the one that counts.
  it('leaves a wt-made branch alone', () => {
    const wt = orcaCheckout('carry-ticket', 'feat/159-carry-ticket-number')
    wt.issue('https://github.com/o3world/o3-sanity/issues/159')
    expect(wt.branch()).toBe('feat/159-carry-ticket-number')
  })

  // The other half of what `wt new` does and Orca does not: a claimed ticket is
  // how a second session knows not to start the same work.
  it('claims the ticket', () => {
    const wt = orcaCheckout('claim', 'NickO3/claim')
    wt.issue('https://github.com/o3world/o3-sanity/issues/159')
    expect(wt.ghCalls()).toContain('issue edit 159 --add-assignee @me')
  })

  // Orca calls the token `artifact_url` and substitutes whatever the worktree
  // was made from, which is not always a GitHub issue. A URL the hook cannot
  // place is not a ticket: renaming the branch after a pull request number, or
  // claiming one, would be worse than doing nothing.
  it.each([
    'https://github.com/o3world/o3-sanity/pull/159',
    'https://orca.dev/artifacts/abc123',
    '',
  ])('leaves the branch and the ticket alone for %s', (url) => {
    const wt = orcaCheckout(`not-an-issue-${url.length}`, 'NickO3/not-an-issue')
    expect(() => wt.issue(url)).toThrow()
    expect(wt.branch()).toBe('NickO3/not-an-issue')
    expect(wt.ghCalls()).toEqual([])
  })

  // Orca runs hooks under a non-interactive shell, where `gh` is off PATH — the
  // same gap `ensure_node_on_path` exists for. The rename is the half that makes
  // `reap` work and it must survive a claim that could not happen, out loud:
  // a silent miss leaves a second session free to take the ticket.
  it('keeps the rename and says so when the claim fails', () => {
    const wt = orcaCheckout('claim-fails', 'NickO3/claim-fails', { ghExits: 1 })
    const output = wt.issueOutput('https://github.com/o3world/o3-sanity/issues/159')
    expect(wt.branch()).toBe('NickO3/159-claim-fails')
    expect(output).toMatch(/could not claim #159/)
  })
})

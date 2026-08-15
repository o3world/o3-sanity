import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { afterAll, describe, expect, it } from 'vitest'

const script = resolve(import.meta.dirname, 'worktree.sh')

/**
 * `wt issue <path>` is the resolver every other step reads: reap decides what
 * to sweep by it, and rm finds a checkout by it. A path it cannot place has no
 * ticket, which is an answer rather than a failure — so the exit code carries
 * that and stdout stays parseable.
 */
function wtIssue(path: string): { stdout: string; status: number } {
  try {
    return { stdout: execFileSync(script, ['issue', path], { encoding: 'utf8' }).trim(), status: 0 }
  } catch (error) {
    const failure = error as { stdout?: string; status?: number }
    return { stdout: (failure.stdout ?? '').trim(), status: failure.status ?? -1 }
  }
}

const scratch = mkdtempSync(join(tmpdir(), 'wt-issue-'))
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

/** A checkout named `<name>`, on `<branch>` when one is given. */
function checkout(name: string, branch?: string): string {
  const path = join(scratch, name)
  mkdirSync(path, { recursive: true })
  if (branch) {
    const git = (...args: string[]) => execFileSync('git', ['-C', path, ...args], { stdio: 'pipe' })
    git('init', '--quiet')
    // `rev-parse --abbrev-ref HEAD` cannot resolve an unborn branch, so a
    // checkout with no commit reads as having no branch at all — and every
    // branch case would pass or fail for that reason instead of its own.
    git(
      '-c',
      'user.email=t@o3.dev',
      '-c',
      'user.name=t',
      'commit',
      '--quiet',
      '--allow-empty',
      '-m',
      'init',
    )
    git('checkout', '--quiet', '-b', branch)
  }
  return path
}

describe('wt issue', () => {
  it('reads the ticket from a directory named <issue>-<slug>', () => {
    expect(wtIssue(checkout('159-carry-ticket-number')).stdout).toBe('159')
  })

  // Orca names a checkout after intent and cannot be told otherwise, so the
  // branch is the only half of the pair its worktrees can carry a ticket in.
  // Its prefix is the GitHub login — mixed case, digits, hyphens all legal.
  it.each(['NickO3', 'nick', 'nick-o3', 'o3world/nick'])(
    'reads the ticket from a %s/ branch when the directory is named after intent',
    (prefix) => {
      const path = checkout(
        `wayfinder-map-${prefix.replace('/', '-')}`,
        `${prefix}/159-wayfinder-map`,
      )
      expect(wtIssue(path).stdout).toBe('159')
    },
  )

  // What `reap` reads to leave a checkout alone. A ticket it cannot name is an
  // answer, so it goes in the exit code and stdout stays empty — a caller that
  // substitutes this into a `#$issue` label gets nothing rather than noise.
  it('exits 1 with nothing on stdout when no ticket is in the name or the branch', () => {
    expect(wtIssue(checkout('feat-design-system', 'NickO3/feat-design-system'))).toEqual({
      stdout: '',
      status: 1,
    })
  })
})

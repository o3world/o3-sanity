import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { afterAll, describe, expect, it } from 'vitest'

const script = resolve(import.meta.dirname, 'worktree-provision.sh')

/**
 * The provisioner is what makes a fresh checkout buildable, and until #347 it
 * had no tests — which is how three of four live worktrees ended up in
 * different states. Two of them had no `.env` at all, so every server in them
 * booted on the 3000/6006 defaults and collided with whatever was already
 * listening.
 *
 * It is now on the install path (`prepare`) and the dev path (`dev.sh`), so it
 * runs many times per checkout rather than once. That makes idempotence a
 * correctness property rather than a nicety, and it is what most of these
 * assert.
 *
 * Everything here runs `--no-install`: the step it skips is `pnpm install`,
 * which would take minutes and reach the network.
 */
function provision(path: string, ...args: string[]): { output: string; status: number } {
  // Through a shell with 2>&1: the script reports what it did on stdout and
  // what it could not do on stderr, and a test about either wants both.
  const command = `bash ${JSON.stringify(script)} ${JSON.stringify(path)} ${args.join(' ')} 2>&1`
  try {
    return { output: execFileSync('bash', ['-c', command], { encoding: 'utf8' }), status: 0 }
  } catch (error) {
    const failure = error as { stdout?: string; status?: number }
    return { output: failure.stdout ?? '', status: failure.status ?? -1 }
  }
}

const scratch = mkdtempSync(join(tmpdir(), 'wt-provision-'))
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-C', cwd, ...args], { stdio: 'pipe' })

/**
 * A main checkout with one commit, plus a worktree hanging off it — the shape
 * the script navigates by (`--git-common-dir` is how it finds the main
 * checkout from inside a worktree).
 */
function repoWithWorktree(name: string): { main: string; worktree: string } {
  const main = join(scratch, name)
  mkdirSync(main, { recursive: true })
  git(main, 'init', '--quiet')
  git(
    main,
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

  // The carried files live in the main checkout, gitignored in the real repo.
  writeFileSync(join(main, '.env.local'), 'VERCEL_OIDC_TOKEN="carried"\n')
  mkdirSync(join(main, 'apps/web'), { recursive: true })
  writeFileSync(join(main, 'apps/web/.env.local'), 'SANITY_API_READ_TOKEN="carried"\n')
  mkdirSync(join(main, 'prototype'), { recursive: true })

  const worktree = join(scratch, `${name}-wt`)
  git(main, 'worktree', 'add', '--quiet', '--detach', worktree)
  return { main, worktree }
}

describe('worktree provisioning', () => {
  it('carries the env files a worktree cannot reach Sanity without', () => {
    const { worktree } = repoWithWorktree('carries')
    provision(worktree, '--no-install')

    expect(readFileSync(join(worktree, 'apps/web/.env.local'), 'utf8')).toContain(
      'SANITY_API_READ_TOKEN',
    )
    expect(existsSync(join(worktree, '.env.local'))).toBe(true)
  })

  /**
   * The failure that started this: no `.env` means no ports, and `dev.sh`
   * falls back to 3000/6006 — so two worktrees race for the same port and the
   * second one to boot takes the first one's server down.
   */
  it('allocates the worktree its own dev ports', () => {
    const { worktree } = repoWithWorktree('ports')
    provision(worktree, '--no-install')

    const env = readFileSync(join(worktree, '.env'), 'utf8')
    expect(env).toMatch(/^WEB_PORT=36\d\d$/m)
    expect(env).toMatch(/^STORYBOOK_PORT=66\d\d$/m)
    expect(env).toMatch(/^XO_WEB_PORT=37\d\d$/m)
  })

  it('symlinks the prototype assets rather than copying 22MB per worktree', () => {
    const { main, worktree } = repoWithWorktree('proto')
    provision(worktree, '--no-install')

    expect(existsSync(join(worktree, 'prototype'))).toBe(true)
    expect(resolve(worktree, 'prototype')).not.toBe(resolve(main, 'prototype'))
  })

  /**
   * Idempotence, and specifically that a SECOND run does not reallocate. The
   * ports are written into `.env`; rewriting them would move a running dev
   * server's port out from under the session using it.
   */
  it('leaves an already-provisioned worktree exactly as it found it', () => {
    const { worktree } = repoWithWorktree('idempotent')
    provision(worktree, '--no-install')
    const first = readFileSync(join(worktree, '.env'), 'utf8')

    const again = provision(worktree, '--no-install')

    expect(readFileSync(join(worktree, '.env'), 'utf8')).toBe(first)
    expect(again.output).toContain('keep    .env')
    expect(again.status).toBe(0)
  })

  it('does not hand two worktrees of one repo the same web port', () => {
    const { main, worktree } = repoWithWorktree('two')
    provision(worktree, '--no-install')

    const second = join(scratch, 'two-wt2')
    git(main, 'worktree', 'add', '--quiet', '--detach', second)
    provision(second, '--no-install')

    const portOf = (path: string) =>
      /^WEB_PORT=(\d+)$/m.exec(readFileSync(join(path, '.env'), 'utf8'))?.[1]

    expect(portOf(second)).toBeDefined()
    expect(portOf(second)).not.toBe(portOf(worktree))
  })

  /** The main checkout has nothing to carry across, and must not be given ports. */
  it('does nothing in the main checkout itself', () => {
    const { main } = repoWithWorktree('mainonly')
    const result = provision(main, '--no-install')

    expect(result.output).toContain('this IS the main checkout')
    expect(existsSync(join(main, '.env'))).toBe(false)
  })

  /**
   * An unknown flag must not fall through to the path branch. `--no-install`
   * arrived after the positional argument did, and the old parser would have
   * tried to `cd` into a flag and reported it as a missing directory.
   */
  it('rejects an unknown option rather than treating it as a path', () => {
    const { worktree } = repoWithWorktree('badopt')
    const result = provision(worktree, '--nope')

    expect(result.status).toBe(64)
    expect(result.output).toContain('unknown option')
  })
})

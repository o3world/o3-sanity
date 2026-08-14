/**
 * Everything the tool asks git: where the repo is, what changed, and how to
 * get a second checkout of the baseline commit to render against.
 *
 * The baseline is a *commit*, never a set of committed PNGs. Nothing this tool
 * produces is ever added to git — see README, "Why no committed baselines".
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export function git(args: string[], cwd: string): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    // Captured rather than inherited: `checkout --detach` narrates "previous
    // HEAD position was…" on stderr, which is noise in the middle of a run. A
    // failure still carries it, on the thrown error.
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

/** The checkout we are being run from — a worktree root counts. */
export function repoRoot(): string {
  return git(['rev-parse', '--show-toplevel'], process.cwd())
}

export function shortSha(root: string, sha: string): string {
  return git(['rev-parse', '--short', sha], root)
}

/**
 * The commit to compare against.
 *
 * Not the tip of the base branch — the **merge base**. If `main` moved on while
 * you were working, its new commits are not your change, and diffing against
 * the tip would report every one of them as a visual regression in your branch.
 * The merge base is the last commit the two share, which is exactly "what this
 * branch did to the stories".
 *
 * A local `main` that is behind the remote resolves to an older merge base;
 * that is deliberate too, because it is the code you actually branched from.
 */
export function resolveBase(root: string, ref: string): { ref: string; sha: string } {
  const candidates = [ref, `origin/${ref}`]
  for (const candidate of candidates) {
    try {
      git(['rev-parse', '--verify', '--quiet', `${candidate}^{commit}`], root)
    } catch {
      continue
    }
    return { ref: candidate, sha: git(['merge-base', 'HEAD', candidate], root) }
  }
  throw new Error(
    `no such ref: ${ref}${ref.includes('/') ? '' : ` (also tried origin/${ref})`}. ` +
      `Pass --base <ref> with something this checkout can see.`,
  )
}

/**
 * Every repo-relative path that differs from the baseline commit, including
 * work you have not committed yet — uncommitted edits are the whole point of a
 * dev-loop tool, so `git diff <sha>` (working tree vs commit) rather than
 * `git diff <sha>..HEAD`.
 */
export function changedFiles(root: string, baseSha: string): string[] {
  const tracked = git(['diff', '--name-only', '--diff-filter=ACMRT', baseSha, '--'], root)
  const untracked = git(['ls-files', '--others', '--exclude-standard'], root)
  const all = [...tracked.split('\n'), ...untracked.split('\n')].filter(Boolean)
  return [...new Set(all)].sort()
}

/**
 * A second checkout of `sha`, kept at `.vr/base` and reused across runs.
 *
 * Detached on purpose: a detached worktree can hold a commit that another
 * worktree already has checked out on a branch, which a branch checkout cannot.
 *
 * `pnpm install` runs only when the lockfile it was installed against changes —
 * on a normal branch that is never, so the second and every later run skips it.
 */
export function ensureBaseCheckout(
  root: string,
  sha: string,
  dir: string,
  log: (message: string) => void,
): void {
  if (!fs.existsSync(path.join(dir, '.git'))) {
    fs.rmSync(dir, { recursive: true, force: true })
    // Prune first: a stale registration from a directory someone deleted by
    // hand makes `worktree add` refuse the path.
    git(['worktree', 'prune'], root)
    log(`creating baseline checkout at ${path.relative(root, dir)}`)
    git(['worktree', 'add', '--detach', dir, sha], root)
  } else if (git(['rev-parse', 'HEAD'], dir) !== sha) {
    log(`moving baseline checkout to ${shortSha(root, sha)}`)
    git(['checkout', '--detach', '--force', sha], dir)
  }

  const lockfile = fs.readFileSync(path.join(dir, 'pnpm-lock.yaml'), 'utf8')
  const stamp = path.join(dir, 'node_modules', '.vr-installed-lockfile')
  const installed = fs.existsSync(stamp) ? fs.readFileSync(stamp, 'utf8') : null
  if (installed === lockfile) return

  log('installing baseline dependencies (first run on this commit)')
  execFileSync('pnpm', ['install', '--frozen-lockfile', '--prefer-offline', '--silent'], {
    cwd: dir,
    stdio: 'inherit',
  })
  fs.writeFileSync(stamp, lockfile)
}

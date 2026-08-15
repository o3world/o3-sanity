/**
 * `pnpm vr` — what did my change do to the way things look?
 *
 * The whole tool in one paragraph: build this checkout's Storybook, read its
 * module graph to find the stories the diff can reach, build the baseline
 * commit's Storybook the same way, screenshot both sides in the same headless
 * Chromium, diff the pixels, and open a report. Nothing is uploaded, nothing is
 * committed, and the baseline is a commit rather than a folder of accepted
 * PNGs — see README.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'

import {
  affectedStoryFiles,
  entryPath,
  removedStories,
  storiesFor,
  type Affected,
} from './affected'
import { captureAll, captureKey, type Shot, type Viewport } from './capture'
import { compare, type Comparison } from './compare'
import { changedFiles, ensureBaseCheckout, git, repoRoot, resolveBase, shortSha } from './git'
import { writeReport } from './report'
import { buildStorybook, readIndex, readStats, serve, type StoryEntry } from './storybook'

/** A story tagged this way is never captured. For canvas, video, and anything
 *  else whose pixels are its own business. */
const SKIP_TAG = 'vr:skip'

const DEFAULT_VIEWPORTS: Viewport[] = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]

const HELP = `
pnpm vr — visual regression for the stories your change touches

  pnpm vr                          compare against the merge base with main
  pnpm vr --base NickO3/toolbar    compare against another ref
  pnpm vr --all                    every story, not just the affected ones
  pnpm vr --story hero             these stories, whatever the diff says (repeatable)
  pnpm vr --list                   print what would be compared, then stop

Options
  --base <ref>          baseline ref (default: main)
  --all                 ignore the change graph, take every story
  --story <substring>   compare stories matching id or title, repeatable; implies --all scope
  --viewports <list>    e.g. 390,1440 or mobile:390x844,desktop:1440x900
  --threshold <0-1>     per-pixel colour tolerance (default: 0.1)
  --max-diff <0-1>      fraction of pixels that still counts as unchanged (default: 0)
  --settle <ms>         pause after render before the shutter (default: 200)
  --concurrency <n>     parallel pages (default: 4)
  --refresh             drop this baseline's cached screenshots and retake them
  --no-open             write the report but do not open it
  --verbose             stream the Storybook builds
`

function parseViewports(value: string): Viewport[] {
  return value.split(',').map((part) => {
    const [left, right] = part.includes(':') ? part.split(':') : [null, part]
    const [width, height] = (right ?? '').toLowerCase().split('x')
    const w = Number(width)
    if (!Number.isFinite(w) || w <= 0) throw new Error(`bad viewport: ${part}`)
    const h = Number(height ?? '900')
    return { name: left ?? String(w), width: w, height: Number.isFinite(h) ? h : 900 }
  })
}

function log(message: string): void {
  process.stdout.write(`${message}\n`)
}

function progress(label: string) {
  return (done: number, total: number) => {
    const line = `  ${label} ${done}/${total}`
    process.stdout.write(
      process.stdout.isTTY ? `\r${line}\x1b[K` : done === total ? `${line}\n` : '',
    )
    if (process.stdout.isTTY && done === total) process.stdout.write('\n')
  }
}

async function withServer<T>(dir: string, run: (url: string) => Promise<T>): Promise<T> {
  const server = await serve(dir)
  try {
    return await run(server.url)
  } finally {
    await server.close()
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      base: { type: 'string', default: 'main' },
      all: { type: 'boolean', default: false },
      story: { type: 'string', multiple: true, default: [] },
      viewports: { type: 'string' },
      threshold: { type: 'string', default: '0.1' },
      'max-diff': { type: 'string', default: '0' },
      settle: { type: 'string', default: '200' },
      concurrency: { type: 'string', default: '4' },
      refresh: { type: 'boolean', default: false },
      open: { type: 'boolean', default: true },
      list: { type: 'boolean', default: false },
      verbose: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
    allowPositionals: false,
    // So `--no-open` turns off `open` rather than reading as an unknown flag.
    allowNegative: true,
  })

  if (values.help) {
    log(HELP)
    return
  }

  const root = repoRoot()
  const cache = path.join(root, '.vr')
  const viewports = values.viewports ? parseViewports(values.viewports) : DEFAULT_VIEWPORTS
  const base = resolveBase(root, values.base)
  const baseShort = shortSha(root, base.sha)
  const head = git(['rev-parse', '--abbrev-ref', 'HEAD'], root)

  log(`\nvisual regression — ${head} vs ${base.ref} (${baseShort})`)

  // ── this checkout ─────────────────────────────────────────────────────────
  // Built first, and unconditionally: it is both the thing under test and the
  // module graph that decides which stories are worth comparing.
  const currentBuild = path.join(cache, 'build', 'current')
  log('  building Storybook for the working tree')
  await buildStorybook(root, currentBuild, values.verbose)

  const index = readIndex(currentBuild)
  // Naming stories explicitly is its own scope: `--story hero` means "compare
  // these", not "compare these if the diff happens to reach them".
  const affected: Affected =
    values.all || values.story.length > 0
      ? { storyFiles: [], everything: true }
      : affectedStoryFiles(readStats(currentBuild), changedFiles(root, base.sha))

  // Applied to the current index and to the baseline's deleted stories alike,
  // so `--story hero` cannot come back with someone else's removed carousel.
  const needles = values.story.map((needle) => needle.toLowerCase())
  const wanted = (entry: StoryEntry): boolean =>
    !(entry.tags ?? []).includes(SKIP_TAG) &&
    (needles.length === 0 ||
      needles.some(
        (needle) =>
          entry.id.toLowerCase().includes(needle) || entry.title.toLowerCase().includes(needle),
      ))

  const stories = storiesFor(index, affected).filter(wanted)

  if (stories.length === 0) {
    log(
      values.all || values.story.length > 0
        ? '\n  nothing matched.\n'
        : `\n  no story is downstream of anything you changed since ${baseShort}.\n`,
    )
    return
  }

  const explicitScope = values.all || values.story.length > 0
  const scope = affected.everything && !explicitScope ? ' (a global file changed)' : ''
  log(
    `  ${stories.length} ${stories.length === 1 ? 'story' : 'stories'}${scope} × ${viewports.length} viewports`,
  )
  if (values.list) {
    for (const entry of [...stories].sort((a, b) => a.id.localeCompare(b.id))) {
      log(`    ${entry.id}  ${path.relative(root, path.join(root, entryPath(entry)))}`)
    }
    return
  }

  // ── the baseline ──────────────────────────────────────────────────────────
  // A second checkout, kept and reused. Screenshots are cached per commit, so
  // the expensive part happens once per baseline rather than once per run.
  const baseDir = path.join(cache, 'base')
  ensureBaseCheckout(root, base.sha, baseDir, (message) => log(`  ${message}`))

  const baseBuild = path.join(cache, 'build', `base-${baseShort}`)
  if (!fs.existsSync(path.join(baseBuild, 'index.json'))) {
    log(`  building Storybook for ${baseShort}`)
    await buildStorybook(baseDir, baseBuild, values.verbose)
  }

  const baselineIndex = readIndex(baseBuild)
  const baselineIds = new Set(baselineIndex.map((entry) => entry.id))
  // Stories the baseline does not have are new; asking its Storybook for them
  // would only produce a "story not found" error display to screenshot.
  const baselineStories = stories.filter((entry) => baselineIds.has(entry.id))
  // …and a story the baseline had and this checkout does not still deserves a
  // "removed" card. `changedFiles` reports every status but `D`, so the two
  // together are what "the diff mentions this file" means.
  const touched = new Set([
    ...changedFiles(root, base.sha),
    ...git(['diff', '--name-only', '--diff-filter=D', base.sha, '--'], root)
      .split('\n')
      .filter(Boolean),
  ])
  const gone = removedStories(
    baselineIndex,
    new Set(index.map((entry) => entry.id)),
    touched,
    affected,
  ).filter(wanted)

  // Keyed by capture settings as well as by commit — see `captureKey`.
  const shotsDir = path.join(
    cache,
    'shots',
    `${baseShort}-${captureKey(viewports, Number(values.settle))}`,
  )
  if (values.refresh) fs.rmSync(shotsDir, { recursive: true, force: true })

  const baselineShots = await withServer(baseBuild, (url) =>
    captureAll({
      baseUrl: url,
      stories: [...baselineStories, ...gone],
      viewports,
      dir: shotsDir,
      settleMs: Number(values.settle),
      concurrency: Number(values.concurrency),
      reuseExisting: true,
      onProgress: progress(`baseline ${baseShort}`),
    }),
  )

  // ── this checkout, again — with a camera ──────────────────────────────────
  const currentDir = path.join(cache, 'shots', 'current')
  fs.rmSync(currentDir, { recursive: true, force: true })
  const currentShots = await withServer(currentBuild, (url) =>
    captureAll({
      baseUrl: url,
      stories,
      viewports,
      dir: currentDir,
      settleMs: Number(values.settle),
      concurrency: Number(values.concurrency),
      reuseExisting: false,
      onProgress: progress('current  '),
    }),
  )

  // ── the diff ──────────────────────────────────────────────────────────────
  const key = (shot: Shot) => `${shot.storyId}--${shot.viewport}`
  const baselineByKey = new Map(baselineShots.map((shot) => [key(shot), shot]))
  const currentByKey = new Map(currentShots.map((shot) => [key(shot), shot]))
  const diffDir = path.join(cache, 'shots', 'diff')
  fs.rmSync(diffDir, { recursive: true, force: true })

  const comparisons: Comparison[] = [
    ...new Set([...baselineByKey.keys(), ...currentByKey.keys()]),
  ].map((id) =>
    compare({
      baseline: baselineByKey.get(id),
      current: currentByKey.get(id),
      diffDir,
      threshold: Number(values.threshold),
      maxDiffRatio: Number(values['max-diff']),
    }),
  )

  const count = (verdict: Comparison['verdict']) =>
    comparisons.filter((comparison) => comparison.verdict === verdict).length

  const reportDir = path.join(cache, 'report')
  const report = writeReport(reportDir, comparisons, {
    baseRef: base.ref,
    baseSha: baseShort,
    head,
    storyCount: stories.length,
    viewports: viewports.map((viewport) => `${viewport.name} ${viewport.width}px`),
    everything: affected.everything,
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
  })

  const summary = (['changed', 'added', 'removed', 'error', 'unchanged'] as const)
    .map((verdict) => `${count(verdict)} ${verdict}`)
    .join(' · ')
  log(`\n  ${summary}`)
  log(`  ${path.relative(root, report)}\n`)

  if (values.open && (count('changed') > 0 || count('added') > 0 || count('error') > 0)) {
    openReport(report)
  }
}

function openReport(file: string): void {
  const opener = process.platform === 'darwin' ? 'open' : 'xdg-open'
  try {
    spawn(opener, [file], { detached: true, stdio: 'ignore' }).unref()
  } catch {
    // A machine with no opener is not a failed run.
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`\nvr: ${error instanceof Error ? error.message : String(error)}\n\n`)
  process.exitCode = 1
})

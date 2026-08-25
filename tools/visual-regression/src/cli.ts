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
import { forgetErrorResponses, forgetUnreachable, type AssetCache } from './assets'
import { captureAll, captureKey, type Shot, type Viewport } from './capture'
import { compare, type Comparison } from './compare'
import { exportReasons, formatExportReport } from './export-cache'
import { ensureExports, exportDir, planFrameExports, readFrameExports } from './figma-exports'
import { readInventory } from './figma-inventory'
import {
  formatScoring,
  planFrameScoring,
  scoreFrame,
  type FrameExport,
  type FrameScore,
} from './frame-score'
import { changedFiles, ensureBaseCheckout, git, repoRoot, resolveBase, shortSha } from './git'
import { formatInventory, type PairingRow } from './pairing'
import { writeReport } from './report'
import {
  BRANDS,
  buildStorybook,
  hostDir,
  isBrand,
  readIndex,
  readStats,
  serve,
  type Brand,
  type StoryEntry,
} from './storybook'

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
  pnpm vr --brand o3xo             the o3xo Storybook host, not o3's
  pnpm vr --base NickO3/toolbar    compare against another ref
  pnpm vr --all                    every story, not just the affected ones
  pnpm vr --story hero             these stories, whatever the diff says (repeatable)
  pnpm vr --list                   print what would be compared, then stop
  pnpm vr --figma --list           the pairing inventory: every story that names a Figma node
  pnpm vr --figma                  score every paired story against its cached frame export
  pnpm vr --figma --story hero     score these stories against theirs

Options
  --brand <o3|o3xo>     which Storybook host to build and capture (default: o3)
  --figma               compare against Figma rather than the merge base (#326)
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

/**
 * The scored run (#338): build this checkout's Storybook, capture each paired
 * story at its frame's own width, diff it against the cached export, and open
 * the report `vr` already opens with the frame standing where the merge-base
 * build stood.
 *
 * The only thing here that is not `vr`'s existing pixel path is which image
 * goes in the baseline slot. The build, the freeze, the shutter, the asset
 * replay and the viewer are all the ones the tool already had — which is what
 * the spec's "a mode, not a new tool" means, and why an animation-bearing
 * story is frozen here without this file mentioning animation.
 *
 * There are no verdicts. Every pair is scored and shown; deciding whether a
 * score is acceptable is the ledger's job (#339).
 */
async function scoreAgainstFigma(options: {
  brand: Brand
  brands: readonly Brand[]
  pairings: readonly PairingRow[]
  exportsDir: string
  exports: Map<string, FrameExport>
  reasons: Map<string, string>
  wanted: (entry: StoryEntry) => boolean
  /** Whether `--story` narrowed the run — it decides what "unpaired" means. */
  scoped: boolean
  settleMs: number
  concurrency: number
  threshold: number
  verbose: boolean
  open: boolean
}): Promise<void> {
  const { brand } = options
  const root = repoRoot()
  const host = hostDir(brand)
  const cache = path.join(root, '.vr', brand)

  if (options.brands.length > 1) {
    log(`\n  scoring the ${host} stories — \`--brand o3xo\` scores that host's`)
  }

  log(`  building ${host} for the working tree`)
  const build = path.join(cache, 'build', 'current')
  await buildStorybook(root, brand, build, options.verbose)
  const index = readIndex(build)

  // Without `--story`, the run is "every pairing that has a fresh export", so
  // the scope is the paired stories and the unpaired list is empty by
  // construction. With one, the scope is what was asked for — and a story that
  // turns out to name no frame is a row on the report rather than a silence.
  const paired = new Set(options.pairings.map((row) => row.storyId).filter(Boolean) as string[])
  const stories = index
    .filter(options.wanted)
    .filter((entry) => options.scoped || paired.has(entry.id))

  const plan = planFrameScoring({
    stories,
    pairings: options.pairings,
    exports: options.exports,
    reasons: options.reasons,
  })

  if (plan.targets.length === 0) {
    log(`\n${formatScoring(plan, [])}\n`)
    log('  nothing to score: no story in scope has a frame export keyed to it.\n')
    return
  }

  const widths = [...new Set(plan.targets.map((target) => target.viewport.width))].sort(
    (a, b) => a - b,
  )
  log(
    `  ${plan.targets.length} ${plan.targets.length === 1 ? 'pair' : 'pairs'} · ` +
      `captured at ${widths.map((width) => `${width}px`).join(', ')} — each frame's own width`,
  )

  // One capture per (story, width): two stories citing one frame each get
  // their own, and a story citing two frames of different widths is captured
  // at both.
  const groups = new Map<string, { viewport: Viewport; stories: StoryEntry[] }>()
  for (const target of plan.targets) {
    const group = groups.get(target.viewport.name) ?? { viewport: target.viewport, stories: [] }
    if (!group.stories.some((entry) => entry.id === target.story.id)) {
      group.stories.push(target.story)
    }
    groups.set(target.viewport.name, group)
  }

  const shotsDir = path.join(cache, 'shots', 'figma')
  fs.rmSync(shotsDir, { recursive: true, force: true })
  const assetDir = path.join(root, '.vr', 'assets')
  forgetErrorResponses(assetDir)
  const assetCache: AssetCache = { unreachable: new Set(), fetched: 0 }

  const shots = new Map<string, Shot>()
  await withServer(build, async (url) => {
    for (const group of groups.values()) {
      const captured = await captureAll({
        baseUrl: url,
        stories: group.stories,
        viewports: [group.viewport],
        dir: shotsDir,
        settleMs: options.settleMs,
        concurrency: options.concurrency,
        reuseExisting: false,
        assetDir,
        assetCache,
        onProgress: progress(`capturing ${group.viewport.name}`),
      })
      for (const shot of captured) shots.set(`${shot.storyId}--${shot.viewport}`, shot)
    }
  })

  const diffDir = path.join(cache, 'shots', 'figma-diff')
  fs.rmSync(diffDir, { recursive: true, force: true })
  const scores: FrameScore[] = plan.targets.flatMap((target) => {
    const capture = shots.get(`${target.story.id}--${target.viewport.name}`)
    if (!capture) return []
    return [
      scoreFrame({
        capture,
        frame: target.frame,
        nodeId: target.nodeId,
        brand: target.brand,
        diffDir,
        threshold: options.threshold,
      }),
    ]
  })

  log(`\n${formatScoring(plan, scores)}`)

  const report = writeReport(
    path.join(cache, 'report-figma'),
    scores.map((score) => score.comparison),
    {
      brand,
      baseRef: 'its Figma frames',
      baseSha: '',
      head: git(['rev-parse', '--abbrev-ref', 'HEAD'], root),
      storyCount: new Set(plan.targets.map((target) => target.story.id)).size,
      viewports: widths.map((width) => `frame ${width}px`),
      everything: false,
      generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sides: { baseline: 'figma frame', current: 'capture' },
      verdictLabels: { changed: 'scored' },
    },
  )
  log(`\n  ${path.relative(root, report)}\n`)
  if (options.open) openReport(report)
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      // No default: `--figma` reads every host unless a brand is named, and
      // the pixel run below falls back to o3 the way it always has.
      brand: { type: 'string' },
      figma: { type: 'boolean', default: false },
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

  if (values.brand !== undefined && !isBrand(values.brand)) {
    throw new Error(`unknown brand ${values.brand} — expected one of ${BRANDS.join(', ')}`)
  }

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

  // The Figma baseline (#326). The inventory (#336) and the frame exports it
  // feeds (#337) need neither a build nor a browser, so they answer before
  // anything below spends twelve seconds on Storybook.
  if (values.figma) {
    const brands = values.brand ? [values.brand] : BRANDS
    const inventory = readInventory(brands)
    log(`\nfigma pairings — ${brands.join(', ')}\n`)
    log(formatInventory(inventory))
    // `--list` is read-only: it says what the run is about and touches
    // nothing, so it stays answerable with no token and no network.
    if (values.list) return

    const dir = exportDir(repoRoot())
    if (values.refresh) fs.rmSync(dir, { recursive: true, force: true })
    const plan = planFrameExports(inventory.pairings, brands, dir)
    log(
      `\n  ${plan.fetch.length} to fetch · ${plan.fresh.length} cached · ` +
        `${plan.unknown.length} unplaceable`,
    )
    const outcome = await ensureExports({ dir, plan, onProgress: progress('  exporting') })
    log(`\n${formatExportReport(plan, outcome)}`)
    log(`\n  ${path.relative(repoRoot(), dir)}`)

    await scoreAgainstFigma({
      brand: values.brand ?? 'o3',
      brands,
      pairings: inventory.pairings,
      exportsDir: dir,
      reasons: exportReasons(plan, outcome),
      exports: readFrameExports(dir, plan, outcome, values.brand ?? 'o3'),
      wanted,
      scoped: needles.length > 0,
      settleMs: Number(values.settle),
      concurrency: Number(values.concurrency),
      threshold: Number(values.threshold),
      verbose: values.verbose,
      open: values.open,
    })
    return
  }

  const brand = values.brand ?? 'o3'
  const host = hostDir(brand)

  const root = repoRoot()
  // Per brand, because a run of one host must not read the other's build,
  // screenshots or report. `assets/` and `base/` stay above it: remote bytes
  // and the baseline checkout are the same whichever host renders them.
  const cache = path.join(root, '.vr', brand)
  const viewports = values.viewports ? parseViewports(values.viewports) : DEFAULT_VIEWPORTS
  const base = resolveBase(root, values.base)
  const baseShort = shortSha(root, base.sha)
  const head = git(['rev-parse', '--abbrev-ref', 'HEAD'], root)

  log(`\nvisual regression — ${brand} — ${head} vs ${base.ref} (${baseShort})`)

  // ── this checkout ─────────────────────────────────────────────────────────
  // Built first, and unconditionally: it is both the thing under test and the
  // module graph that decides which stories are worth comparing.
  const currentBuild = path.join(cache, 'build', 'current')
  log(`  building ${host} for the working tree`)
  await buildStorybook(root, brand, currentBuild, values.verbose)

  const index = readIndex(currentBuild)
  // Naming stories explicitly is its own scope: `--story hero` means "compare
  // these", not "compare these if the diff happens to reach them".
  const affected: Affected =
    values.all || values.story.length > 0
      ? { storyFiles: [], everything: true }
      : affectedStoryFiles(readStats(currentBuild), changedFiles(root, base.sha), host)

  const stories = storiesFor(index, affected, host).filter(wanted)

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
      log(`    ${entry.id}  ${path.relative(root, path.join(root, entryPath(entry, host)))}`)
    }
    return
  }

  // ── the baseline ──────────────────────────────────────────────────────────
  // A second checkout, kept and reused. Screenshots are cached per commit, so
  // the expensive part happens once per baseline rather than once per run.
  const baseDir = path.join(root, '.vr', 'base')
  ensureBaseCheckout(root, base.sha, baseDir, (message) => log(`  ${message}`))

  // A host younger than the baseline commit has nothing to render there, and
  // `storybook build` in a directory that does not exist is an obscure failure
  // rather than a finding. An empty baseline index says the honest thing: every
  // story on this host is `added`.
  const baseBuild = path.join(cache, 'build', `base-${baseShort}`)
  const baseHasHost = fs.existsSync(path.join(baseDir, host))
  if (baseHasHost && !fs.existsSync(path.join(baseBuild, 'index.json'))) {
    log(`  building ${host} for ${baseShort}`)
    await buildStorybook(baseDir, brand, baseBuild, values.verbose)
  }
  if (!baseHasHost) log(`  ${baseShort} has no ${host} — every story reads as added`)

  const baselineIndex = baseHasHost ? readIndex(baseBuild) : []
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
    host,
  ).filter(wanted)

  // Keyed by capture settings as well as by commit — see `captureKey`.
  const shotsDir = path.join(
    cache,
    'shots',
    `${baseShort}-${captureKey(viewports, Number(values.settle))}`,
  )
  if (values.refresh) fs.rmSync(shotsDir, { recursive: true, force: true })

  // Both sides replay their remote assets out of one cache, which is what makes
  // "the photograph loaded on one side only" impossible (#226).
  const assetDir = path.join(root, '.vr', 'assets')
  // A refusal the server gave us is re-asked every run: it costs one
  // round-trip, and a URL fixed since yesterday should not need a flag to be
  // noticed. A timeout costs a minute of attempts to rediscover, so it waits
  // for `--refresh`.
  forgetErrorResponses(assetDir)
  if (values.refresh) forgetUnreachable(assetDir)
  const assetCache: AssetCache = { unreachable: new Set(), fetched: 0 }

  const baselineShots = await withServer(baseBuild, (url) =>
    captureAll({
      baseUrl: url,
      stories: [...baselineStories, ...gone],
      viewports,
      dir: shotsDir,
      settleMs: Number(values.settle),
      concurrency: Number(values.concurrency),
      reuseExisting: true,
      assetDir,
      assetCache,
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
      assetDir,
      assetCache,
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
    brand,
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
  if (assetCache.unreachable.size > 0) {
    // Both sides served the same failure, so this is not a false diff — but a
    // story whose photograph is missing on both sides is still worth saying out
    // loud, because the report will not look like the site.
    log(
      `  ${assetCache.unreachable.size} remote assets could not be fetched; served as failed. ` +
        `The next run re-asks the ones a server refused; --refresh retries the ones that timed out.`,
    )
  }
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

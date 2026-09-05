/** Offline acceptance freshness. It never manufactures a new visual score. */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { EMPTY_COVERAGE, type CoveragePolicy } from './coverage-policy'
import { affectedStoryFiles } from './affected'
import type { BrandBaseline } from './export-cache'
import type { Ledger } from './ledger'
import type { Inventory } from './pairing'
import { hostDir, type Brand, type StatsModule } from './storybook'

export interface SourceEvidence {
  readonly files: Readonly<Record<string, string>>
  readonly globals: string
}

function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

export function sourceKey(source: SourceEvidence): string {
  return digest(
    JSON.stringify({
      files: Object.entries(source.files).sort(([a], [b]) => a.localeCompare(b)),
      globals: source.globals,
    }),
  )
}

function fileHash(root: string, file: string): string | null {
  const full = path.resolve(root, file)
  if (!full.startsWith(`${path.resolve(root)}${path.sep}`) || !fs.existsSync(full)) return null
  return fs.statSync(full).isFile() ? digest(fs.readFileSync(full)) : null
}

function filesUnder(root: string, dir: string): string[] {
  const full = path.join(root, dir)
  if (!fs.existsSync(full)) return []
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    if (
      [
        'node_modules',
        '.git',
        '.next',
        '.vr',
        '.turbo',
        '.cache',
        'dist',
        'build',
        'coverage',
        'storybook-static',
        'prototypes',
      ].includes(entry.name)
    )
      return []
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? filesUnder(root, file) : [file]
  })
}

function sourceRoster(root: string): string[] {
  return fs.existsSync(path.join(root, '.git'))
    ? execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
        cwd: root,
        encoding: 'utf8',
      })
        .split('\0')
        .filter((file) => file && !file.startsWith('apps/storybook/prototypes/'))
    : filesUnder(root, '')
}

/** The pre-build snapshot closes the interval before the build can expose its module graph. */
export function readSourceState(root: string, host: Brand): SourceEvidence {
  return {
    files: Object.fromEntries(
      sourceRoster(root).flatMap((file) => {
        const hash = fileHash(root, file)
        return hash ? [[file, hash]] : []
      }),
    ),
    globals: globalHash(root, host),
  }
}

/** Config, CSS, public assets and capture rules can change pixels without a JS import edge. */
function globalHash(root: string, host: Brand): string {
  const directory = hostDir(host)
  const roots = [directory, 'packages', 'tools/visual-regression/src']
  const roster = sourceRoster(root)
  const files = roster
    .filter(
      (file) =>
        roots.some((dir) => file.startsWith(`${dir}/`)) &&
        !file.startsWith(`${directory}/prototypes/`),
    )
    .filter(
      (file) =>
        file.endsWith('.css') ||
        /(?:^|\/)(?:package\.json|tsconfig[^/]*\.json)$/.test(file) ||
        file.startsWith(`${directory}/.storybook/`) ||
        file.startsWith(`${directory}/public/`) ||
        file.startsWith('packages/story-kit/src/') ||
        /(?:^|\/)[^/]+\.config\.[cm]?[jt]s$/.test(file) ||
        (file.startsWith('tools/visual-regression/src/') && !file.includes('.test.')),
    )
  files.push(
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'tsconfig.json',
    'tools/visual-regression/data/figma-coverage.json',
  )
  return digest(
    JSON.stringify(
      [...new Set(files)]
        .sort()
        .filter((file) => fileHash(root, file) !== null)
        .map((file) => [file, fileHash(root, file)]),
    ),
  )
}

/** Called only with the module graph of the build whose pixels are about to be measured. */
export function captureSourceEvidence(
  root: string,
  modules: StatsModule[],
  stories: readonly string[],
  host: Brand,
  beforeBuild?: SourceEvidence,
): Record<string, SourceEvidence> {
  if (modules.length === 0) throw new Error('Cannot accept without the built module graph')
  const graphFiles = new Set(
    modules
      .filter((module) => module.id.startsWith('./'))
      .map((module) => path.normalize(path.join(hostDir(host), module.id.slice(2).split('?')[0]!))),
  )
  for (const story of stories)
    if (!graphFiles.has(story))
      throw new Error(`Story is missing from the built module graph: ${story}`)
  const files = new Set(stories)
  for (const module of modules) {
    if (!module.id.startsWith('./') || module.id.includes('\0')) continue
    const file = path.normalize(path.join(hostDir(host), module.id.slice(2))).split('?')[0]!
    if (!file.split(path.sep).includes('node_modules')) files.add(file)
  }
  const global = globalHash(root, host)
  if (beforeBuild && beforeBuild.globals !== global)
    throw new Error('Global rendering inputs changed during build')
  const hashes: Record<string, Record<string, string>> = Object.fromEntries(
    stories.map((story) => [story, {}]),
  )
  for (const file of [...files].sort()) {
    const affected = affectedStoryFiles(modules, [file], hostDir(host))
    const reached = stories.filter(
      (story) => affected.everything || affected.storyFiles.includes(story) || file === story,
    )
    if (reached.length === 0) continue
    const hash = fileHash(root, file)
    if (!hash) throw new Error(`Cannot accept missing source: ${file}`)
    if (beforeBuild && beforeBuild.files[file] !== hash)
      throw new Error(`Source changed during build: ${file}`)
    for (const story of reached) hashes[story]![file] = hash
  }
  return Object.fromEntries(
    stories.map((story) => [story, { files: hashes[story]!, globals: global }]),
  )
}

export function checkLedger(input: {
  root: string
  host: Brand
  inventory: Inventory
  ledger: Ledger
  baselines: readonly BrandBaseline[]
  policy?: CoveragePolicy
}): string[] {
  const failures: string[] = []
  const global = globalHash(input.root, input.host)
  const baselines = new Map(input.baselines.map((baseline) => [baseline.brand, baseline]))
  const policy = input.policy ?? EMPTY_COVERAGE
  const measuredNodes = new Set<string>()
  const declared = new Set(
    input.inventory.pairings.map(
      (pair) => `${input.host}/${pair.storyId}/${pair.designBrand}/${pair.nodeId}`,
    ),
  )
  for (const key of Object.keys(input.ledger.pairs)) {
    const parts = key.split('/')
    if (parts[0] === input.host && !declared.has(parts.slice(0, 4).join('/')))
      failures.push(
        `${parts[1]}: accepted pairing was removed; review and remove obsolete ledger entry ${key}`,
      )
  }
  for (const key of Object.keys(input.ledger.references ?? {})) {
    if (!input.inventory.pairings.some((pair) => `${pair.storyId}/${pair.nodeId}` === key))
      failures.push(
        `${key}: reviewed reference was removed; review and remove obsolete source evidence`,
      )
  }
  function checkSource(name: string, file: string, key: string | undefined) {
    const source = key ? input.ledger.sources?.[key] : undefined
    if (!source?.files[file] || !source.globals) {
      failures.push(`${name}: acceptance has no source evidence; capture, review and re-accept`)
      return
    }
    if (source.globals !== global)
      failures.push(`${name}: global rendering inputs changed; capture, review and re-accept`)
    for (const [dependency, hash] of Object.entries(source.files))
      if (fileHash(input.root, dependency) !== hash)
        failures.push(`${name}: source changed or missing: ${dependency}`)
  }
  if (input.inventory.pairings.length === 0)
    failures.push('No Figma pairings found; refusing an empty gate')
  for (const pair of input.inventory.pairings) {
    const name = pair.storyId ?? pair.file
    const referenceKey = `${pair.storyId}/${pair.nodeId}`
    if (policy.referenceOnly[referenceKey]) {
      const reference = input.ledger.references?.[referenceKey]
      checkSource(name, pair.file, reference?.source)
      const currentHash = pair.designBrand
        ? (baselines.get(pair.designBrand)?.hashes?.[pair.nodeId] ?? null)
        : null
      if (reference && reference.nodeHash !== currentHash)
        failures.push(
          `${name}: reference design changed; review its measurement status (${pair.nodeId})`,
        )
      continue
    }
    const failureCount = failures.length
    const prefix = `${input.host}/${pair.storyId}/${pair.designBrand}/${pair.nodeId}/`
    const entries = Object.entries(input.ledger.pairs).filter(([key]) => key.startsWith(prefix))
    if (!pair.storyId || !pair.designBrand || pair.match === 'untracked') {
      failures.push(`${name}: ${pair.nodeId} is not a tracked pairing`)
      continue
    }
    const baseline = baselines.get(pair.designBrand)
    const nodeHash = baseline?.hashes?.[pair.nodeId]
    if (!nodeHash) failures.push(`${name}: ${pair.nodeId} has no synced design hash`)
    if (entries.length === 0) failures.push(`${name}: ${pair.nodeId} has never been accepted`)
    for (const [key, entry] of entries) {
      if (
        !Number.isFinite(entry.score) ||
        entry.score < 0 ||
        entry.score > 1 ||
        !Number.isFinite(entry.tolerance) ||
        entry.tolerance < 0
      )
        failures.push(`${name}: invalid score or tolerance (${key})`)
      if (entry.score > entry.tolerance && !entry.reason?.trim())
        failures.push(`${name}: measured departure has no review reason`)
      if (!nodeHash || entry.nodeHash !== nodeHash)
        failures.push(`${name}: design changed or missing since acceptance (${pair.nodeId})`)
      checkSource(name, pair.file, entry.source)
    }
    if (entries.length > 0 && failures.length === failureCount) measuredNodes.add(pair.nodeId)
  }
  const sets = new Map(input.inventory.uncovered.map((entry) => [entry.nodeId, entry.name]))
  for (const pair of input.inventory.pairings)
    if (pair.match === 'componentSet') sets.set(pair.nodeId, pair.trackedName ?? pair.nodeId)
  for (const [nodeId, name] of sets) {
    const reason = policy.inactiveSets[nodeId]
    if (reason) {
      const hash = baselines.get(input.host)?.hashes?.[nodeId]
      if (!hash || policy.designHashes?.[nodeId] !== hash)
        failures.push(`${name} (${nodeId}): inactive design changed or lacks reviewed provenance`)
      continue
    }
    const coverage = policy.componentCoverage.filter((entry) => entry.componentSet === nodeId)
    if (
      !measuredNodes.has(nodeId) &&
      !coverage.some((entry) => entry.reason.trim() && measuredNodes.has(entry.nodeId))
    )
      failures.push(
        `${name} (${nodeId}): tracked component set has no paired story with current accepted evidence`,
      )
    if (
      coverage.some(
        (entry) =>
          policy.designHashes?.[entry.componentSet] !==
          baselines.get(input.host)?.hashes?.[entry.componentSet],
      )
    )
      failures.push(`${name} (${nodeId}): component ancestry changed; verify the coverage mapping`)
  }
  for (const key of Object.keys(policy.referenceOnly))
    if (!input.inventory.pairings.some((pair) => `${pair.storyId}/${pair.nodeId}` === key))
      failures.push(`${key}: stale reference-only policy entry`)
  return [...new Set(failures)].sort()
}

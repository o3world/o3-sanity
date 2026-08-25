/**
 * What a `--figma` run has to fetch, and what it already has (#337).
 *
 * The subject is the pairing inventory (#336); the freshness rule is
 * `figma:sync`'s baseline. A frame export is identified by the node it draws
 * and the hash the last sync recorded for that node, so an unchanged node is a
 * cache hit and a changed one invalidates its own entry and nothing else —
 * which is what makes the steady state zero API calls (spec #326 → Export
 * caching).
 *
 * Pure. `planExports` takes pairings, baselines and the list of cached entries
 * and returns what to fetch, what is fresh, what the baseline cannot place and
 * what to sweep; `figma-exports.ts` does the reads, the calls and the writes.
 * That is what lets the keying be tested on fixtures with no network.
 */
import type { PairingRow } from './pairing'
import type { Brand } from './storybook'

/**
 * How much of a node's baseline hash goes in a filename. A sync hash is
 * SHA-256 hex; twelve characters is more than enough to separate two versions
 * of one node, and short enough that a `ls .vr/figma` is readable.
 */
const HASH_IN_NAME = 12

const FILE = /^(\d+-\d+)@([0-9a-f]+)\.png$/

/** One brand's `figma:sync` baseline, as the plan reads it. */
export interface BrandBaseline {
  readonly brand: Brand
  readonly fileKey: string
  /** The design file's version at the last sync — what the ledger records at
   *  acceptance (#339). Empty when that brand has never been synced. */
  readonly version: string
  /** `null` when that brand has never been synced — every node is unplaceable. */
  readonly hashes: Readonly<Record<string, string>> | null
}

/** An export already on disk, read back off its filename. */
export interface CachedExport {
  readonly brand: Brand
  readonly nodeId: string
  /** The truncated hash the filename carries, not the baseline's full one. */
  readonly hash: string
}

/** One node to draw, and the stories waiting on it. */
export interface ExportRequest {
  readonly brand: Brand
  readonly fileKey: string
  readonly nodeId: string
  /** The baseline hash this export is keyed by, in full. */
  readonly hash: string
  /** Path under the export directory. */
  readonly file: string
  readonly stories: readonly string[]
}

/** Why the baseline could not place a paired node. */
export type UnknownReason =
  /** The story named a `figmaDesign` file key nothing in the repo owns. */
  | 'no-design-file'
  /** That brand has no baseline — `pnpm figma:sync` has never run for it. */
  | 'no-baseline'
  /** The baseline is there and does not track this node. */
  | 'not-in-baseline'

export interface UnknownNode {
  readonly brand: Brand | null
  readonly nodeId: string
  readonly reason: UnknownReason
  readonly stories: readonly string[]
}

/** A node the images API would not draw — the file no longer has it. */
export interface MissingNode {
  readonly brand: Brand
  readonly nodeId: string
  readonly stories: readonly string[]
}

export interface ExportPlan {
  readonly fetch: readonly ExportRequest[]
  readonly fresh: readonly ExportRequest[]
  readonly unknown: readonly UnknownNode[]
  /** Cached files no live key claims: a superseded hash, or a dropped pairing. */
  readonly stale: readonly CachedExport[]
}

/** What the IO half made of the plan. */
export interface ExportOutcome {
  readonly fetched: number
  readonly missing: readonly MissingNode[]
}

/** Where one node's export lives, relative to the export directory. */
export function exportFile(brand: Brand, nodeId: string, hash: string): string {
  return `${brand}/${nodeId.replaceAll(':', '-')}@${hash.slice(0, HASH_IN_NAME)}.png`
}

/** The filename read back as a key, or `null` for anything else in the directory. */
export function parseExportFile(brand: Brand, name: string): CachedExport | null {
  const match = FILE.exec(name)
  if (!match) return null
  return { brand, nodeId: match[1]!.replace('-', ':'), hash: match[2]! }
}

/** The label the inventory prints a pairing under. */
function storyLabel(row: PairingRow): string {
  return row.storyId ?? `${row.file} · ${row.exportName}`
}

/**
 * The plan.
 *
 * One export per node, however many stories cite it: two stories of the same
 * component draw the same frame, and fetching it twice would spend an API call
 * to write the same bytes. `baselines` carries only the brands this run
 * reports, so `--brand` narrows the plan by narrowing its input.
 */
export function planExports(
  pairings: readonly PairingRow[],
  baselines: readonly BrandBaseline[],
  cached: readonly CachedExport[],
): ExportPlan {
  const byBrand = new Map(baselines.map((baseline) => [baseline.brand, baseline]))

  // (brand, node) → the stories waiting on it, in the inventory's own order.
  const wanted = new Map<string, { row: PairingRow; stories: string[] }>()
  for (const row of pairings) {
    const key = `${row.designBrand ?? '?'}/${row.nodeId}`
    const entry = wanted.get(key)
    if (entry) entry.stories.push(storyLabel(row))
    else wanted.set(key, { row, stories: [storyLabel(row)] })
  }

  const cachedHashes = new Map(cached.map((entry) => [`${entry.brand}/${entry.nodeId}`, entry]))
  const claimed = new Set<CachedExport>()

  const fetch: ExportRequest[] = []
  const fresh: ExportRequest[] = []
  const unknown: UnknownNode[] = []

  for (const [key, { row, stories }] of wanted) {
    const brand = row.designBrand
    const baseline = brand ? byBrand.get(brand) : undefined
    if (!brand || !baseline) {
      unknown.push({
        brand,
        nodeId: row.nodeId,
        reason: brand ? 'no-baseline' : 'no-design-file',
        stories,
      })
      continue
    }
    if (!baseline.hashes) {
      unknown.push({ brand, nodeId: row.nodeId, reason: 'no-baseline', stories })
      continue
    }
    const hash = baseline.hashes[row.nodeId]
    if (!hash) {
      unknown.push({ brand, nodeId: row.nodeId, reason: 'not-in-baseline', stories })
      continue
    }

    const request: ExportRequest = {
      brand,
      fileKey: baseline.fileKey,
      nodeId: row.nodeId,
      hash,
      file: exportFile(brand, row.nodeId, hash),
      stories,
    }
    const hit = cachedHashes.get(key)
    if (hit && hit.hash === hash.slice(0, HASH_IN_NAME)) {
      claimed.add(hit)
      fresh.push(request)
    } else {
      fetch.push(request)
    }
  }

  return {
    fetch,
    fresh,
    unknown,
    stale: cached.filter((entry) => !claimed.has(entry)),
  }
}

/**
 * Why each unexportable node has no export, keyed `<brand>/<node>` — what the
 * scoring plan prints beside an unkeyed pairing (#338), in this module's own
 * words rather than a second set invented downstream.
 */
export function exportReasons(plan: ExportPlan, outcome: ExportOutcome): Map<string, string> {
  const reasons = new Map<string, string>()
  for (const node of plan.unknown)
    reasons.set(`${node.brand ?? '?'}/${node.nodeId}`, REASON[node.reason])
  for (const node of outcome.missing) {
    reasons.set(`${node.brand}/${node.nodeId}`, 'the Figma file would not draw it')
  }
  return reasons
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + ' '.repeat(width - value.length)
}

function table(header: readonly string[], rows: readonly (readonly string[])[]): string {
  const widths = header.map((cell, column) =>
    Math.max(cell.length, ...rows.map((row) => (row[column] ?? '').length)),
  )
  const line = (row: readonly string[]) =>
    row
      .map((cell, column) => pad(cell, widths[column]!))
      .join('  ')
      .trimEnd()
  return [line(header), line(widths.map((width) => '-'.repeat(width))), ...rows.map(line)].join(
    '\n',
  )
}

const REASON: Record<UnknownReason, string> = {
  'no-design-file': 'names no known design file',
  'no-baseline': 'brand has no figma:sync baseline',
  'not-in-baseline': 'not tracked by figma:sync',
}

/**
 * The run's account of itself: the counts first, then the two lists a person
 * has to act on. Neither list is capped — a node the baseline cannot place and
 * a node the file no longer has are both named, because a silent skip here is
 * exactly the stale pairing the gate exists to catch.
 */
export function formatExportReport(plan: ExportPlan, outcome: ExportOutcome): string {
  const sections = [
    `Frame exports\n\n  fetched ${outcome.fetched} · cache hits ${plan.fresh.length} · ` +
      `unknown to the baseline ${plan.unknown.length}`,
  ]

  if (plan.unknown.length > 0) {
    sections.push(
      `Unknown to the baseline (${plan.unknown.length})\n\n` +
        table(
          ['node', 'brand', 'why', 'stories'],
          plan.unknown.map((node) => [
            node.nodeId,
            node.brand ?? '?',
            REASON[node.reason],
            node.stories.join(', '),
          ]),
        ),
    )
  }

  if (outcome.missing.length > 0) {
    sections.push(
      `Missing from the Figma file (${outcome.missing.length})\n` +
        '  The images API would not draw these — the design deleted the node, or the story cites a stale id.\n\n' +
        table(
          ['node', 'brand', 'stories'],
          outcome.missing.map((node) => [node.nodeId, node.brand, node.stories.join(', ')]),
        ),
    )
  }

  return sections.join('\n\n')
}

/**
 * The drift ledger, and the verdict it rules (#339).
 *
 * `frame-score.ts` produces a number per (story, node, viewport) and takes no
 * view of it. This file is where the number acquires consequence: the ledger
 * says what score each pairing was accepted at, and `planVerdicts` says what
 * this run's scores mean against it.
 *
 * **The ledger is a decision in git.** Committed sorted-key JSON at
 * `tools/visual-regression/data/figma-ledger.json`, the same philosophy as
 * `tools/migration/data/assets.json` and the `figma:sync` baselines: acceptance
 * is a reviewed diff, never a prompt and never a run that quietly moves the
 * bar (spec #326 → Auto-acceptance is out of scope). `serializeLedger` writes a
 * fixed field order and a trailing newline, so re-accepting an unchanged pair
 * produces no diff at all.
 *
 * **The key carries the host.** Two Storybook hosts serve the shared packages
 * and give a shared story the same id (#336), so `pages-home--desktop` on o3
 * and on o3xo are two pairings against two design files. The key is
 * `<host>/<story>/<design brand>/<node>/<viewport>` — every axis that can make
 * two comparisons differ, and nothing else.
 *
 * **Exactly four things are red**, and the acceptance criteria say so:
 *
 * - `worsened` — the score is past its accepted score plus its tolerance.
 * - `unaccepted-change` — `figma:sync` re-hashed the node since acceptance and
 *   nobody re-accepted. Red even when the score passes: the pair was measured
 *   against a frame that no longer exists.
 * - `orphaned` — the Figma file will not draw the node any more (#337's named
 *   missing-node list, promoted to a verdict).
 * - `no-export` — the node changed and this run could not obtain its export, so
 *   nothing can be said about it. Silence about a changed node is the failure.
 *
 * Everything else is a row on a list: a pairing nobody has accepted, a node
 * `figma:sync` does not track, a story naming no node, a node marked
 * `unpairable`. A new pairing is listed rather than red because there is no
 * accepted score for it to have worsened past — calling it drift would report a
 * measurement nobody made. It is never silent, and `--strict`
 * turns the list red so an unaccepted pairing cannot merge unnoticed.
 *
 * Pure end to end: four plain objects in, a plan out. `ledger-file.ts` reads and
 * writes the JSON and does nothing else.
 */
import { sourceKey, type SourceEvidence } from './ledger-check'
import type { BrandBaseline, MissingNode } from './export-cache'
import { frameKey, type FrameScore, type UnkeyedPairing } from './frame-score'
import type { Brand, StoryEntry } from './storybook'

/**
 * How much worse than its accepted score a pair may drift and still pass, in
 * ratio points.
 *
 * Read off #338's characterisation fixtures: a pair that matches scores 0.00%
 * across two renderers, and the smallest drift those fixtures call real — the
 * #325 padding miss — scores 5.80%. Half a point sits an order of magnitude
 * under the drift and above the zero the capture freeze produces run to run, so
 * it absorbs a font-rendering wobble and nothing that changed on the page.
 * Per-entry, and edited in the JSON when one pairing needs its own.
 */
export const DEFAULT_TOLERANCE = 0.005

/** Five places is 0.001% — finer than any tolerance, coarse enough to read. */
const PLACES = 5

/** One accepted pairing. */
export interface LedgerEntry {
  /** The diff-pixel ratio accepted when the pair was paired or re-accepted. */
  readonly score: number
  /** How much worse than `score` still passes. */
  readonly tolerance: number
  /** The node's `figma:sync` baseline hash at acceptance; `null` when untracked. */
  readonly nodeHash: string | null
  /** The design file's version at acceptance, as `figma:sync` recorded it. */
  readonly fileVersion: string | null
  readonly source?: string
  readonly acceptedAt: string
  /** One line: why this pairing is accepted at a score that is not near zero. */
  readonly reason?: string
}

/** A node no story should ever be scored against — #308 ruling 9 material. */
export interface UnpairableEntry {
  readonly reason: string
}

export interface Ledger {
  readonly sources?: Readonly<Record<string, SourceEvidence>>
  readonly pairs: Readonly<Record<string, LedgerEntry>>
  /** Reviewed reference fixtures: source freshness only, never a visual score. */
  readonly references?: Readonly<Record<string, { source: string; nodeHash: string | null }>>
  /** Keyed `<design brand>/<node>`: debris is a property of the node, not a pair. */
  readonly unpairable: Readonly<Record<string, UnpairableEntry>>
}

export const EMPTY_LEDGER: Ledger = { pairs: {}, unpairable: {} }

/** Every axis that can make two comparisons of one story differ. */
export function ledgerKey(pair: {
  readonly host: Brand
  readonly storyId: string
  readonly designBrand: Brand
  readonly nodeId: string
  readonly viewport: string
}): string {
  return [pair.host, pair.storyId, pair.designBrand, pair.nodeId, pair.viewport].join('/')
}

function sorted<T>(record: Readonly<Record<string, T>>, shape: (value: T) => unknown) {
  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key) => [key, shape(record[key] as T)]),
  )
}

/**
 * The bytes on disk.
 *
 * Keys sorted and fields written in a fixed order, so the file is a function of
 * its content rather than of the order a run happened to build it in: two
 * agents accepting different pairings produce diffs that merge, and re-accepting
 * an unchanged pair produces no diff.
 */
export function serializeLedger(ledger: Ledger): string {
  const pairs = sorted(ledger.pairs, (entry) => ({
    score: entry.score,
    tolerance: entry.tolerance,
    nodeHash: entry.nodeHash,
    fileVersion: entry.fileVersion,
    acceptedAt: entry.acceptedAt,
    ...(entry.source === undefined ? {} : { source: entry.source }),
    ...(entry.reason === undefined ? {} : { reason: entry.reason }),
  }))
  const unpairable = sorted(ledger.unpairable, (entry) => ({ reason: entry.reason }))
  const used = new Set([
    ...Object.values(ledger.pairs).map((entry) => entry.source),
    ...Object.values(ledger.references ?? {}).map((entry) => entry.source),
  ])
  const sources = ledger.sources
    ? Object.fromEntries(
        Object.entries(ledger.sources)
          .filter(([key]) => used.has(key))
          .sort(([a], [b]) => a.localeCompare(b)),
      )
    : undefined
  return `${JSON.stringify({ pairs, unpairable, ...(sources ? { sources } : {}), ...(ledger.references ? { references: sorted(ledger.references, (entry) => entry) } : {}) }, null, 2)}\n`
}

/** An absent or empty file is an empty ledger — the honest starting state. */
export function parseLedger(text: string): Ledger {
  if (text.trim() === '') return EMPTY_LEDGER
  const parsed = JSON.parse(text) as Partial<Ledger>
  return {
    pairs: parsed.pairs ?? {},
    unpairable: parsed.unpairable ?? {},
    ...(parsed.sources ? { sources: parsed.sources } : {}),
    ...(parsed.references ? { references: parsed.references } : {}),
  }
}

// ── acceptance ────────────────────────────────────────────────────────────────

export interface AcceptResult {
  readonly ledger: Ledger
  readonly added: readonly string[]
  readonly updated: readonly string[]
  readonly unchanged: readonly string[]
}

function round(ratio: number): number {
  return Number(ratio.toFixed(PLACES))
}

/**
 * The current run's scores, written into the ledger.
 *
 * What a person put in the JSON survives: a hand-edited tolerance and a
 * reasoned departure's one-line why are carried through a re-acceptance, because
 * they are the decisions the ledger exists to hold and the score is the only
 * thing a run knows better. An entry whose recorded values already match is left
 * byte-identical, `acceptedAt` included — a re-accept that changed nothing did
 * not accept anything.
 */
export function acceptScores(input: {
  readonly ledger: Ledger
  readonly host: Brand
  readonly scores: readonly FrameScore[]
  readonly baselines: readonly BrandBaseline[]
  /** Today, as `YYYY-MM-DD`. Passed in so the writer stays pure. */
  readonly at: string
  readonly tolerance?: number
  readonly sources?: Readonly<Record<string, SourceEvidence>>
  readonly reason?: string
}): AcceptResult {
  const byBrand = new Map(input.baselines.map((baseline) => [baseline.brand, baseline]))
  const pairs: Record<string, LedgerEntry> = { ...input.ledger.pairs }
  const sources = { ...input.ledger.sources }
  const added: string[] = []
  const updated: string[] = []
  const unchanged: string[] = []

  for (const score of input.scores) {
    if (score.error !== undefined) continue
    if (input.ledger.unpairable[frameKey(score.brand, score.nodeId)]) continue

    const key = ledgerKey({
      host: input.host,
      storyId: score.storyId,
      designBrand: score.brand,
      nodeId: score.nodeId,
      viewport: score.viewport,
    })
    const baseline = byBrand.get(score.brand)
    const previous = pairs[key]
    const source = input.sources?.[score.storyId]
    const keyOfSource = source ? sourceKey(source) : undefined
    if (source && keyOfSource) sources[keyOfSource] = source
    const next: LedgerEntry = {
      score: round(score.ratio),
      tolerance: previous?.tolerance ?? input.tolerance ?? DEFAULT_TOLERANCE,
      nodeHash: baseline?.hashes?.[score.nodeId] ?? null,
      fileVersion: baseline?.version ?? null,
      acceptedAt: input.at,
      ...(keyOfSource ? { source: keyOfSource } : {}),
      ...((input.reason ?? previous?.reason) === undefined
        ? {}
        : { reason: input.reason ?? previous?.reason }),
    }

    if (!previous) {
      pairs[key] = next
      added.push(key)
    } else if (
      previous.score === next.score &&
      previous.nodeHash === next.nodeHash &&
      previous.fileVersion === next.fileVersion &&
      JSON.stringify(previous.source) === JSON.stringify(next.source) &&
      previous.reason === next.reason
    ) {
      unchanged.push(key)
    } else {
      pairs[key] = next
      updated.push(key)
    }
  }

  return {
    ledger: { ...input.ledger, pairs, ...(Object.keys(sources).length ? { sources } : {}) },
    added: added.sort(),
    updated: updated.sort(),
    unchanged: unchanged.sort(),
  }
}

// ── the verdict ───────────────────────────────────────────────────────────────

/** The four, and only the four. */
export type RedKind = 'worsened' | 'unaccepted-change' | 'orphaned' | 'no-export'

/** Reported, never failed. */
export type ListedKind = 'new' | 'unpairable' | 'untracked' | 'unpaired' | 'unscored'

export interface VerdictRow {
  readonly kind: RedKind | ListedKind | 'pass'
  /** The ledger key, where the row has one. */
  readonly key: string | null
  readonly storyId: string
  readonly nodeId: string | null
  readonly brand: Brand | null
  readonly viewport: string | null
  /** One line, in the reader's terms: what happened and what to do about it. */
  readonly detail: string
}

export interface VerdictPlan {
  readonly red: readonly VerdictRow[]
  readonly passed: readonly VerdictRow[]
  readonly listed: readonly VerdictRow[]
}

export interface VerdictInput {
  /** The Storybook host this run captured. */
  readonly host: Brand
  readonly ledger: Ledger
  readonly baselines: readonly BrandBaseline[]
  readonly scores: readonly FrameScore[]
  /** Pairings with no export this run, from the scoring plan. */
  readonly unkeyed: readonly UnkeyedPairing[]
  /** Nodes the images API would not draw, from the export outcome. */
  readonly missing: readonly MissingNode[]
  /** In scope, naming no node at all. */
  readonly unpaired: readonly StoryEntry[]
}

function percent(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`
}

/**
 * What this run means.
 *
 * The order the checks run in is a decision: a node the design changed is red
 * before its score is consulted, because a score measured against a superseded
 * frame is not evidence about anything. An `unpairable` node outranks
 * everything — debris cannot orphan a run.
 */
export function planVerdicts(input: VerdictInput): VerdictPlan {
  const hashes = new Map(input.baselines.map((baseline) => [baseline.brand, baseline.hashes]))
  const missing = new Set(input.missing.map((node) => frameKey(node.brand, node.nodeId)))

  const red: VerdictRow[] = []
  const passed: VerdictRow[] = []
  const listed: VerdictRow[] = []

  const unpairableReason = (brand: Brand | null, nodeId: string): string | null =>
    brand ? (input.ledger.unpairable[frameKey(brand, nodeId)]?.reason ?? null) : null

  for (const score of input.scores) {
    const base = {
      storyId: score.storyId,
      nodeId: score.nodeId,
      brand: score.brand,
      viewport: score.viewport,
    }
    const debris = unpairableReason(score.brand, score.nodeId)
    if (debris !== null) {
      listed.push({ ...base, kind: 'unpairable', key: null, detail: debris })
      continue
    }
    if (score.error !== undefined) {
      listed.push({ ...base, kind: 'unscored', key: null, detail: score.error })
      continue
    }

    const key = ledgerKey({
      host: input.host,
      storyId: score.storyId,
      designBrand: score.brand,
      nodeId: score.nodeId,
      viewport: score.viewport,
    })
    const entry = input.ledger.pairs[key]
    if (!entry) {
      listed.push({
        ...base,
        kind: 'new',
        key,
        detail: `scored ${percent(score.ratio)}, never accepted — review it and \`--accept\``,
      })
      continue
    }

    const current = hashes.get(score.brand)?.[score.nodeId] ?? null
    if (entry.nodeHash !== null && current !== null && current !== entry.nodeHash) {
      red.push({
        ...base,
        kind: 'unaccepted-change',
        key,
        detail:
          `the node changed since acceptance (${entry.nodeHash.slice(0, 12)} → ` +
          `${current.slice(0, 12)}); scored ${percent(score.ratio)} — look at it and re-accept`,
      })
      continue
    }

    const ceiling = entry.score + entry.tolerance
    if (score.ratio > ceiling) {
      red.push({
        ...base,
        kind: 'worsened',
        key,
        detail:
          `scored ${percent(score.ratio)}, accepted ${percent(entry.score)} ` +
          `± ${percent(entry.tolerance)}`,
      })
      continue
    }

    passed.push({
      ...base,
      kind: 'pass',
      key,
      detail:
        score.ratio < entry.score
          ? `improved to ${percent(score.ratio)} from ${percent(entry.score)}`
          : `${percent(score.ratio)} against ${percent(entry.score)} ± ${percent(entry.tolerance)}`,
    })
  }

  for (const row of input.unkeyed) {
    const base = { storyId: row.storyId, nodeId: row.nodeId, brand: row.brand, viewport: null }
    const debris = unpairableReason(row.brand, row.nodeId)
    if (debris !== null) {
      listed.push({ ...base, kind: 'unpairable', key: null, detail: debris })
      continue
    }
    if (row.brand && missing.has(frameKey(row.brand, row.nodeId))) {
      red.push({
        ...base,
        kind: 'orphaned',
        key: null,
        detail:
          'the Figma file no longer has this node — the design deleted it, or the id is stale',
      })
      continue
    }

    // Nothing was accepted at a hash this run's baseline disagrees with, so
    // nothing says the node changed: the pairing is uncovered, not broken.
    const current = row.brand ? (hashes.get(row.brand)?.[row.nodeId] ?? null) : null
    const accepted = acceptedHashes(input, row)
    if (current !== null && accepted.length > 0 && accepted.every((hash) => hash !== current)) {
      red.push({
        ...base,
        kind: 'no-export',
        key: null,
        detail: `the node changed and no export could be obtained for it — ${row.why}`,
      })
      continue
    }

    listed.push({ ...base, kind: 'untracked', key: null, detail: row.why })
  }

  for (const story of input.unpaired) {
    listed.push({
      kind: 'unpaired',
      key: null,
      storyId: story.id,
      nodeId: null,
      brand: null,
      viewport: null,
      detail: `${story.title} names no Figma node`,
    })
  }

  const order = (row: VerdictRow) => `${row.kind}/${row.storyId}/${row.nodeId ?? ''}`
  const by = (a: VerdictRow, b: VerdictRow) => order(a).localeCompare(order(b))
  return { red: red.sort(by), passed: passed.sort(by), listed: listed.sort(by) }
}

/**
 * Every hash this ledger accepted the (story, node) pair at, at any viewport —
 * which is how a pairing with no export this run can still be known to have
 * changed.
 */
function acceptedHashes(
  input: VerdictInput,
  row: { readonly storyId: string; readonly nodeId: string; readonly brand: Brand | null },
): string[] {
  if (!row.brand) return []
  const prefix = `${input.host}/${row.storyId}/${row.brand}/${row.nodeId}/`
  return Object.entries(input.ledger.pairs)
    .filter(([key, entry]) => key.startsWith(prefix) && entry.nodeHash !== null)
    .map(([, entry]) => entry.nodeHash as string)
}

/**
 * Whether the process exits non-zero.
 *
 * The reds always fail. `--strict` adds the pairings nobody has accepted, which
 * also used by the offline CI freshness check: locally a new pairing prompts review,
 * on a branch it is work that has not been reviewed yet.
 */
export function isFailing(plan: VerdictPlan, options: { readonly strict: boolean }): boolean {
  if (plan.red.length > 0) return true
  return options.strict && plan.listed.some((row) => row.kind === 'new')
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

function rows(list: readonly VerdictRow[]): readonly (readonly string[])[] {
  return list.map((row) => [row.kind, row.storyId, row.nodeId ?? '—', row.detail])
}

/**
 * The verdict, in the order a reader needs it: what failed and why, then what
 * held, then the states that are coverage rather than drift. Nothing is capped
 * — a silently truncated red is the stale pairing this gate exists to catch.
 */
export function formatVerdicts(plan: VerdictPlan, options: { readonly strict: boolean }): string {
  const sections: string[] = []

  sections.push(
    plan.red.length === 0
      ? `Verdict\n\n  no reds · ${plan.passed.length} within tolerance · ${plan.listed.length} listed`
      : `Red (${plan.red.length})\n\n` + table(['why', 'story', 'node', 'detail'], rows(plan.red)),
  )

  if (plan.passed.length > 0) {
    sections.push(
      `Within tolerance (${plan.passed.length})\n\n` +
        table(['why', 'story', 'node', 'detail'], rows(plan.passed)),
    )
  }

  if (plan.listed.length > 0) {
    const unaccepted = plan.listed.filter((row) => row.kind === 'new').length
    const strictly =
      options.strict && unaccepted > 0
        ? ` — except the ${unaccepted} \`new\`, which \`--strict\` fails the run for`
        : options.strict
          ? ''
          : ' — `--strict` reds the `new` ones, which is what a branch gate runs'
    sections.push(
      `Listed (${plan.listed.length})\n` +
        `  Reported, not failed${strictly}.\n\n` +
        table(['why', 'story', 'node', 'detail'], rows(plan.listed)),
    )
  }

  return sections.join('\n\n')
}

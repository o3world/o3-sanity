/**
 * The comparison itself: a story's capture against the frame it cites (#338).
 *
 * Three decisions live here, and each one is a choice about what the number at
 * the end of the run is allowed to mean.
 *
 * **The capture takes the frame's width, the frame is never resampled.**
 * `vr` shoots at 390 and 1440; the frames export at whatever the designer drew
 * them at — 1440, 402, 776 — so the two sides rarely agree on width. Scaling
 * one to the other resamples every glyph and every edge, and a resample puts a
 * blur floor into the score that has nothing to do with the code: text-dense
 * frames would read as drifted the moment the tool was pointed at them. So the
 * export is the authority on width and the browser is told to match it. The
 * export is drawn at scale 1 (`figma-exports.ts`) and `vr` captures at
 * `deviceScaleFactor: 1` with `scale: 'css'`, so one design pixel is then one
 * capture pixel with nothing in between. The viewport *height* is `vr`'s own —
 * the capture is full-page, so height only decides what `100vh` resolves to.
 *
 * **The score is the diff-pixel ratio over the comparison canvas**, in
 * `compare.ts`'s own terms and through `compare.ts`'s own code: same
 * pixelmatch, same per-pixel threshold, same union canvas. Pixel identity is
 * unreachable across two renderers (spec #326 → Gate semantics), so the number
 * is a relative one — stable run to run under the existing freeze, and
 * therefore comparable against its own earlier self, which is all the
 * ledger asks of it. Nothing here decides whether a score is good; there are
 * no verdicts in this file.
 *
 * **The canvas is the union of the two sizes, and the height delta is
 * reported beside the score rather than normalised away.** A band that is 200
 * pixels shorter than its frame is the drift, not an inconvenience on the way
 * to measuring the drift: cropping to the shorter of the two would delete
 * exactly the evidence. So the shorter image is padded transparent and those
 * pixels count as differing — `compare.ts` already made this choice for the
 * same reason — and `heightDelta`/`widthDelta` are carried out separately so a
 * reader can tell a tall story from a wrong one.
 *
 * Pure but for the two image reads `compare` does. `planFrameScoring` takes
 * the index, the pairings and the exports it was handed; the CLI does the
 * builds, the captures and the writes.
 */
import path from 'node:path'

import type { Shot, Viewport } from './capture'
import { compare, type Comparison } from './compare'
import type { PairingRow } from './pairing'
import type { Brand, StoryEntry } from './storybook'

/** One cached frame export, with the size read off the PNG. */
export interface FrameExport {
  readonly brand: Brand
  readonly nodeId: string
  /** Absolute path to the cached PNG. */
  readonly file: string
  readonly width: number
  readonly height: number
}

/** A story, a node, and the geometry the pair is compared at. */
export interface ScoreTarget {
  readonly story: StoryEntry
  readonly brand: Brand
  readonly nodeId: string
  readonly frame: FrameExport
  readonly viewport: Viewport
}

/** A paired story whose node no export could be keyed to — listed, not failed. */
export interface UnkeyedPairing {
  readonly storyId: string
  readonly nodeId: string
  readonly brand: Brand | null
  readonly why: string
}

export interface ScoringPlan {
  readonly targets: readonly ScoreTarget[]
  /** In scope, declares no `figmaDesign` node at all. */
  readonly unpaired: readonly StoryEntry[]
  readonly unkeyed: readonly UnkeyedPairing[]
}

/**
 * `vr`'s two viewport heights, picked by which side of the desktop breakpoint
 * the frame sits. Only `100vh` and friends can see it — the shutter is
 * full-page — so the frame's own height is deliberately not used: a 10,000px
 * design frame is a scroll of a page, not a window that tall.
 */
const DESKTOP_FROM = 1024
const MOBILE_HEIGHT = 844
const DESKTOP_HEIGHT = 900

/**
 * The narrowest window the site's CSS is written for, and the floor the
 * capture width cannot go under.
 *
 * A component set's frame is not a viewport: the icon sets export at 24px, and
 * a browser told to be 24px wide renders a story nothing in the design ever
 * described. Below the floor the capture is taken at a width the layout can
 * answer for, and the width delta then carries the fact — a pairing whose
 * frame is 24px against a 320px capture says "this cites a component, not a
 * page" in the one column a reader is already looking at.
 */
const MIN_CAPTURE_WIDTH = 320

/** The viewport a frame of this width is compared at. */
export function frameViewport(width: number): Viewport {
  const captured = Math.max(width, MIN_CAPTURE_WIDTH)
  return {
    name: `frame-${captured}`,
    width: captured,
    height: captured >= DESKTOP_FROM ? DESKTOP_HEIGHT : MOBILE_HEIGHT,
  }
}

/** How the export map and the reason map are keyed. */
export function frameKey(brand: Brand | string, nodeId: string): string {
  return `${brand}/${nodeId}`
}

/**
 * What this run can score, and what it can only list.
 *
 * `stories` is the run's scope — the Storybook index, already filtered by
 * `--story` and by `vr:skip`. A story with no pairing is `unpaired` and a
 * pairing with no export is `unkeyed`: both are rows on the report, neither is
 * a failure (spec #326 → Coverage is reported, never gated).
 *
 * One target per (story, node). Two stories citing one frame each get their
 * own comparison against the same export, which is what a component set with
 * six stories should look like; a story citing two nodes gets two.
 */
export function planFrameScoring(input: {
  readonly stories: readonly StoryEntry[]
  readonly pairings: readonly PairingRow[]
  readonly exports: ReadonlyMap<string, FrameExport>
  /** Why a node has no export, keyed by `frameKey`. From the export plan. */
  readonly reasons?: ReadonlyMap<string, string>
}): ScoringPlan {
  const byStory = new Map<string, PairingRow[]>()
  for (const row of input.pairings) {
    if (!row.storyId) continue
    byStory.set(row.storyId, [...(byStory.get(row.storyId) ?? []), row])
  }

  const targets: ScoreTarget[] = []
  const unpaired: StoryEntry[] = []
  const unkeyed: UnkeyedPairing[] = []
  const seen = new Set<string>()

  for (const story of input.stories) {
    const rows = byStory.get(story.id) ?? []
    if (rows.length === 0) {
      unpaired.push(story)
      continue
    }
    for (const row of rows) {
      const key = frameKey(row.designBrand ?? '?', row.nodeId)
      const found = row.designBrand ? input.exports.get(key) : undefined
      if (!found) {
        unkeyed.push({
          storyId: story.id,
          nodeId: row.nodeId,
          brand: row.designBrand,
          why: input.reasons?.get(key) ?? 'no export cached for this node',
        })
        continue
      }
      const targetKey = `${story.id}/${key}`
      if (seen.has(targetKey)) continue
      seen.add(targetKey)
      targets.push({
        story,
        brand: found.brand,
        nodeId: found.nodeId,
        frame: found,
        viewport: frameViewport(found.width),
      })
    }
  }

  const order = (target: ScoreTarget) => `${target.story.id}/${target.nodeId}`
  return {
    targets: [...targets].sort((a, b) => order(a).localeCompare(order(b))),
    unpaired: [...unpaired].sort((a, b) => a.id.localeCompare(b.id)),
    unkeyed: [...unkeyed].sort(
      (a, b) => a.storyId.localeCompare(b.storyId) || a.nodeId.localeCompare(b.nodeId),
    ),
  }
}

/** One scored pair: the comparison the report renders, plus what it measured. */
export interface FrameScore {
  readonly storyId: string
  readonly nodeId: string
  readonly brand: Brand
  readonly viewport: string
  /** Diff pixels over the union canvas, 0–1. The scalar the ledger records. */
  readonly ratio: number
  readonly changedPixels: number
  /** Capture height minus frame height, in pixels. Signal, not noise. */
  readonly heightDelta: number
  readonly widthDelta: number
  readonly error?: string
  /** What the report renders: the frame stands where the baseline stood. */
  readonly comparison: Comparison
}

/**
 * Score one pair.
 *
 * The mechanics are `compare`'s, unchanged, with the frame export handed in
 * where the merge-base screenshot normally goes. The one extension: the diff
 * image is written for every pair rather than only for a pair over some
 * threshold — the report's slider and onion views are the point of a `--figma`
 * run even when the score is small, and there is no "unchanged" here to
 * suppress. That is what the negative `maxDiffRatio` says.
 */
export function scoreFrame(options: {
  readonly capture: Shot
  readonly frame: FrameExport
  readonly nodeId: string
  readonly brand: Brand
  readonly diffDir: string
  readonly threshold: number
}): FrameScore {
  const baseline: Shot = { ...options.capture, file: options.frame.file }
  const comparison = compare({
    baseline,
    current: options.capture,
    // Per node, so two stories scored against different frames cannot write
    // their diffs to one filename.
    diffDir: path.join(options.diffDir, options.nodeId.replaceAll(':', '-')),
    threshold: options.threshold,
    maxDiffRatio: -1,
  })

  return {
    storyId: comparison.storyId,
    nodeId: options.nodeId,
    brand: options.brand,
    viewport: comparison.viewport,
    ratio: comparison.ratio,
    changedPixels: comparison.changedPixels,
    heightDelta: (comparison.currentSize?.height ?? 0) - (comparison.baselineSize?.height ?? 0),
    widthDelta: (comparison.currentSize?.width ?? 0) - (comparison.baselineSize?.width ?? 0),
    error: comparison.error,
    comparison,
  }
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

function percent(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`
}

function delta(value: number): string {
  return value === 0 ? '—' : `${value > 0 ? '+' : ''}${value}px`
}

/**
 * The run's account of itself: every score, then the two lists that are
 * coverage rather than drift. Neither list is capped — see the export report,
 * which makes the same promise for the same reason.
 */
export function formatScoring(plan: ScoringPlan, scores: readonly FrameScore[]): string {
  const sections: string[] = []

  sections.push(
    `Scored against Figma (${scores.length})\n\n` +
      (scores.length === 0
        ? '  none'
        : table(
            ['story', 'node', 'viewport', 'score', 'diff px', 'height Δ', 'width Δ'],
            [...scores]
              .sort((a, b) => b.ratio - a.ratio)
              .map((score) => [
                score.storyId,
                score.nodeId,
                score.viewport,
                score.error ? '—' : percent(score.ratio),
                score.error ?? String(score.changedPixels),
                score.error ? '' : delta(score.heightDelta),
                // Rarely zero and always worth reading: a full-page shutter
                // captures the document's scroll width, so a capture wider
                // than its viewport is a story overflowing sideways.
                score.error ? '' : delta(score.widthDelta),
              ]),
          )),
  )

  if (plan.unkeyed.length > 0) {
    sections.push(
      `Unkeyed (${plan.unkeyed.length})\n` +
        '  Paired, but no frame export is keyed to the node — not a failure.\n\n' +
        table(
          ['story', 'node', 'why'],
          plan.unkeyed.map((row) => [row.storyId, row.nodeId, row.why]),
        ),
    )
  }

  if (plan.unpaired.length > 0) {
    sections.push(
      `Unpaired (${plan.unpaired.length})\n` +
        '  In scope, naming no Figma node — not a failure.\n\n' +
        table(
          ['story', 'title'],
          plan.unpaired.map((story) => [story.id, story.title]),
        ),
    )
  }

  return sections.join('\n\n')
}

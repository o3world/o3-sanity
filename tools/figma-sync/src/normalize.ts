/**
 * Normalize a Figma node subtree into something that hashes to the same value
 * on two reads that mean the same design (#78).
 *
 * This is the correctness-critical seam. A hash that moves on its own turns
 * every run into a phantom diff and the report stops being worth reading, so
 * anything the API reports that is *not* the design gets stripped here — and
 * every strip is a judgement call that has to be written down.
 *
 * ## What is stripped, and why
 *
 * | Field                                            | Why it goes                                                                                                                                          |
 * | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
 * | `absoluteBoundingBox.x/y`, `absoluteRenderBounds.x/y` | Canvas coordinates. Dragging a frame to a free spot on the canvas shifts **every descendant's** absolute position — the loudest possible phantom diff. |
 * | `scrollBehavior`                                 | Viewport/scroll metadata, per the ticket; it is set by frame nesting, not by a designer, and flips on nodes nobody touched.                             |
 * | `layoutVersion`                                  | Undocumented internal counter. It increments when Figma's own layout engine changes — a version bump on their side, not a change on ours.               |
 * | `devStatus`                                      | Dev Mode workflow state ("ready for dev"). Marking a frame ready is not a design change.                                                                |
 * | `interactions`, `transitionNodeID`, `transitionDuration`, `transitionEasing`, `prototypeStartNodeID`, `prototypeDevice`, `flowStartingPoints` | Prototype wiring. It churns whenever someone rigs a click-through for a demo, and no downstream consumer of this pipeline reads it. |
 * | empty arrays/objects, `null`, `undefined`        | The API includes or omits empty collections inconsistently between reads and between node types. Absent and empty must mean the same thing.              |
 *
 * ## What is kept, deliberately
 *
 * - `relativeTransform` — position **within the parent**. Unaffected by canvas
 *   moves, so it is the honest record of "this element moved", and stripping
 *   both it and the absolute box would make an absolutely-positioned child
 *   invisible to the diff.
 * - `absoluteBoundingBox`/`absoluteRenderBounds` width and height, rounded to
 *   whole pixels: real size changes matter, sub-pixel render jitter does not.
 * - Node `id`s — stable in Figma, and they say *which* layer changed.
 * - Child order — z-order is design.
 *
 * Every other number is rounded to two decimals: Figma serializes floats with
 * enough precision that the last digit wobbles between reads.
 */

/** Dropped wherever they appear in the subtree. See the table above. */
const STRIPPED_KEYS = new Set([
  'scrollBehavior',
  'layoutVersion',
  'devStatus',
  'interactions',
  'transitionNodeID',
  'transitionDuration',
  'transitionEasing',
  'prototypeStartNodeID',
  'prototypeDevice',
  'flowStartingPoints',
])

/** Boxes whose `x`/`y` are canvas coordinates; width/height survive, rounded. */
const ABSOLUTE_BOX_KEYS = new Set(['absoluteBoundingBox', 'absoluteRenderBounds'])

const round = (n: number, places: number): number => {
  if (!Number.isFinite(n)) return n
  const factor = 10 ** places
  // `+ 0` normalises -0 to 0, which JSON.stringify would otherwise emit as `0`
  // in one place and `-0` in another depending on how it was produced.
  return Math.round(n * factor) / factor + 0
}

const isEmpty = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)

function normalizeBox(box: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const key of ['height', 'width']) {
    const value = box[key]
    if (typeof value === 'number') out[key] = round(value, 0)
  }
  return out
}

/**
 * Depth-first rewrite: strip, round, sort keys, drop empties. Arrays keep
 * their order. Returns a plain JSON value ready for `stableStringify`.
 */
export function normalizeNode(node: unknown): unknown {
  if (typeof node === 'number') return round(node, 2)
  if (node === null || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(normalizeNode)

  const source = node as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(source).sort()) {
    if (STRIPPED_KEYS.has(key)) continue
    const raw = source[key]
    if (ABSOLUTE_BOX_KEYS.has(key)) {
      if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
        const box = normalizeBox(raw as Record<string, unknown>)
        if (!isEmpty(box)) out[key] = box
      }
      continue
    }
    const value = normalizeNode(raw)
    if (isEmpty(value)) continue
    out[key] = value
  }
  return out
}
